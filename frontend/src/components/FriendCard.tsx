import { useState } from "react";
import {
  Loader2,
  MoreHorizontal,
  UserMinus,
  Ban,
  Flag,
  Flame,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import type { Principal } from "@icp-sdk/core/principal";
import { toast } from "sonner";
import {
  useUnfriend,
  useBlockUser,
  useMyReports,
  useWithdrawReport,
} from "../hooks/useQueries";
import { useAppStore } from "../hooks/useAppStore";
import { ReportDialog } from "./ReportDialog";

interface FriendCardProps {
  principal: Principal;
  name: string;
  username: string;
  streakCount?: number;
  isAtRisk?: boolean;
}

export function FriendCard({
  principal,
  name,
  username,
  streakCount,
  isAtRisk,
}: FriendCardProps) {
  const { setView, setConversationFriend } = useAppStore();
  const [confirmAction, setConfirmAction] = useState<
    "unfriend" | "block" | null
  >(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const { mutate: unfriend, isPending: isUnfriending } = useUnfriend();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { data: myReports } = useMyReports();
  const { mutate: withdrawReport, isPending: isWithdrawing } =
    useWithdrawReport();

  const isReported =
    myReports?.some((p) => p.toString() === principal.toString()) ?? false;

  const isPending = isUnfriending || isBlocking;

  const handleConfirm = () => {
    if (confirmAction === "unfriend") {
      unfriend(principal, {
        onSuccess: () => {
          toast.success(`Removed ${name} from friends`);
          setConfirmAction(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to unfriend");
        },
      });
    } else if (confirmAction === "block") {
      blockUser(principal, {
        onSuccess: () => {
          toast.success(`Blocked ${name}`);
          setConfirmAction(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to block user");
        },
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors">
        <button
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          onClick={() => {
            setConversationFriend({
              principal: principal.toString(),
              name,
              username,
            });
            setView("conversation");
          }}
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-sm font-medium">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{username}
            </p>
          </div>
          {!!streakCount && streakCount > 0 && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-semibold",
                isAtRisk ? "text-amber-500" : "text-orange-500",
              )}
            >
              <Flame className="h-4 w-4" />
              <span>{streakCount}</span>
            </div>
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setConfirmAction("unfriend")}>
              <UserMinus className="h-4 w-4" />
              Remove friend
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setConfirmAction("block")}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="h-4 w-4" />
              Block
            </DropdownMenuItem>
            {isReported ? (
              <DropdownMenuItem onClick={() => setWithdrawDialogOpen(true)}>
                <Flag className="h-4 w-4" />
                Withdraw Report
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                <Flag className="h-4 w-4" />
                Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "unfriend" ? "Remove friend?" : "Block user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "unfriend"
                ? `${name} will be removed from your friends list.`
                : `${name} will be blocked. They won't be able to send you snaps or friend requests.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className={
                confirmAction === "block"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmAction === "unfriend"
                ? isPending
                  ? "Removing..."
                  : "Remove"
                : isPending
                  ? "Blocking..."
                  : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        targetPrincipalText={principal.toString()}
        targetName={name}
      />

      <AlertDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw report?</AlertDialogTitle>
            <AlertDialogDescription>
              Your report against {name} will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWithdrawing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                withdrawReport(principal, {
                  onSuccess: () => {
                    toast.success("Report withdrawn");
                    setWithdrawDialogOpen(false);
                  },
                  onError: (error) => {
                    toast.error(error.message || "Failed to withdraw report");
                  },
                });
              }}
              disabled={isWithdrawing}
            >
              {isWithdrawing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isWithdrawing ? "Withdrawing..." : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
