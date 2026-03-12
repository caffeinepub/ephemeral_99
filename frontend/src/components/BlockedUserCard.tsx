import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Principal } from "@icp-sdk/core/principal";
import { toast } from "sonner";
import { useUnblockUser } from "../hooks/useQueries";

interface BlockedUserCardProps {
  principal: Principal;
  name: string;
  username: string;
}

export function BlockedUserCard({
  principal,
  name,
  username,
}: BlockedUserCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: unblockUser, isPending } = useUnblockUser();

  const handleUnblock = () => {
    unblockUser(principal, {
      onSuccess: () => {
        toast.success(`Unblocked ${name}`);
        setConfirmOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to unblock user");
      },
    });
  };

  return (
    <>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmOpen(true)}
        >
          Unblock
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {name} will be able to send you friend requests and snaps again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Unblocking..." : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
