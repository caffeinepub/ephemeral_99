import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useSearchUsers,
  useFriendRequests,
  useFriends,
} from "../hooks/useQueries";
import { UserSearchResultCard } from "./UserSearchResultCard";

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSearchDialog({
  open,
  onOpenChange,
}: UserSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  const {
    data: searchResults,
    isLoading,
    isError,
  } = useSearchUsers(debouncedQuery);
  const { data: requests } = useFriendRequests();
  const { data: friends } = useFriends();

  // Build sets for quick lookup
  const pendingPrincipals = new Set(
    [...(requests?.outgoing ?? []), ...(requests?.incoming ?? [])].map((r) =>
      r.principal.toString(),
    ),
  );
  const friendPrincipals = new Set(
    (friends ?? []).map((f) => f.principal.toString()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friends</DialogTitle>
          <DialogDescription className="sr-only">
            Search for users by username to send friend requests.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 text-base"
            autoFocus
          />
        </div>
        <ScrollArea className="max-h-[50vh]">
          {debouncedQuery.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Type a username to search
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Searching...
            </p>
          ) : isError ? (
            <p className="text-sm text-destructive text-center py-8">
              Failed to search users.
            </p>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="">
              {searchResults.map((user) => (
                <UserSearchResultCard
                  key={user.principal.toString()}
                  principal={user.principal}
                  name={user.name}
                  username={user.username}
                  isPendingRequest={pendingPrincipals.has(
                    user.principal.toString(),
                  )}
                  isFriend={friendPrincipals.has(user.principal.toString())}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No users found
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
