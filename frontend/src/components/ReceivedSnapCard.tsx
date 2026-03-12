import { Flame, Image, Timer } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { timeAgo } from "../utils/formatting";
import { useAppStore } from "../hooks/useAppStore";

interface ReceivedSnapCardProps {
  snapId: bigint;
  senderName: string;
  expirationSeconds: bigint;
  createdAt: bigint;
  isViewed: boolean;
  streakCount?: number;
  isAtRisk?: boolean;
}

export function ReceivedSnapCard({
  snapId,
  senderName,
  expirationSeconds,
  createdAt,
  isViewed,
  streakCount,
  isAtRisk,
}: ReceivedSnapCardProps) {
  const { setViewingSnapId } = useAppStore();

  const handleOpen = () => {
    if (isViewed) return;
    setViewingSnapId(Number(snapId));
  };

  return (
    <button
      onClick={handleOpen}
      disabled={isViewed}
      className={cn(
        "flex items-center gap-3 px-4 py-3 w-full text-left transition-colors",
        isViewed
          ? "opacity-50 cursor-default"
          : "hover:bg-muted/50 active:bg-muted",
      )}
    >
      <Avatar
        className={cn(
          "h-10 w-10",
          !isViewed &&
            "ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
      >
        <AvatarFallback className="text-sm font-medium">
          {senderName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className={cn(
              "text-sm truncate",
              isViewed
                ? "text-muted-foreground"
                : "font-semibold text-foreground",
            )}
          >
            {senderName}
          </p>
          {!!streakCount && streakCount > 0 && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-semibold shrink-0",
                isAtRisk ? "text-amber-500" : "text-orange-500",
              )}
            >
              <Flame className="h-3 w-3" />
              {streakCount}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {isViewed ? "Opened" : "Tap to view"} · {timeAgo(createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        {isViewed ? (
          <Image className="h-4 w-4" />
        ) : (
          <>
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-xs text-primary font-medium">
              {Number(expirationSeconds)}s
            </span>
          </>
        )}
      </div>
    </button>
  );
}
