import { useCallback, useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "../hooks/useAppStore";
import { useViewSnap } from "../hooks/useQueries";
import { useScreenshotDetection } from "../hooks/useScreenshotDetection";

export function SnapViewer() {
  const { viewingSnapId, setViewingSnapId } = useAppStore();
  const { mutateAsync: viewSnap } = useViewSnap();
  const [progress, setProgress] = useState(100);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState("image/jpeg");
  const [expirationSeconds, setExpirationSeconds] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoClosingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCalledRef = useRef(false);
  const pausedProgressRef = useRef<number | null>(null);

  const isVideo = mediaType.startsWith("video/");

  const { triggered, dismiss } = useScreenshotDetection(viewingSnapId !== null);

  // Pause/resume video and timer when screenshot detected
  useEffect(() => {
    if (triggered) {
      // Pause video
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      // Pause image timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        pausedProgressRef.current = progress;
      }
    }
  }, [triggered]);

  // Reset all state when a new snap is opened
  useEffect(() => {
    if (viewingSnapId !== null) {
      setProgress(100);
      setMediaUrl(null);
      setMediaType("image/jpeg");
      setExpirationSeconds(5);
      setIsLoading(true);
      setLoadError(null);
      setVideoEnded(false);
      videoClosingRef.current = false;
      hasCalledRef.current = false;
      pausedProgressRef.current = null;
    }
  }, [viewingSnapId]);

  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setViewingSnapId(null);
  }, [setViewingSnapId]);

  const handleDismissScreenshot = useCallback(() => {
    dismiss();
    // Resume video
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play();
    }
    // Resume image timer from where it paused
    if (!isVideo && mediaUrl && pausedProgressRef.current !== null) {
      const remainingProgress = pausedProgressRef.current;
      const duration = expirationSeconds * 1000;
      const remainingTime = (remainingProgress / 100) * duration;
      const startTime = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(
          0,
          remainingProgress - (elapsed / remainingTime) * remainingProgress,
        );
        setProgress(remaining);

        if (remaining <= 0) {
          handleClose();
        }
      }, 50);
      pausedProgressRef.current = null;
    }
  }, [dismiss, isVideo, mediaUrl, expirationSeconds, handleClose]);

  // Fetch media and mark as viewed in a single call
  useEffect(() => {
    if (viewingSnapId === null || hasCalledRef.current) return;
    hasCalledRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const result = await viewSnap(viewingSnapId);
        if (cancelled) return;
        setMediaUrl(result.mediaBlob.getDirectURL());
        setMediaType(result.mediaType);
        setExpirationSeconds(Number(result.expirationSeconds));
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Failed to load snap");
        setLoadError(
          err instanceof Error ? err.message : "Failed to load snap",
        );
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewingSnapId, viewSnap]);

  // Track video playback progress (video uses its own duration, no expiration timer)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo || !mediaUrl) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        const remaining = 100 - (video.currentTime / video.duration) * 100;
        setProgress(remaining);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [isVideo, mediaUrl]);

  // Close when video ends
  useEffect(() => {
    if (isVideo && videoEnded && !videoClosingRef.current) {
      videoClosingRef.current = true;
      handleClose();
    }
  }, [isVideo, videoEnded, handleClose]);

  // Start expiration countdown for images only
  useEffect(() => {
    if (!mediaUrl || isVideo || triggered) return;

    const duration = expirationSeconds * 1000;
    const intervalMs = 50;
    const startTime = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        handleClose();
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mediaUrl, expirationSeconds, handleClose, isVideo, triggered]);

  return (
    <Dialog
      open={viewingSnapId !== null}
      onOpenChange={(open) => {
        if (!open && !triggered) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="!inset-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-screen !rounded-none !border-0 !p-0 !bg-black !gap-0 !flex !flex-col data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100"
      >
        <DialogTitle className="sr-only">Viewing snap</DialogTitle>
        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-white text-center px-6">{loadError}</p>
            <Button
              variant="ghost"
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Back to Inbox
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-full relative">
            <div className="px-4 pt-[env(safe-area-inset-top)]">
              <Progress
                value={progress}
                className="h-1 bg-white/20 [&_[data-slot=progress-indicator]]:bg-white"
              />
            </div>

            <div className="flex items-center justify-end px-4 py-2">
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="ephemeral-media flex-1 flex items-center justify-center overflow-hidden">
              {isLoading || !mediaUrl ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : isVideo ? (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full object-contain"
                  onEnded={() => setVideoEnded(true)}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Snap"
                  className="max-w-full max-h-full object-contain select-none pointer-events-none"
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
                    Click anywhere to return to the snap
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
