import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFriends, useCreateGroup } from "../hooks/useQueries";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
}: CreateGroupDialogProps) {
  const [name, setName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState("");

  const { data: friends, isLoading: isLoadingFriends } = useFriends();
  const { mutate: createGroup, isPending } = useCreateGroup();

  useEffect(() => {
    if (open) {
      setName("");
      setSelectedMembers(new Set());
      setError("");
    }
  }, [open]);

  const toggleMember = (principalText: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(principalText)) {
        next.delete(principalText);
      } else {
        next.add(principalText);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    if (selectedMembers.size < 2) {
      setError("Select at least 2 members");
      return;
    }
    if (!friends) return;

    const memberPrincipals = friends
      .filter((f) => selectedMembers.has(f.principal.toString()))
      .map((f) => f.principal);

    createGroup(
      { name: name.trim(), members: memberPrincipals },
      {
        onSuccess: () => {
          toast.success(`Created "${name.trim()}"`);
          onOpenChange(false);
        },
        onError: (err) => {
          setError(err.message || "Failed to create group");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new group by choosing a name and selecting friends.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Group name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            maxLength={50}
            disabled={isPending}
          />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Select members</p>
            <ScrollArea className="h-48 border rounded-md">
              {isLoadingFriends ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : friends && friends.length > 0 ? (
                friends.map((friend) => {
                  const pt = friend.principal.toString();
                  const isSelected = selectedMembers.has(pt);
                  return (
                    <div
                      key={pt}
                      role="button"
                      tabIndex={0}
                      onClick={() => !isPending && toggleMember(pt)}
                      onKeyDown={(e) => {
                        if (
                          (e.key === "Enter" || e.key === " ") &&
                          !isPending
                        ) {
                          e.preventDefault();
                          toggleMember(pt);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors",
                        isPending && "opacity-50 pointer-events-none",
                      )}
                    >
                      <div
                        className={cn(
                          "size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input",
                        )}
                      >
                        {isSelected && <Check className="size-3.5" />}
                      </div>
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">
                          {friend.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{friend.name}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No friends to add
                </p>
              )}
            </ScrollArea>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Creating..." : `Create (${selectedMembers.size})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
