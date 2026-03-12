import { MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatList } from "../hooks/useQueries";
import { ChatRow } from "./ChatRow";
import { StoryBar } from "./StoryBar";

export function SnapInbox() {
  const { data: chatList, isLoading, isError } = useChatList();

  return (
    <div className="flex flex-col h-full">
      <StoryBar />

      {isError ? (
        <div className="px-4 py-8 text-center text-destructive">
          Failed to load chats.
        </div>
      ) : isLoading ? (
        <div>
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
      ) : !chatList || chatList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-foreground">No chats yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add friends to start sharing snaps
          </p>
        </div>
      ) : (
        <div>
          {chatList.map((item) => (
            <ChatRow
              key={item.friendPrincipal.toString()}
              friendPrincipal={item.friendPrincipal.toString()}
              friendName={item.friendName}
              friendUsername={item.friendUsername}
              lastActivityAt={item.lastActivityAt}
              lastActivityType={item.lastActivityType}
              unviewedSnapId={item.unviewedSnapId}
              unviewedSnapCount={item.unviewedSnapCount}
              streakCount={item.streakCount}
              streakAtRisk={item.streakAtRisk}
              isFriend={item.isFriend}
            />
          ))}
        </div>
      )}
    </div>
  );
}
