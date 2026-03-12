import { Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StoryCircleProps {
  name: string;
  initial: string;
  hasStories: boolean;
  isOwn?: boolean;
  onClick: () => void;
}

export function StoryCircle({
  name,
  initial,
  hasStories,
  isOwn,
  onClick,
}: StoryCircleProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 min-w-[64px]",
        !hasStories && "opacity-60",
      )}
      disabled={isOwn && !hasStories}
    >
      <div
        className={cn(
          "rounded-full p-[2px]",
          hasStories
            ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
            : "bg-muted",
        )}
      >
        <Avatar className="h-12 w-12 border-2 border-background">
          <AvatarFallback
            className={cn(
              "text-sm font-medium",
              isOwn && !hasStories && "bg-muted",
            )}
          >
            {isOwn && !hasStories ? (
              <Plus className="h-5 w-5 text-muted-foreground" />
            ) : (
              initial
            )}
          </AvatarFallback>
        </Avatar>
      </div>
      <span className="text-[11px] text-muted-foreground truncate max-w-[64px]">
        {name}
      </span>
    </button>
  );
}
