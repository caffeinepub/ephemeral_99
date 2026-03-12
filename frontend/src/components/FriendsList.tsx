import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { FriendCard } from "./FriendCard";

interface StreakInfo {
  count: bigint;
  isAtRisk: boolean;
}

interface FriendsListProps {
  friends: Array<{ principal: Principal; name: string; username: string }>;
  isLoading: boolean;
  isError: boolean;
  streakMap?: Map<string, StreakInfo>;
}

export function FriendsList({
  friends,
  isLoading,
  isError,
  streakMap,
}: FriendsListProps) {
  if (isError) {
    return (
      <div className="px-4 py-8 text-center text-destructive">
        Failed to load friends.
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
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-foreground">No friends yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Search for users to add friends
        </p>
      </div>
    );
  }

  return (
    <div className="">
      {friends.map((friend) => {
        const streak = streakMap?.get(friend.principal.toString());
        return (
          <FriendCard
            key={friend.principal.toString()}
            principal={friend.principal}
            name={friend.name}
            username={friend.username}
            streakCount={streak ? Number(streak.count) : undefined}
            isAtRisk={streak?.isAtRisk}
          />
        );
      })}
    </div>
  );
}
