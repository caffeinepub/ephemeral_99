import { Flame } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { shortTimeAgo } from "../utils/formatting";
import { SNAP_RED, SNAP_PURPLE, SNAP_GRAY } from "../utils/constants";
import { useAppStore } from "../hooks/useAppStore";
import { SnapArrow } from "./SnapArrow";
import { SnapSquare } from "./SnapSquare";

interface ChatRowProps {
  friendPrincipal: string;
  friendName: string;
  friendUsername: string;
  lastActivityAt: bigint;
  lastActivityType: string;
  unviewedSnapId: bigint | null | undefined;
  unviewedSnapCount: bigint;
  streakCount: bigint;
  streakAtRisk: boolean;
  isFriend: boolean;
}

export function ChatRow({
  friendPrincipal,
  friendName,
  friendUsername,
  lastActivityAt,
  lastActivityType,
  unviewedSnapId,
  unviewedSnapCount,
  streakCount,
  streakAtRisk,
  isFriend,
}: ChatRowProps) {
  const { setView, setConversationFriend, conversationFriend } = useAppStore();
  const isActive = conversationFriend?.principal === friendPrincipal;

  const hasUnread =
    lastActivityType === "received_new" && unviewedSnapId !== null;
  const hasActivity = lastActivityType !== "none";

  const handleClick = () => {
    setConversationFriend({
      principal: friendPrincipal,
      name: friendName,
      username: friendUsername,
    });
    setView("conversation");
  };

  const getStatusIcon = () => {
    switch (lastActivityType) {
      case "received_new":
        return <SnapSquare filled color={SNAP_PURPLE} />;
      case "received_opened":
        return <SnapSquare filled={false} color={SNAP_PURPLE} />;
      case "sent_delivered":
        return <SnapArrow filled color={SNAP_RED} />;
      case "sent_opened":
        return <SnapArrow filled={false} color={SNAP_GRAY} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    const count = Number(unviewedSnapCount);
    switch (lastActivityType) {
      case "received_new":
        return count > 1 ? `${count} New Snaps` : "New Snap";
      case "received_opened":
        return "Opened";
      case "sent_delivered":
        return "Delivered";
      case "sent_opened":
        return "Opened";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (lastActivityType) {
      case "received_new":
        return SNAP_PURPLE;
      case "sent_delivered":
        return SNAP_RED;
      default:
        return SNAP_GRAY;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 w-full text-left transition-colors border-b hover:bg-muted/50 active:bg-muted",
        isActive && "bg-muted",
      )}
    >
      <Avatar className="h-12 w-12">
        <AvatarFallback className="text-sm font-medium bg-border">
          {friendName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p
            className={cn(
              "text-sm truncate",
              hasUnread ? "font-bold" : "font-medium",
            )}
          >
            {friendName}
            {!isFriend && (
              <span className="text-[10px] text-muted-foreground font-normal ml-1.5">
                (not friends)
              </span>
            )}
          </p>
          {Number(streakCount) > 0 && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-semibold shrink-0 ml-2",
                streakAtRisk ? "text-amber-500" : "text-orange-500",
              )}
            >
              {Number(streakCount)}
              <Flame className="h-3 w-3" />
            </span>
          )}
        </div>

        {hasActivity && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {getStatusIcon()}
            <span
              className={cn(
                "text-xs truncate",
                hasUnread ? "font-semibold" : "",
              )}
              style={{ color: getStatusColor() }}
            >
              {getStatusText()}
            </span>
            {Number(lastActivityAt) > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">
                · {shortTimeAgo(lastActivityAt)}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
