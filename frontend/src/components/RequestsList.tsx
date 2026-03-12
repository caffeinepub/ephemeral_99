import { UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { RequestCard } from "./RequestCard";

interface RequestsListProps {
  incoming: Array<{
    id: bigint;
    principal: Principal;
    name: string;
    username: string;
    createdAt: bigint;
  }>;
  outgoing: Array<{
    id: bigint;
    principal: Principal;
    name: string;
    username: string;
    createdAt: bigint;
  }>;
  isLoading: boolean;
  isError: boolean;
}

export function RequestsList({
  incoming,
  outgoing,
  isLoading,
  isError,
}: RequestsListProps) {
  if (isError) {
    return (
      <div className="px-4 py-8 text-center text-destructive">
        Failed to load requests.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="">
        {Array.from({ length: 3 }).map((_, i) => (
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

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <UserPlus className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-foreground">
          No pending requests
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Friend requests you send or receive will appear here
        </p>
      </div>
    );
  }

  return (
    <div>
      {incoming.length > 0 && (
        <div>
          <p className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Incoming
          </p>
          <div className="">
            {incoming.map((req) => (
              <RequestCard
                key={req.id.toString()}
                requestId={req.id}
                principal={req.principal}
                name={req.name}
                username={req.username}
                direction="incoming"
              />
            ))}
          </div>
        </div>
      )}
      {outgoing.length > 0 && (
        <div>
          <p className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Outgoing
          </p>
          <div className="">
            {outgoing.map((req) => (
              <RequestCard
                key={req.id.toString()}
                requestId={req.id}
                principal={req.principal}
                name={req.name}
                username={req.username}
                direction="outgoing"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
