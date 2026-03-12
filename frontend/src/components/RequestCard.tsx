import { Check, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Principal } from "@icp-sdk/core/principal";
import { toast } from "sonner";
import {
  useRespondToFriendRequest,
  useCancelFriendRequest,
} from "../hooks/useQueries";

interface RequestCardProps {
  requestId: bigint;
  principal: Principal;
  name: string;
  username: string;
  direction: "incoming" | "outgoing";
}

export function RequestCard({
  requestId,
  name,
  username,
  direction,
}: RequestCardProps) {
  const { mutate: respond, isPending } = useRespondToFriendRequest();
  const { mutate: cancelRequest, isPending: isCancelling } =
    useCancelFriendRequest();

  const handleAccept = () => {
    respond(
      { requestId, accept: true },
      {
        onSuccess: () => toast.success(`You and ${name} are now friends`),
        onError: (error) =>
          toast.error(error.message || "Failed to accept request"),
      },
    );
  };

  const handleReject = () => {
    respond(
      { requestId, accept: false },
      {
        onSuccess: () => toast.success("Request declined"),
        onError: (error) =>
          toast.error(error.message || "Failed to decline request"),
      },
    );
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
      {direction === "incoming" ? (
        <div className="flex gap-2">
          <Button
            variant="default"
            size="icon"
            className="h-9 w-9"
            onClick={handleAccept}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={handleReject}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() =>
            cancelRequest(requestId, {
              onSuccess: () => toast.success("Request cancelled"),
              onError: (error) =>
                toast.error(error.message || "Failed to cancel request"),
            })
          }
          disabled={isCancelling}
        >
          {isCancelling ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Cancel"
          )}
        </Button>
      )}
    </div>
  );
}
