import { Send, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "../utils/formatting";

interface SentSnapCardProps {
  recipientCount: bigint;
  viewedCount: bigint;
  createdAt: bigint;
}

export function SentSnapCard({
  recipientCount,
  viewedCount,
  createdAt,
}: SentSnapCardProps) {
  const recipients = Number(recipientCount);
  const viewed = Number(viewedCount);
  const allViewed = viewed === recipients;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center",
          allViewed ? "bg-muted" : "bg-primary/10",
        )}
      >
        <Send
          className={cn(
            "h-4 w-4",
            allViewed ? "text-muted-foreground" : "text-primary",
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          Sent to {recipients} {recipients === 1 ? "friend" : "friends"}
        </p>
        <p className="text-xs text-muted-foreground">{timeAgo(createdAt)}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        <span
          className={cn(
            allViewed ? "text-muted-foreground" : "text-primary font-medium",
          )}
        >
          {viewed}/{recipients}
        </span>
      </div>
    </div>
  );
}
