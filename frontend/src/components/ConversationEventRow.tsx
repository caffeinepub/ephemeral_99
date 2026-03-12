import { cn } from "@/lib/utils";
import { shortTimeAgo } from "../utils/formatting";
import {
  SNAP_RED,
  SNAP_PURPLE,
  SNAP_GRAY,
  SNAP_BLUE,
} from "../utils/constants";
import { SnapArrow } from "./SnapArrow";
import { SnapSquare } from "./SnapSquare";

interface ConversationEventRowProps {
  snapId: bigint;
  senderPrincipal: string;
  myPrincipal: string;
  friendName: string;
  status: string;
  createdAt: bigint;
  expirationSeconds: bigint;
  onTapNewSnap: (snapId: number) => void;
}

export function ConversationEventRow({
  snapId,
  senderPrincipal,
  myPrincipal,
  friendName,
  status,
  createdAt,
  onTapNewSnap,
}: ConversationEventRowProps) {
  const isSent = senderPrincipal === myPrincipal;
  const isNewReceived = !isSent && status === "new";

  const getIcon = () => {
    if (isSent) {
      return status === "delivered" ? (
        <SnapArrow filled color={SNAP_RED} />
      ) : (
        <SnapArrow filled={false} color={SNAP_GRAY} />
      );
    }
    return status === "new" ? (
      <SnapSquare filled color={SNAP_PURPLE} />
    ) : (
      <SnapSquare filled={false} color={SNAP_PURPLE} />
    );
  };

  const getTitle = () => {
    if (isSent) {
      return status === "delivered" ? "Delivered" : "Opened";
    }
    return status === "new" ? "New Snap" : "Opened";
  };

  const getSubtitle = () => {
    if (isNewReceived) return "Click to view";
    if (Number(createdAt) > 0) return shortTimeAgo(createdAt);
    return null;
  };

  const getStatusColor = () => {
    if (isSent) {
      return status === "delivered" ? SNAP_RED : SNAP_GRAY;
    }
    return status === "new" ? SNAP_PURPLE : SNAP_GRAY;
  };

  const senderLabel = isSent ? "ME" : friendName.toUpperCase();
  const senderColor = isSent ? SNAP_BLUE : SNAP_RED;

  const subtitle = getSubtitle();

  return (
    <div className="px-4 py-1.5">
      <p
        className="text-[11px] font-extrabold tracking-wider mb-1.5"
        style={{ color: senderColor }}
      >
        {senderLabel}
      </p>
      <div className="border-l-[3px] pl-3" style={{ borderColor: senderColor }}>
        <div
          role={isNewReceived ? "button" : undefined}
          tabIndex={isNewReceived ? 0 : undefined}
          onClick={() => {
            if (isNewReceived) {
              onTapNewSnap(Number(snapId));
            }
          }}
          onKeyDown={(e) => {
            if (isNewReceived && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onTapNewSnap(Number(snapId));
            }
          }}
          className={cn(
            "inline-flex items-center gap-3 w-56 rounded-sm border border-border/30 px-3 py-2.5 transition-colors",
            isNewReceived &&
              "cursor-pointer hover:bg-muted/40 active:bg-muted/60",
          )}
        >
          {getIcon()}
          <div className="min-w-0">
            <p
              className={cn(
                "text-[13px] leading-tight",
                isNewReceived ? "font-bold" : "font-semibold",
              )}
              style={{ color: getStatusColor() }}
            >
              {getTitle()}
            </p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
