import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBlockedUsers } from "../hooks/useQueries";
import { BlockedUserCard } from "./BlockedUserCard";

export function BlockedUsersList() {
  const { data: blockedUsers, isLoading, isError } = useBlockedUsers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 py-12 text-center text-sm text-destructive">
        Failed to load blocked users.
      </div>
    );
  }

  if (!blockedUsers || blockedUsers.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted-foreground">
        No blocked users.
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-border">
        {blockedUsers.map((user) => (
          <BlockedUserCard
            key={user.principal.toString()}
            principal={user.principal}
            name={user.name}
            username={user.username}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
