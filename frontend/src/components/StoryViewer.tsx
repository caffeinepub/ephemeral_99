import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "../hooks/useAppStore";
import {
  useFriendsStories,
  useMyStories,
  useGetStoryMedia,
} from "../hooks/useQueries";
import { type AuthorGroup, groupStoriesByAuthor } from "../utils/stories";
import { storyTimeRemaining } from "../utils/formatting";
import { useScreenshotDetection } from "../hooks/useScreenshotDetection";

const STORY_DURATION_MS = 5000;

export function StoryViewer() {
  const {
    viewingStoryUserId,
    viewingStoryIndex,
    setViewingStoryUserId,
    setViewingStoryIndex,
  } = useAppStore();

  const { data: friendsStories, isError: isFriendsError } = useFriendsStories();
  const { data: myStories, isError: isMyError } = useMyStories();
  const { mutate: getStoryMedia, isPending: isMediaLoading } =
    useGetStoryMedia();

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState("image/jpeg");
  const [progress, setProgress] = useState(0);
  const [storyDuration, setStoryDuration] = useState(STORY_DURATION_MS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedProgressRef = useRef<number | null>(null);

  const isVideo = mediaType.startsWith("video/");

  const { triggered, dismiss } = useScreenshotDetection(
    viewingStoryUserId !== null,
  );

  // Pause/resume video and timer when screenshot detected
  useEffect(() => {
    if (triggered) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        pausedProgressRef.current = progress;
      }
    }
  }, [triggered]);

  // Reset state when viewer opens
  useEffect(() => {
    if (viewingStoryUserId !== null) {
      setMediaUrl(null);
      setMediaType("image/jpeg");
      setProgress(0);
      setStoryDuration(STORY_DURATION_MS);
      pausedProgressRef.current = null;
    }
  }, [viewingStoryUserId]);

  // Build ordered author groups: own stories first, then friends
  const authorGroups = useMemo(() => {
    const groups: AuthorGroup[] = [];

    if (myStories && myStories.length > 0) {
      groups.push({
        authorPrincipal: "self",
        authorName: "My Story",
        authorUsername: "",
        stories: [...myStories].sort(
          (a, b) => Number(b.createdAt) - Number(a.createdAt),
        ),
      });
    }

    groups.push(...groupStoriesByAuthor(friendsStories ?? []));
    return groups;
  }, [friendsStories, myStories]);

  // Find current author group index
  const currentGroupIndex = authorGroups.findIndex(
    (g) => g.authorPrincipal === viewingStoryUserId,
  );
  const currentGroup = authorGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[viewingStoryIndex];

  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setViewingStoryUserId(null);
    setViewingStoryIndex(0);
  }, [setViewingStoryUserId, setViewingStoryIndex]);

  const goToStory = useCallback(
    (groupIdx: number, storyIdx: number) => {
      const group = authorGroups[groupIdx];
      if (!group) {
        handleClose();
        return;
      }
      if (storyIdx < 0 || storyIdx >= group.stories.length) {
        if (storyIdx >= group.stories.length) {
          if (groupIdx + 1 < authorGroups.length) {
            setViewingStoryUserId(authorGroups[groupIdx + 1].authorPrincipal);
            setViewingStoryIndex(0);
          } else {
            handleClose();
          }
        } else {
          if (groupIdx > 0) {
            const prevGroup = authorGroups[groupIdx - 1];
            setViewingStoryUserId(prevGroup.authorPrincipal);
            setViewingStoryIndex(prevGroup.stories.length - 1);
          }
        }
        return;
      }
      setViewingStoryUserId(group.authorPrincipal);
      setViewingStoryIndex(storyIdx);
    },
    [authorGroups, handleClose, setViewingStoryUserId, setViewingStoryIndex],
  );

  const handleNext = useCallback(() => {
    goToStory(currentGroupIndex, viewingStoryIndex + 1);
  }, [currentGroupIndex, viewingStoryIndex, goToStory]);

  const handlePrev = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed > 1000 && viewingStoryIndex >= 0) {
      setProgress(0);
      startTimeRef.current = Date.now();
      // Restart video if playing
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
      return;
    }
    goToStory(currentGroupIndex, viewingStoryIndex - 1);
  }, [currentGroupIndex, viewingStoryIndex, goToStory]);

  const handleVideoLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && isFinite(video.duration)) {
      setStoryDuration(video.duration * 1000);
    }
  }, []);

  const handleDismissScreenshot = useCallback(() => {
    dismiss();
    // Resume video
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play();
    }
    // Resume image timer from where it paused
    if (!isVideo && mediaUrl && pausedProgressRef.current !== null) {
      const remainingProgress = 100 - pausedProgressRef.current;
      const remainingTime = (remainingProgress / 100) * storyDuration;
      const startTime = Date.now();

      startTimeRef.current =
        Date.now() - (pausedProgressRef.current / 100) * storyDuration;

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(
          100,
          pausedProgressRef.current! +
            (elapsed / remainingTime) * remainingProgress,
        );
        setProgress(pct);
        if (pct >= 100) {
          handleNext();
        }
      }, 50);
      pausedProgressRef.current = null;
    }
  }, [dismiss, isVideo, mediaUrl, storyDuration, handleNext]);

  // Fetch media when story changes
  useEffect(() => {
    if (!currentStory) return;
    setMediaUrl(null);
    setStoryDuration(STORY_DURATION_MS);
    setMediaType("image/jpeg");

    getStoryMedia(currentStory.storyId, {
      onSuccess: (result) => {
        setMediaUrl(result.mediaBlob.getDirectURL());
        setMediaType(result.mediaType);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to load story");
      },
    });
  }, [currentStory?.storyId, getStoryMedia]);

  // Auto-progress timer
  useEffect(() => {
    if (!mediaUrl || triggered) return;

    setProgress(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (isVideo) {
        const video = videoRef.current;
        if (video) {
          const dur = video.duration;
          if (isFinite(dur) && dur > 0) {
            setProgress(Math.min(100, (video.currentTime / dur) * 100));
          } else {
            const elapsed = Date.now() - startTimeRef.current;
            setProgress(Math.min(99, (elapsed / 60_000) * 100));
          }
        }
      } else {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(100, (elapsed / storyDuration) * 100);
        setProgress(pct);
        if (pct >= 100) {
          handleNext();
        }
      }
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mediaUrl, storyDuration, handleNext, isVideo, triggered]);

  // Handle tap zones
  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 3) {
        handlePrev();
      } else {
        handleNext();
      }
    },
    [handlePrev, handleNext],
  );

  return (
    <Dialog
      open={viewingStoryUserId !== null}
      onOpenChange={(open) => {
        if (!open && !triggered) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="!inset-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-screen !rounded-none !border-0 !p-0 !bg-black !gap-0 !flex !flex-col data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100"
      >
        <DialogTitle className="sr-only">Viewing story</DialogTitle>
        {isFriendsError || isMyError || !currentGroup || !currentStory ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {isFriendsError || isMyError ? (
              <p className="text-white/80 text-sm">Failed to load stories</p>
            ) : (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            )}
            <button
              onClick={handleClose}
              className="text-white/60 hover:text-white text-sm"
            >
              Back to Inbox
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full relative">
            {/* Progress bars */}
            <div
              className="flex gap-1 px-3 pt-2"
              style={{
                paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
              }}
            >
              {currentGroup.stories.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white rounded-full transition-none"
                    style={{
                      width:
                        i < viewingStoryIndex
                          ? "100%"
                          : i === viewingStoryIndex
                            ? `${progress}%`
                            : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {currentGroup.authorName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">
                    {currentGroup.authorPrincipal === "self"
                      ? "My Story"
                      : currentGroup.authorName}
                  </span>
                  <span className="text-white/50 text-xs">
                    {storyTimeRemaining(currentStory.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Media display with tap zones */}
            <div
              className="ephemeral-media flex-1 flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={triggered ? undefined : handleTap}
            >
              {isMediaLoading || !mediaUrl ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : isVideo ? (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full object-contain"
                  draggable={false}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onEnded={handleNext}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Story"
                  className="max-w-full max-h-full object-contain select-none pointer-events-none"
                  draggable={false}
                />
              )}
            </div>

            {triggered && (
              <div
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl cursor-pointer"
                onClick={handleDismissScreenshot}
              >
                <div className="bg-white rounded-2xl px-6 py-4 mx-8 text-center shadow-lg">
                  <p className="text-black font-semibold text-base">
                    Looks like you're trying to take a screenshot!
                  </p>
                  <p className="text-black/50 text-sm mt-1">
                    Click anywhere to return to the story
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
