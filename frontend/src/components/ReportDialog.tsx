import { Loader2 } from "lucide-react";
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
import { useReportUser } from "../hooks/useQueries";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPrincipalText: string;
  targetName: string;
}

export function ReportDialog({
  open,
  onOpenChange,
  targetPrincipalText,
  targetName,
}: ReportDialogProps) {
  const { mutate: reportUser, isPending } = useReportUser();

  const handleReport = async () => {
    const { Principal } = await import("@icp-sdk/core/principal");
    reportUser(Principal.fromText(targetPrincipalText), {
      onSuccess: () => {
        toast.success("User reported");
        onOpenChange(false);
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to report user");
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Report {targetName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Has this user sent inappropriate or harmful content? Reports are
            processed automatically — if multiple users report this person,
            their account will be restricted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReport}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Reporting..." : "Report"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
