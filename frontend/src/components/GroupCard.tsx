import { useState } from "react";
import { Loader2, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
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
import { toast } from "sonner";
import { useDeleteGroup } from "../hooks/useQueries";
import { EditGroupDialog } from "./EditGroupDialog";
import type { Principal } from "@icp-sdk/core/principal";

interface GroupMember {
  principal: Principal;
  name: string;
  username: string;
}

interface GroupCardProps {
  id: bigint;
  name: string;
  members: GroupMember[];
}

export function GroupCard({ id, name, members }: GroupCardProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { mutate: deleteGroup, isPending } = useDeleteGroup();

  const handleDelete = () => {
    deleteGroup(id, {
      onSuccess: () => {
        toast.success(`Deleted "${name}"`);
        setShowDelete(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete group");
      },
    });
  };

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {members.length} member{members.length !== 1 ? "s" : ""}
            {members.length > 0 &&
              ` · ${members
                .slice(0, 3)
                .map((m) => m.name)
                .join(", ")}${members.length > 3 ? "…" : ""}`}
          </p>
        </div>
        <div className="flex -space-x-2">
          {members.slice(0, 3).map((m) => (
            <Avatar
              key={m.principal.toString()}
              className="h-6 w-6 border-2 border-background"
            >
              <AvatarFallback className="text-[10px]">
                {m.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDelete(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{name}&quot; will be permanently deleted. This won&apos;t
              affect your friendships.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditGroupDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        groupId={id}
        initialName={name}
        initialMembers={members}
      />
    </>
  );
}
