import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { type FilterPreset, THUMBNAIL_SIZE } from "../utils/constants";

interface FilterThumbnailProps {
  filter: FilterPreset;
  sourceImage: HTMLImageElement;
  isSelected: boolean;
  onSelect: () => void;
}

export function FilterThumbnail({
  filter,
  sourceImage,
  isSelected,
  onSelect,
}: FilterThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = THUMBNAIL_SIZE;
    canvas.height = THUMBNAIL_SIZE;

    // Draw a center-cropped square thumbnail
    const srcSize = Math.min(sourceImage.width, sourceImage.height);
    const srcX = (sourceImage.width - srcSize) / 2;
    const srcY = (sourceImage.height - srcSize) / 2;

    ctx.drawImage(
      sourceImage,
      srcX,
      srcY,
      srcSize,
      srcSize,
      0,
      0,
      THUMBNAIL_SIZE,
      THUMBNAIL_SIZE,
    );
  }, [sourceImage]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-1 shrink-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1",
      )}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "rounded-lg border-2 transition-colors",
          isSelected ? "border-primary" : "border-transparent",
        )}
        style={{
          width: THUMBNAIL_SIZE,
          height: THUMBNAIL_SIZE,
          filter: filter.cssFilter,
        }}
      />
      <span
        className={cn(
          "text-[11px] leading-tight",
          isSelected ? "text-primary font-medium" : "text-muted-foreground",
        )}
      >
        {filter.label}
      </span>
    </button>
  );
}
