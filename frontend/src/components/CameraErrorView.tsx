import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type CameraError = "permission-denied" | "not-found" | "not-supported";

const messages: Record<CameraError, { title: string; description: string }> = {
  "permission-denied": {
    title: "Camera access denied",
    description: "Allow camera access in your browser settings to take photos.",
  },
  "not-found": {
    title: "No camera found",
    description: "Connect a camera or use the gallery to upload a photo.",
  },
  "not-supported": {
    title: "Camera not supported",
    description:
      "Your browser doesn't support camera access. Use the gallery instead.",
  },
};

interface CameraErrorViewProps {
  error: CameraError;
  onGalleryClick: () => void;
}

export function CameraErrorView({
  error,
  onGalleryClick,
}: CameraErrorViewProps) {
  const { title, description } = messages[error];

  return (
    <div className="flex flex-col items-center gap-4 text-center px-6 sm:px-8">
      <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
        <X className="h-8 w-8 text-white/60" />
      </div>
      <div>
        <h3 className="text-white font-medium">{title}</h3>
        <p className="text-white/60 text-sm mt-1">{description}</p>
      </div>
      <Button variant="secondary" onClick={onGalleryClick} className="mt-2">
        <ImagePlus className="h-4 w-4 mr-2" />
        Choose from gallery
      </Button>
    </div>
  );
}
