import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "../hooks/useAppStore";
import { type DrawingStroke } from "../utils/constants";

interface DrawingCanvasProps {
  isActive: boolean;
}

function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  width: number,
  height: number,
) {
  if (stroke.points.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
  }
  ctx.stroke();
}

export function DrawingCanvas({ isActive }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const { drawingStrokes, addDrawingStroke, drawColor, drawBrushSize } =
    useAppStore();

  const getRelativePos = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  const renderAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const stroke of drawingStrokes) {
      renderStroke(ctx, stroke, rect.width, rect.height);
    }
  }, [drawingStrokes]);

  useEffect(() => {
    renderAllStrokes();
  }, [renderAllStrokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => renderAllStrokes());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [renderAllStrokes]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDrawing(true);
      currentStrokeRef.current = [getRelativePos(e)];
    },
    [isActive, getRelativePos],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getRelativePos(e);
      currentStrokeRef.current.push(pos);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const points = currentStrokeRef.current;
      if (points.length < 2) return;

      const prev = points[points.length - 2];
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawBrushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(prev.x * rect.width, prev.y * rect.height);
      ctx.lineTo(pos.x * rect.width, pos.y * rect.height);
      ctx.stroke();
      ctx.restore();
    },
    [isDrawing, getRelativePos, drawColor, drawBrushSize],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStrokeRef.current.length >= 2) {
      addDrawingStroke({
        points: [...currentStrokeRef.current],
        color: drawColor,
        width: drawBrushSize,
      });
    }
    currentStrokeRef.current = [];
  }, [isDrawing, addDrawingStroke, drawColor, drawBrushSize]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "absolute inset-0 w-full h-full rounded-lg",
        isActive ? "cursor-crosshair touch-none" : "pointer-events-none",
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
