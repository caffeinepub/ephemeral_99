import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Camera,
  Loader2,
  MoreVertical,
  Flag,
  ShieldBan,
  Undo2,
  UserMinus,
  UserPlus,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAppStore } from "../hooks/useAppStore";
import {
  useConversation,
  useCancelFriendRequest,
  useFriends,
  useFriendRequests,
  useMyReports,
  useSendFriendRequest,
  useWithdrawReport,
  useUnfriend,
  useBlockUser,
} from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { ConversationEventRow } from "./ConversationEventRow";
import { ReportDialog } from "./ReportDialog";

export function ConversationView() {
  const { conversationFriend, setView, setViewingSnapId } = useAppStore();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [unfriendDialogOpen, setUnfriendDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const {
    data: conversation,
    isLoading,
    isError,
  } = useConversation(conversationFriend?.principal ?? null);

  const { data: friends } = useFriends();
  const { data: friendRequests } = useFriendRequests();
  const { mutate: sendFriendRequest, isPending: isSendingRequest } =
    useSendFriendRequest();
  const { mutate: cancelFriendRequest, isPending: isCancelling } =
    useCancelFriendRequest();
  const { data: myReports } = useMyReports();
  const { mutate: withdrawReport, isPending: isWithdrawing } =
    useWithdrawReport();
  const { mutate: unfriend, isPending: isUnfriending } = useUnfriend();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();

  const isFriend =
    friends?.some(
      (f) => f.principal.toString() === conversationFriend?.principal,
    ) ?? false;

  const pendingRequest = friendRequests?.outgoing?.find(
    (r) => r.principal.toString() === conversationFriend?.principal,
  );
  const hasPendingRequest = !!pendingRequest;

  const handleCancelRequest = () => {
    if (!pendingRequest) return;
    cancelFriendRequest(pendingRequest.id, {
      onSuccess: () => {
        toast.success("Friend request cancelled");
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to cancel request");
      },
    });
  };

  const handleAddFriend = async () => {
    if (!conversationFriend) return;
    const { Principal } = await import("@icp-sdk/core/principal");
    sendFriendRequest(Principal.fromText(conversationFriend.principal), {
      onSuccess: () => {
        toast.success(`Friend request sent to ${conversationFriend.name}`);
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to send friend request");
      },
    });
  };

  const isReported =
    myReports?.some((p) => p.toString() === conversationFriend?.principal) ??
    false;

  const handleBack = () => {
    setView("inbox");
  };

  const handleSendSnap = () => {
    setView("camera");
  };

  const handleWithdraw = async () => {
    if (!conversationFriend) return;
    const { Principal } = await import("@icp-sdk/core/principal");
    withdrawReport(Principal.fromText(conversationFriend.principal), {
      onSuccess: () => {
        toast.success("Report withdrawn");
        setWithdrawDialogOpen(false);
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to withdraw report");
      },
    });
  };

  const handleUnfriend = async () => {
    if (!conversationFriend) return;
    const { Principal } = await import("@icp-sdk/core/principal");
    unfriend(Principal.fromText(conversationFriend.principal), {
      onSuccess: () => {
        toast.success(`Removed ${conversationFriend.name} from friends`);
        setUnfriendDialogOpen(false);
        setView("inbox");
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to unfriend");
      },
    });
  };

  const handleBlock = async () => {
    if (!conversationFriend) return;
    const { Principal } = await import("@icp-sdk/core/principal");
    blockUser(Principal.fromText(conversationFriend.principal), {
      onSuccess: () => {
        toast.success(`Blocked ${conversationFriend.name}`);
        setBlockDialogOpen(false);
        setView("inbox");
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to block user");
      },
    });
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  const prevConversationLenRef = useRef(0);

  useEffect(() => {
    if (conversation && conversation.length > 0) {
      if (conversation.length !== prevConversationLenRef.current) {
        bottomRef.current?.scrollIntoView();
      }
      prevConversationLenRef.current = conversation.length;
    }
  }, [conversation]);

  const handleTapNewSnap = (snapId: number) => {
    setViewingSnapId(snapId);
  };

  if (!conversationFriend) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col h-full bg-card">
        {/* Header — same surface as messages, no border */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0">
          <button
            onClick={handleBack}
            className="p-1.5 -ml-1 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-sm font-bold bg-muted">
              {conversationFriend.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-foreground truncate">
              {conversationFriend.name}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setUnfriendDialogOpen(true)}>
                <UserMinus className="h-4 w-4" />
                Unfriend
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBlockDialogOpen(true)}>
                <ShieldBan className="h-4 w-4" />
                Block
              </DropdownMenuItem>
              {isReported ? (
                <DropdownMenuItem onClick={() => setWithdrawDialogOpen(true)}>
                  <Undo2 className="h-4 w-4" />
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

        {/* Messages — continuous white surface */}
        <ScrollArea className="flex-1">
          {isError ? (
            <div className="px-4 py-8 text-center text-destructive">
              Failed to load conversation.
            </div>
          ) : isLoading ? (
            <div className="py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-2.5">
                  <Skeleton className="h-3 w-12 mb-1.5" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : !conversation || conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Camera className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold text-foreground">No snaps yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Send a snap to start the conversation
              </p>
            </div>
          ) : (
            <div className="py-1">
              {conversation.map((item) => (
                <ConversationEventRow
                  key={`${item.snapId}-${item.sender.toString()}`}
                  snapId={item.snapId}
                  senderPrincipal={item.sender.toString()}
                  myPrincipal={myPrincipal}
                  friendName={conversationFriend.name}
                  status={item.status}
                  createdAt={item.createdAt}
                  expirationSeconds={item.expirationSeconds}
                  onTapNewSnap={handleTapNewSnap}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Bottom action */}
        {isFriend ? (
          <div className="flex justify-center py-3 shrink-0">
            <button
              onClick={handleSendSnap}
              className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 px-4 shrink-0 border-t">
            {hasPendingRequest ? (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Friend request pending
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-muted-foreground"
                  onClick={handleCancelRequest}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Cancel"
                  )}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddFriend}
                disabled={isSendingRequest}
              >
                {isSendingRequest ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Add {conversationFriend.name} to send snaps
              </Button>
            )}
          </div>
        )}
      </div>

      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        targetPrincipalText={conversationFriend.principal}
        targetName={conversationFriend.name}
      />

      <AlertDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw report?</AlertDialogTitle>
            <AlertDialogDescription>
              Your report against {conversationFriend.name} will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWithdrawing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdraw}
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

      <AlertDialog
        open={unfriendDialogOpen}
        onOpenChange={setUnfriendDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unfriend {conversationFriend.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be able to send or receive snaps from each
              other. You can add them back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnfriending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnfriend}
              disabled={isUnfriending}
            >
              {isUnfriending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isUnfriending ? "Removing..." : "Unfriend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Block {conversationFriend.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They won&apos;t be able to find you, send you friend requests, or
              interact with you in any way.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} disabled={isBlocking}>
              {isBlocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isBlocking ? "Blocking..." : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
