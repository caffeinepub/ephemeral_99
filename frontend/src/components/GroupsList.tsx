import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { GroupCard } from "./GroupCard";
import { CreateGroupDialog } from "./CreateGroupDialog";

interface GroupMember {
  principal: Principal;
  name: string;
  username: string;
}

interface GroupItem {
  id: bigint;
  name: string;
  members: GroupMember[];
  createdAt: bigint;
}

interface GroupsListProps {
  groups: GroupItem[];
  isLoading: boolean;
  isError: boolean;
}

export function GroupsList({ groups, isLoading, isError }: GroupsListProps) {
  const [createOpen, setCreateOpen] = useState(false);

  if (isError) {
    return (
      <div className="px-4 py-8 text-center text-destructive">
        Failed to load groups.
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

  return (
    <div className="relative h-full">
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-foreground">No groups yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create a group to quickly send snaps to multiple friends
          </p>
        </div>
      ) : (
        <div className="">
          {groups.map((group) => (
            <GroupCard
              key={Number(group.id)}
              id={group.id}
              name={group.name}
              members={group.members}
            />
          ))}
        </div>
      )}

      <Button
        size="icon"
        className="absolute bottom-4 left-4 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setCreateOpen(true)}
      >
        <Plus className="h-5 w-5" />
      </Button>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
