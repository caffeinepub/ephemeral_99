import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "../hooks/useAppStore";
import {
  type CropRegion,
  MIN_CROP_SIZE,
  getAspectRatioValue,
} from "../utils/constants";

interface CropOverlayProps {
  isActive: boolean;
  sourceAspectRatio: number;
}

type DragMode = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | "move";

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

export function CropOverlay({ isActive, sourceAspectRatio }: CropOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    startCrop: CropRegion;
  } | null>(null);

  const { cropRegion, setCropRegion, cropAspectRatio } = useAppStore();

  const computeNewRegion = useCallback(
    (mode: DragMode, dx: number, dy: number, start: CropRegion): CropRegion => {
      if (mode === "move") {
        return {
          x: clamp(start.x + dx, 0, 1 - start.w),
          y: clamp(start.y + dy, 0, 1 - start.h),
          w: start.w,
          h: start.h,
        };
      }

      let x = start.x;
      let y = start.y;
      let w = start.w;
      let h = start.h;

      if (mode.includes("w")) {
        const newX = clamp(start.x + dx, 0, start.x + start.w - MIN_CROP_SIZE);
        w = start.w - (newX - start.x);
        x = newX;
      }
      if (mode.includes("e")) {
        w = clamp(start.w + dx, MIN_CROP_SIZE, 1 - start.x);
      }
      if (mode.includes("n")) {
        const newY = clamp(start.y + dy, 0, start.y + start.h - MIN_CROP_SIZE);
        h = start.h - (newY - start.y);
        y = newY;
      }
      if (mode.includes("s")) {
        h = clamp(start.h + dy, MIN_CROP_SIZE, 1 - start.y);
      }

      let region: CropRegion = { x, y, w, h };

      // Enforce aspect ratio on corner drags
      if (mode.length === 2) {
        const targetRatio = getAspectRatioValue(cropAspectRatio);
        if (targetRatio) {
          const normalizedRatio = targetRatio / sourceAspectRatio;
          const anchorMap: Record<string, "nw" | "ne" | "sw" | "se"> = {
            nw: "se",
            ne: "sw",
            sw: "ne",
            se: "nw",
          };
          const anchor = anchorMap[mode] ?? "se";

          const newH = region.w / normalizedRatio;
          if (newH <= 1) {
            region.h = newH;
          } else {
            region.h = 1;
            region.w = region.h * normalizedRatio;
          }

          if (anchor === "ne") {
            region.x = start.x + start.w - region.w;
          } else if (anchor === "sw") {
            region.y = start.y + start.h - region.h;
          } else if (anchor === "se") {
            region.x = start.x + start.w - region.w;
            region.y = start.y + start.h - region.h;
          }

          region.x = clamp(region.x, 0, 1 - region.w);
          region.y = clamp(region.y, 0, 1 - region.h);
        }
      }

      return region;
    },
    [cropAspectRatio, sourceAspectRatio],
  );

  const [isDragging, setIsDragging] = useState(false);

  const startDrag = useCallback(
    (mode: DragMode, clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      dragRef.current = {
        mode,
        startX: (clientX - rect.left) / rect.width,
        startY: (clientY - rect.top) / rect.height,
        startCrop: { ...useAppStore.getState().cropRegion },
      };
      setIsDragging(true);
    },
    [],
  );

  // Document-level listeners for drag — only attached while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      e.preventDefault();
      const rx = (e.clientX - rect.left) / rect.width;
      const ry = (e.clientY - rect.top) / rect.height;
      const dx = rx - drag.startX;
      const dy = ry - drag.startY;

      const newRegion = computeNewRegion(drag.mode, dx, dy, drag.startCrop);
      useAppStore.getState().setCropRegion(newRegion);
    };

    const handleUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, computeNewRegion]);

  const handleContainerPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive) return;
      // Only start "move" if clicking inside the crop box but not on a handle
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const rx = (e.clientX - rect.left) / rect.width;
      const ry = (e.clientY - rect.top) / rect.height;

      if (
        rx >= cropRegion.x &&
        rx <= cropRegion.x + cropRegion.w &&
        ry >= cropRegion.y &&
        ry <= cropRegion.y + cropRegion.h
      ) {
        e.preventDefault();
        e.stopPropagation();
        startDrag("move", e.clientX, e.clientY);
      }
    },
    [isActive, cropRegion, startDrag],
  );

  const handleHandlePointerDown = useCallback(
    (mode: DragMode, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startDrag(mode, e.clientX, e.clientY);
    },
    [startDrag],
  );

  const { x, y, w, h } = cropRegion;

  const corners: { id: DragMode; left: number; top: number; cursor: string }[] =
    [
      { id: "nw", left: x, top: y, cursor: "nw-resize" },
      { id: "ne", left: x + w, top: y, cursor: "ne-resize" },
      { id: "sw", left: x, top: y + h, cursor: "sw-resize" },
      { id: "se", left: x + w, top: y + h, cursor: "se-resize" },
    ];

  const edges: {
    id: DragMode;
    left: number;
    top: number;
    cursor: string;
    vertical: boolean;
  }[] = [
    { id: "n", left: x + w / 2, top: y, cursor: "n-resize", vertical: false },
    {
      id: "s",
      left: x + w / 2,
      top: y + h,
      cursor: "s-resize",
      vertical: false,
    },
    { id: "w", left: x, top: y + h / 2, cursor: "w-resize", vertical: true },
    {
      id: "e",
      left: x + w,
      top: y + h / 2,
      cursor: "e-resize",
      vertical: true,
    },
  ];

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 rounded-lg touch-none",
        isActive ? "z-10 cursor-move" : "pointer-events-none",
      )}
      onPointerDown={handleContainerPointerDown}
    >
      {isActive && (
        <>
          {/* Dimmed regions outside crop */}
          <div
            className="absolute pointer-events-none bg-black/50"
            style={{ top: 0, left: 0, right: 0, height: `${y * 100}%` }}
          />
          <div
            className="absolute pointer-events-none bg-black/50"
            style={{
              bottom: 0,
              left: 0,
              right: 0,
              height: `${Math.max(0, (1 - y - h) * 100)}%`,
            }}
          />
          <div
            className="absolute pointer-events-none bg-black/50"
            style={{
              top: `${y * 100}%`,
              left: 0,
              width: `${x * 100}%`,
              height: `${h * 100}%`,
            }}
          />
          <div
            className="absolute pointer-events-none bg-black/50"
            style={{
              top: `${y * 100}%`,
              right: 0,
              width: `${Math.max(0, (1 - x - w) * 100)}%`,
              height: `${h * 100}%`,
            }}
          />

          {/* Crop border */}
          <div
            className="absolute border-2 border-primary pointer-events-none"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: `${w * 100}%`,
              height: `${h * 100}%`,
            }}
          >
            <div className="absolute inset-0">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-primary/30" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-primary/30" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-primary/30" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-primary/30" />
            </div>
          </div>

          {/* Corner handles - interactive, large hit area */}
          {corners.map((c) => (
            <div
              key={c.id}
              className="absolute z-20"
              style={{
                left: `${c.left * 100}%`,
                top: `${c.top * 100}%`,
                transform: "translate(-50%, -50%)",
                cursor: c.cursor,
                padding: 8,
              }}
              onPointerDown={(e) => handleHandlePointerDown(c.id, e)}
            >
              <div className="w-4 h-4 bg-primary rounded-sm shadow-md" />
            </div>
          ))}

          {/* Edge handles - interactive */}
          {edges.map((edge) => (
            <div
              key={edge.id}
              className="absolute z-20"
              style={{
                left: `${edge.left * 100}%`,
                top: `${edge.top * 100}%`,
                transform: "translate(-50%, -50%)",
                cursor: edge.cursor,
                padding: 8,
              }}
              onPointerDown={(e) => handleHandlePointerDown(edge.id, e)}
            >
              <div
                className={cn(
                  "bg-primary rounded-full shadow-md",
                  edge.vertical ? "w-1.5 h-7" : "w-7 h-1.5",
                )}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
