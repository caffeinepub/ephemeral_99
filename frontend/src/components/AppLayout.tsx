import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Camera,
  LogOut,
  MessageCircle,
  Moon,
  Pencil,
  Sun,
  UserRoundCog,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAppStore, type AppView } from "../hooks/useAppStore";
import { useQueryClient } from "@tanstack/react-query";
import { useFriendRequests } from "../hooks/useQueries";
import { FriendsView } from "./FriendsView";
import { CameraCapture } from "./CameraCapture";
import { MediaEditor } from "./MediaEditor";
import { RecipientSelector } from "./RecipientSelector";
import { SnapInbox } from "./SnapInbox";
import { ConversationView } from "./ConversationView";
import { EditProfileDialog } from "./EditProfileDialog";
import { SnapViewer } from "./SnapViewer";
import { StoryViewer } from "./StoryViewer";

interface AppLayoutProps {
  userName: string;
}

export function AppLayout({ userName }: AppLayoutProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const handleSignOut = () => {
    queryClient.clear();
    clear();
  };
  const { currentView, setView, conversationFriend } = useAppStore();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { data: requests } = useFriendRequests();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const isDark = theme === "dark";

  const incomingRequestCount = requests?.incoming?.length ?? 0;

  // Mobile: single-panel with compact top bar
  if (isMobile) {
    return (
      <div className="h-dvh bg-background flex flex-col">
        {currentView === "inbox" && (
          <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserRoundCog className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Welcome back, {userName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                >
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {isDark ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                onClick={() => setView("friends")}
              >
                <Users className="h-5 w-5" />
                {incomingRequestCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] leading-none"
                  >
                    {incomingRequestCount}
                  </Badge>
                )}
              </Button>
              <Button
                size="icon"
                className="rounded-full"
                onClick={() => setView("camera")}
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
          <MobileContent view={currentView} />
        </main>
        <EditProfileDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
        />
        <SnapViewer />
        <StoryViewer />
      </div>
    );
  }

  // Desktop: full-height two-panel layout
  return (
    <div className="h-dvh bg-background flex">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r flex flex-col shrink-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserRoundCog className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Welcome back, {userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                {isDark ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative rounded-full",
                currentView === "friends" && "bg-muted",
              )}
              onClick={() => setView("friends")}
            >
              <Users className="h-5 w-5" />
              {incomingRequestCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] leading-none"
                >
                  {incomingRequestCount}
                </Badge>
              )}
            </Button>
            <Button
              size="icon"
              className="rounded-full"
              onClick={() => setView("camera")}
            >
              <Camera className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SnapInbox />
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden p-3">
        <div className="flex-1 bg-card rounded-2xl border overflow-hidden">
          <DesktopContent
            view={currentView}
            conversationFriend={conversationFriend}
          />
        </div>
      </div>

      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
      />
      <SnapViewer />
      <StoryViewer />
    </div>
  );
}

function DesktopContent({
  view,
  conversationFriend,
}: {
  view: AppView;
  conversationFriend: {
    principal: string;
    name: string;
    username: string;
  } | null;
}) {
  switch (view) {
    case "inbox":
    case "conversation":
      if (conversationFriend) return <ConversationView />;
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <MessageCircle className="h-12 w-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">Select a conversation</p>
        </div>
      );
    case "camera":
      return <CameraCapture />;
    case "editor":
      return <MediaEditor />;
    case "send":
      return <RecipientSelector />;
    case "friends":
      return <FriendsView />;
    default:
      return null;
  }
}

function MobileContent({ view }: { view: AppView }) {
  switch (view) {
    case "inbox":
      return <SnapInbox />;
    case "conversation":
      return <ConversationView />;
    case "camera":
      return <CameraCapture />;
    case "editor":
      return <MediaEditor />;
    case "send":
      return <RecipientSelector />;
    case "friends":
      return <FriendsView />;
    default:
      return null;
  }
}
