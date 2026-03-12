import { ThemeProvider } from "next-themes";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster } from "sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useActor } from "./hooks/useActor";
import {
  useProfile,
  useRestrictionStatus,
  useAcknowledgeRestriction,
} from "./hooks/useQueries";
import { LandingPage } from "./components/LandingPage";
import { ProfileSetupDialog } from "./components/ProfileSetupDialog";
import { AppLayout } from "./components/AppLayout";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching, actor } = useActor();

  const isAuthenticated = !!identity;

  const renderContent = () => {
    if (isInitializing) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return <LandingPage />;
    }

    if (!actor || isFetching) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    return <AuthenticatedApp />;
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {renderContent()}
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}

function AuthenticatedApp() {
  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
  } = useProfile();
  const { data: restrictionStatus } = useRestrictionStatus();
  const { mutate: acknowledgeRestriction, isPending: isAcknowledging } =
    useAcknowledgeRestriction();

  const showRestrictionAlert =
    restrictionStatus?.isRestricted && !restrictionStatus?.notified;

  const hasProfile = profile && profile.name && profile.username;

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">Failed to load profile.</p>
      </div>
    );
  }

  return (
    <>
      <ProfileSetupDialog open={!hasProfile} />
      {hasProfile ? (
        <AppLayout userName={profile.name} />
      ) : (
        <div className="min-h-screen bg-background" />
      )}

      <AlertDialog open={!!showRestrictionAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account Restricted</AlertDialogTitle>
            <AlertDialogDescription>
              Your account has been restricted due to multiple reports. You
              cannot send friend requests or appear in search results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => acknowledgeRestriction()}
              disabled={isAcknowledging}
            >
              {isAcknowledging ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isAcknowledging ? "Acknowledging..." : "I understand"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
