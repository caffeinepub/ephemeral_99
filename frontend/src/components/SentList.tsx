import { Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SentSnapCard } from "./SentSnapCard";

interface SentListProps {
  items: {
    snapId: bigint;
    recipientCount: bigint;
    viewedCount: bigint;
    createdAt: bigint;
  }[];
  isLoading: boolean;
  isError: boolean;
}

export function SentList({ items, isLoading, isError }: SentListProps) {
  if (isError) {
    return (
      <div className="px-4 py-8 text-center text-destructive">
        Failed to load sent snaps.
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
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <Send className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-foreground">No sent snaps</p>
        <p className="text-xs text-muted-foreground mt-1">
          Snaps you send will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="">
      {items.map((item) => (
        <SentSnapCard
          key={Number(item.snapId)}
          recipientCount={item.recipientCount}
          viewedCount={item.viewedCount}
          createdAt={item.createdAt}
        />
      ))}
    </div>
  );
}
