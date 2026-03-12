import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAppStore } from "../hooks/useAppStore";
import { FILTER_PRESETS } from "../utils/constants";
import {
  renderStrokesToCanvas,
  renderTextToCanvas,
} from "../utils/canvasRendering";
import { extractVideoFrame, exportEditedVideo } from "../utils/videoExport";
import { CropOverlay } from "./CropOverlay";
import { VideoCropPreview } from "./VideoCropPreview";
import { DrawingCanvas } from "./DrawingCanvas";
import { TextOverlay } from "./TextOverlay";
import { EditorToolbar } from "./EditorToolbar";

export function MediaEditor() {
  const {
    capturedMediaBlob,
    capturedMediaType,
    selectedFilter,
    setView,
    activeEditorTool,
    textItems,
    drawingStrokes,
    appliedCrop,
  } = useAppStore();

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceVideoUrl, setSourceVideoUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [originalSourceImage, setOriginalSourceImage] =
    useState<HTMLImageElement | null>(null);

  const isVideo = capturedMediaType === "video";

  // Load image source
  useEffect(() => {
    if (!capturedMediaBlob || isVideo) return;
    const url = URL.createObjectURL(capturedMediaBlob);
    const img = new Image();
    img.onload = () => {
      setSourceImage(img);
      if (!useAppStore.getState().selectedFilter) {
        useAppStore.getState().setSelectedFilter("normal");
      }
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [capturedMediaBlob, isVideo]);

  // Load video source + extract first frame for filter thumbnails
  useEffect(() => {
    if (!capturedMediaBlob || !isVideo) return;
    const url = URL.createObjectURL(capturedMediaBlob);
    setSourceVideoUrl(url);

    if (!useAppStore.getState().selectedFilter) {
      useAppStore.getState().setSelectedFilter("normal");
    }

    extractVideoFrame(capturedMediaBlob)
      .then((img) => {
        setSourceImage(img);
      })
      .catch(() => {
        // Frame extraction failed — will retry from preview element below
      });

    return () => {
      URL.revokeObjectURL(url);
      setSourceVideoUrl(null);
    };
  }, [capturedMediaBlob, isVideo]);

  // Fallback: capture frame from the playing video preview if extraction failed
  useEffect(() => {
    if (!isVideo || sourceImage) return;
    const video = videoPreviewRef.current;
    if (!video) return;

    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    const tryCapture = () => {
      if (sourceImage || !video.videoWidth || !video.videoHeight) return;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const img = new Image();
      img.onload = () => setSourceImage(img);
      img.src = dataUrl;
    };

    const onPlaying = () => {
      timeoutIds.push(setTimeout(tryCapture, 200));
    };

    video.addEventListener("playing", onPlaying);
    if (!video.paused && video.readyState >= 2) {
      timeoutIds.push(setTimeout(tryCapture, 200));
    }

    return () => {
      video.removeEventListener("playing", onPlaying);
      timeoutIds.forEach((id) => clearTimeout(id));
    };
  }, [isVideo, sourceImage]);

  const activeFilter = selectedFilter ?? "normal";
  const activePreset =
    FILTER_PRESETS.find((f) => f.name === activeFilter) ?? FILTER_PRESETS[0];

  // Render image preview (images only)
  // Draw unfiltered image to canvas; CSS filter on the element handles preview
  // (ctx.filter is not supported on all mobile browsers)
  const renderPreview = useCallback(() => {
    if (isVideo) return;
    const canvas = previewCanvasRef.current;
    if (!canvas || !sourceImage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    ctx.drawImage(sourceImage, 0, 0);
  }, [sourceImage, isVideo]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  const handleBack = () => {
    setView("camera");
  };

  const handleApplyCrop = useCallback(() => {
    const cropRegion = useAppStore.getState().cropRegion;
    if (
      cropRegion.x === 0 &&
      cropRegion.y === 0 &&
      cropRegion.w === 1 &&
      cropRegion.h === 1
    ) {
      return;
    }

    if (isVideo) {
      // Compose with any existing crop so stacking works correctly
      const prev = useAppStore.getState().appliedCrop;
      const hasPrev =
        prev != null &&
        !(prev.x === 0 && prev.y === 0 && prev.w === 1 && prev.h === 1);

      const composed = hasPrev
        ? {
            x: prev.x + cropRegion.x * prev.w,
            y: prev.y + cropRegion.y * prev.h,
            w: cropRegion.w * prev.w,
            h: cropRegion.h * prev.h,
          }
        : { ...cropRegion };

      useAppStore.getState().setAppliedCrop(composed);
      useAppStore.getState().setCropRegion({ x: 0, y: 0, w: 1, h: 1 });
      return;
    }

    // For images, physically crop the sourceImage
    if (!sourceImage) return;

    if (!originalSourceImage) {
      setOriginalSourceImage(sourceImage);
    }

    const sx = Math.round(cropRegion.x * sourceImage.width);
    const sy = Math.round(cropRegion.y * sourceImage.height);
    const sw = Math.round(cropRegion.w * sourceImage.width);
    const sh = Math.round(cropRegion.h * sourceImage.height);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = sw;
    tempCanvas.height = sh;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, sw, sh);

    const dataUrl = tempCanvas.toDataURL("image/png");
    const newImg = new Image();
    newImg.onload = () => {
      setSourceImage(newImg);
      useAppStore.getState().setCropRegion({ x: 0, y: 0, w: 1, h: 1 });
    };
    newImg.src = dataUrl;
  }, [sourceImage, originalSourceImage, isVideo]);

  const handleResetCrop = useCallback(() => {
    if (originalSourceImage && !isVideo) {
      setSourceImage(originalSourceImage);
      setOriginalSourceImage(null);
    }
    useAppStore.getState().resetCrop();
  }, [originalSourceImage, isVideo]);

  const handleNext = async () => {
    // Video export
    if (isVideo && capturedMediaBlob) {
      setIsExporting(true);
      setExportProgress(0);

      const previewEl = videoPreviewRef.current;
      const displayWidth = previewEl
        ? previewEl.getBoundingClientRect().width
        : 1920;

      try {
        const blob = await exportEditedVideo({
          sourceBlob: capturedMediaBlob,
          cssFilter: activePreset.cssFilter,
          strokes: drawingStrokes,
          textItems,
          displayWidth,
          onProgress: (pct) => setExportProgress(pct),
          crop: useAppStore.getState().appliedCrop,
        });
        useAppStore.getState().setEditedMediaBlob(blob);
        setView("send");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to export video",
        );
      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
      return;
    }

    // Image export
    if (!sourceImage) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = sourceImage.width;
    exportCanvas.height = sourceImage.height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    ctx.filter = activePreset.cssFilter;
    ctx.drawImage(sourceImage, 0, 0);
    ctx.filter = "none";

    const previewCanvas = previewCanvasRef.current;
    const displayWidth = previewCanvas
      ? previewCanvas.getBoundingClientRect().width
      : sourceImage.width;
    const scaleFactor = displayWidth > 0 ? sourceImage.width / displayWidth : 1;

    renderStrokesToCanvas(
      ctx,
      drawingStrokes,
      sourceImage.width,
      sourceImage.height,
      scaleFactor,
    );

    renderTextToCanvas(
      ctx,
      textItems,
      sourceImage.width,
      sourceImage.height,
      scaleFactor,
    );

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          useAppStore.getState().setEditedMediaBlob(blob);
          setView("send");
        }
      },
      "image/jpeg",
      0.92,
    );
  };

  if (!capturedMediaBlob) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
        <p className="text-muted-foreground">No media captured</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setView("camera")}
        >
          Go to Camera
        </Button>
      </div>
    );
  }

  const isReady = isVideo ? !!sourceVideoUrl : !!sourceImage;

  return (
    <div className="flex flex-col h-full min-h-[60vh]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={isExporting}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          size="sm"
          onClick={handleNext}
          disabled={isExporting || !isReady}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              {Math.round(exportProgress)}%
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>

      {/* Preview with overlays */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <div className="relative">
          {isVideo ? (
            <VideoCropPreview
              videoRef={videoPreviewRef}
              src={sourceVideoUrl!}
              cssFilter={activePreset.cssFilter}
              crop={appliedCrop}
            />
          ) : (
            <canvas
              ref={previewCanvasRef}
              className="block max-w-full max-h-[60vh] rounded-lg"
              style={{ filter: activePreset.cssFilter }}
            />
          )}
          <DrawingCanvas isActive={activeEditorTool === "draw"} />
          <TextOverlay
            isActive={
              activeEditorTool === "text" || activeEditorTool === "sticker"
            }
            canTapToAdd={activeEditorTool === "text"}
          />
          <CropOverlay
            isActive={activeEditorTool === "crop"}
            sourceAspectRatio={
              sourceImage ? sourceImage.width / sourceImage.height : 1
            }
          />

          {/* Export progress overlay */}
          {isExporting && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 rounded-lg z-10">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
              <p className="text-white text-sm font-medium">
                Exporting video {Math.round(exportProgress)}%...
              </p>
              <Progress
                value={exportProgress}
                className="w-48 h-2 bg-white/20 [&_[data-slot=progress-indicator]]:bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Toolbar with tool toggle and contextual controls */}
      {(sourceImage || isVideo) && (
        <EditorToolbar
          sourceImage={sourceImage}
          onApplyCrop={handleApplyCrop}
          onResetCrop={handleResetCrop}
        />
      )}
    </div>
  );
}
