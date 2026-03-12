import React, { useState, useEffect } from "react";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useProfile,
  useSetProfile,
  useCheckUsername,
} from "../hooks/useQueries";
import { useDebounce } from "../hooks/useDebounce";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const USERNAME_REGEX = /^[a-z0-9_]+$/;

export function EditProfileDialog({
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  const { data: profile } = useProfile();
  const { mutate: setProfile, isPending } = useSetProfile();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState("");

  const debouncedUsername = useDebounce(username, 400);
  const {
    data: isAvailable,
    isLoading: isCheckingUsername,
    isError: isCheckError,
  } = useCheckUsername(debouncedUsername);

  useEffect(() => {
    if (open && profile) {
      setName(profile.name);
      setUsername(profile.username);
      setError(null);
      setUsernameError("");
    }
  }, [open, profile]);

  useEffect(() => {
    if (username.length === 0) {
      setUsernameError("");
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameError("Only lowercase letters, numbers, and underscores");
      return;
    }
    if (username.length < 3) {
      setUsernameError("Must be at least 3 characters");
      return;
    }
    if (username.length > 20) {
      setUsernameError("Must be 20 characters or fewer");
      return;
    }
    setUsernameError("");
  }, [username]);

  const isUsernameValid =
    username.length >= 3 &&
    username.length <= 20 &&
    USERNAME_REGEX.test(username) &&
    !usernameError;

  const isUsernameUnchanged = username === profile?.username;
  const isNameUnchanged = name.trim() === profile?.name;

  const showAvailability =
    isUsernameValid &&
    !isUsernameUnchanged &&
    debouncedUsername === username &&
    !isCheckingUsername;

  const usernameOk = isUsernameUnchanged || isAvailable === true;

  const canSubmit =
    name.trim().length > 0 &&
    isUsernameValid &&
    usernameOk &&
    !(isNameUnchanged && isUsernameUnchanged) &&
    !isPending;

  const handleUsernameChange = (value: string) => {
    setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !profile) return;
    setProfile(
      { name: name.trim(), username },
      {
        onSuccess: () => {
          toast.success("Profile updated");
          onOpenChange(false);
        },
        onError: (err) => {
          setError(
            err instanceof Error ? err.message : "Failed to update profile",
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Display Name</Label>
              <Input
                id="edit-name"
                placeholder="Your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                autoFocus
                className="text-base"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  id="edit-username"
                  placeholder="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  maxLength={20}
                  className="pl-7 pr-8 text-base"
                />
                {isUsernameValid && !isUsernameUnchanged && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername || debouncedUsername !== username ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : isCheckError ? (
                      <X className="h-4 w-4 text-destructive" />
                    ) : showAvailability && isAvailable ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : showAvailability && !isAvailable ? (
                      <X className="h-4 w-4 text-destructive" />
                    ) : null}
                  </span>
                )}
              </div>
              {usernameError && (
                <p className="text-sm text-muted-foreground">{usernameError}</p>
              )}
              {showAvailability && !isAvailable && !usernameError && (
                <p className="text-sm text-destructive">Username is taken</p>
              )}
              {showAvailability && isAvailable && !usernameError && (
                <p className="text-sm text-green-500">Username is available</p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
