import { Loader2, UserPlus, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Principal } from "@icp-sdk/core/principal";
import { toast } from "sonner";
import { useSendFriendRequest } from "../hooks/useQueries";

interface UserSearchResultCardProps {
  principal: Principal;
  name: string;
  username: string;
  isPendingRequest: boolean;
  isFriend: boolean;
}

export function UserSearchResultCard({
  principal,
  name,
  username,
  isPendingRequest,
  isFriend,
}: UserSearchResultCardProps) {
  const { mutate: sendRequest, isPending } = useSendFriendRequest();

  const handleSend = () => {
    sendRequest(principal, {
      onSuccess: () => {
        toast.success(`Friend request sent to ${name}`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send friend request");
      },
    });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar className="h-10 w-10">
        <AvatarFallback className="text-sm font-medium">
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">@{username}</p>
      </div>
      {isFriend ? (
        <span className="text-xs text-muted-foreground">Friends</span>
      ) : isPendingRequest ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSend}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {isPending ? "Sending..." : "Add"}
        </Button>
      )}
    </div>
  );
}
