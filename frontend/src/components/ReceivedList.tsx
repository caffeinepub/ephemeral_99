import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { ReceivedSnapCard } from "./ReceivedSnapCard";

interface StreakInfo {
  count: bigint;
  isAtRisk: boolean;
}

interface ReceivedListProps {
  items: {
    snapId: bigint;
    sender: Principal;
    senderName: string;
    expirationSeconds: bigint;
    createdAt: bigint;
    isViewed: boolean;
  }[];
  isLoading: boolean;
  isError: boolean;
  streakMap?: Map<string, StreakInfo>;
}

export function ReceivedList({
  items,
  isLoading,
  isError,
  streakMap,
}: ReceivedListProps) {
  if (isError) {
    return (
      <div className="px-4 py-8 text-center text-destructive">
        Failed to load inbox.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-foreground">No snaps yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Snaps from friends will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="">
      {items.map((item) => {
        const streak = streakMap?.get(item.sender.toString());
        return (
          <ReceivedSnapCard
            key={Number(item.snapId)}
            snapId={item.snapId}
            senderName={item.senderName}
            expirationSeconds={item.expirationSeconds}
            createdAt={item.createdAt}
            isViewed={item.isViewed}
            streakCount={streak ? Number(streak.count) : undefined}
            isAtRisk={streak?.isAtRisk}
          />
        );
      })}
    </div>
  );
}
