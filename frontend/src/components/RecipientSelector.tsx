import { useState, useCallback } from "react";
import { ArrowLeft, BookImage, Loader2, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Principal } from "@icp-sdk/core/principal";
import { useAppStore } from "../hooks/useAppStore";
import {
  useFriends,
  useGroups,
  usePostStory,
  useSendSnap,
} from "../hooks/useQueries";

export function RecipientSelector() {
  const {
    editedMediaBlob,
    capturedMediaType,
    expirationSeconds,
    setExpirationSeconds,
    setView,
    conversationFriend,
  } = useAppStore();

  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    () => {
      if (conversationFriend) {
        return new Set([conversationFriend.principal]);
      }
      return new Set();
    },
  );
  const [activeGroupIds, setActiveGroupIds] = useState<Set<number>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { data: friends, isLoading, isError } = useFriends();
  const { data: groups } = useGroups();
  const { mutate: sendSnap, isPending: isSending } = useSendSnap();
  const { mutate: postStory, isPending: isPostingStoryPending } =
    usePostStory();

  const isBusy = isSending || isPostingStoryPending;
  const actualMediaType =
    capturedMediaType === "video"
      ? editedMediaBlob?.type || "video/webm"
      : "image/jpeg";

  const getMediaBytes = async () => {
    const arrayBuffer = await editedMediaBlob!.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  };

  const toggleRecipient = (principalText: string) => {
    setSelectedRecipients((prev) => {
      const next = new Set(prev);
      if (next.has(principalText)) {
        next.delete(principalText);
      } else {
        next.add(principalText);
      }
      return next;
    });
  };

  const toggleGroup = useCallback(
    (group: { id: bigint; members: Array<{ principal: Principal }> }) => {
      const groupId = Number(group.id);
      const wasActive = activeGroupIds.has(groupId);

      setActiveGroupIds((prev) => {
        const next = new Set(prev);
        if (wasActive) {
          next.delete(groupId);
        } else {
          next.add(groupId);
        }
        return next;
      });

      setSelectedRecipients((prev) => {
        const next = new Set(prev);
        if (wasActive) {
          // Deselect: remove group members unless they belong to another active group
          const otherActiveMembers = new Set<string>();
          if (groups) {
            for (const g of groups) {
              if (
                Number(g.id) !== groupId &&
                activeGroupIds.has(Number(g.id))
              ) {
                for (const m of g.members) {
                  otherActiveMembers.add(m.principal.toString());
                }
              }
            }
          }
          for (const m of group.members) {
            const pt = m.principal.toString();
            if (!otherActiveMembers.has(pt)) {
              next.delete(pt);
            }
          }
        } else {
          // Select: add all group members
          for (const m of group.members) {
            next.add(m.principal.toString());
          }
        }
        return next;
      });
    },
    [activeGroupIds, groups],
  );

  const handleSend = async () => {
    if (!editedMediaBlob || selectedRecipients.size === 0 || !friends) return;

    const recipients: Principal[] = friends
      .filter((f) => selectedRecipients.has(f.principal.toString()))
      .map((f) => f.principal);

    const mediaBytes = await getMediaBytes();

    sendSnap(
      {
        recipients,
        mediaBytes,
        mediaType: actualMediaType,
        expirationSeconds,
        onProgress: (pct) => setUploadProgress(pct),
      },
      {
        onSuccess: () => {
          toast.success(
            `Snap sent to ${selectedRecipients.size} friend${selectedRecipients.size > 1 ? "s" : ""}`,
          );
          setUploadProgress(null);
          setView(conversationFriend ? "conversation" : "inbox");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to send snap");
          setUploadProgress(null);
        },
      },
    );
  };

  const handlePostStory = async () => {
    if (!editedMediaBlob) return;

    const mediaBytes = await getMediaBytes();

    postStory(
      {
        mediaBytes,
        mediaType: actualMediaType,
        onProgress: (pct) => setUploadProgress(pct),
      },
      {
        onSuccess: () => {
          toast.success("Posted to your story");
          setUploadProgress(null);
          setView("inbox");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to post story");
          setUploadProgress(null);
        },
      },
    );
  };

  const handleBack = () => {
    setView("editor");
  };

  if (!editedMediaBlob) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
        <p className="text-muted-foreground">No media to send</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setView("camera")}
        >
          Go to Camera
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[60vh]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={isBusy}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <span className="text-sm font-medium">Send to</span>
        <div className="w-16" />
      </div>

      {/* Timer slider — only for images, videos use their own duration */}
      {capturedMediaType !== "video" && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">View time</span>
            <span className="text-sm font-medium">{expirationSeconds}s</span>
          </div>
          <Slider
            value={[expirationSeconds]}
            onValueChange={([val]) => setExpirationSeconds(val)}
            min={1}
            max={10}
            step={1}
            disabled={isBusy}
          />
        </div>
      )}

      {/* Recipients list */}
      <ScrollArea className="flex-1">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {isError && (
          <div className="py-12 text-center text-sm text-destructive">
            Failed to load friends.
          </div>
        )}
        {friends && friends.length === 0 && (
          <div className="py-12 text-center px-6">
            <p className="text-sm text-muted-foreground">
              No friends yet. Add friends to send snaps!
            </p>
          </div>
        )}

        {/* Groups section */}
        {groups && groups.length > 0 && (
          <>
            <div className="px-4 pt-2 pb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Groups
              </p>
            </div>
            {groups.map((group) => {
              const isActive = activeGroupIds.has(Number(group.id));
              const memberPrincipals = group.members.map((m) =>
                m.principal.toString(),
              );
              const allSelected =
                memberPrincipals.length > 0 &&
                memberPrincipals.every((pt) => selectedRecipients.has(pt));
              const someSelected =
                memberPrincipals.some((pt) => selectedRecipients.has(pt)) &&
                !allSelected;

              return (
                <div
                  key={Number(group.id)}
                  role="button"
                  tabIndex={0}
                  onClick={() => !isBusy && toggleGroup(group)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !isBusy) {
                      e.preventDefault();
                      toggleGroup(group);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer",
                    isBusy && "opacity-50 pointer-events-none",
                  )}
                >
                  <Checkbox
                    checked={
                      isActive || allSelected
                        ? true
                        : someSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={() => !isBusy && toggleGroup(group)}
                    onClick={(e) => e.stopPropagation()}
                    tabIndex={-1}
                  />
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {group.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {group.members.length} member
                      {group.members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Friends
              </p>
            </div>
          </>
        )}

        {friends?.map((friend) => {
          const principalText = friend.principal.toString();
          const isSelected = selectedRecipients.has(principalText);
          return (
            <div
              key={principalText}
              role="button"
              tabIndex={0}
              onClick={() => !isBusy && toggleRecipient(principalText)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isBusy) {
                  e.preventDefault();
                  toggleRecipient(principalText);
                }
              }}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer",
                isBusy && "opacity-50 pointer-events-none",
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() =>
                  !isBusy && toggleRecipient(principalText)
                }
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
              />
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm font-medium">
                  {friend.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {friend.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{friend.username}
                </p>
              </div>
            </div>
          );
        })}
      </ScrollArea>

      {/* Action buttons */}
      <div className="flex gap-2 px-4 py-3 bg-card">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handlePostStory}
          disabled={isBusy}
        >
          {isPostingStoryPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadProgress !== null
                ? `${Math.round(uploadProgress)}%`
                : "Posting..."}
            </>
          ) : (
            <>
              <BookImage className="h-4 w-4" />
              Post to Story
            </>
          )}
        </Button>
        <Button
          className="flex-1"
          onClick={handleSend}
          disabled={isBusy || selectedRecipients.size === 0}
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadProgress !== null
                ? `${Math.round(uploadProgress)}%`
                : "Sending..."}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send to {selectedRecipients.size || ""} Friend
              {selectedRecipients.size !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
