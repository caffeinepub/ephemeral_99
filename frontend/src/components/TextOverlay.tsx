import React, { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "../hooks/useAppStore";
import { TextItemView } from "./TextItemView";

interface TextOverlayProps {
  isActive: boolean;
  canTapToAdd?: boolean;
}

let nextTextId = 0;

export function TextOverlay({
  isActive,
  canTapToAdd = true,
}: TextOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const {
    textItems,
    addTextItem,
    removeTextItem,
    setEditingTextId,
    textColor,
    textFontSize,
  } = useAppStore();

  const handleTapCanvas = (e: React.MouseEvent) => {
    if (!isActive || !canTapToAdd) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const id = `text-${nextTextId++}`;
    addTextItem({
      id,
      content: "",
      x,
      y,
      color: textColor,
      fontSize: textFontSize,
    });
    setEditingTextId(id);
  };

  const handleDropOnTrash = (itemId: string) => {
    removeTextItem(itemId);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 rounded-lg overflow-hidden",
        isActive ? "cursor-text touch-none" : "pointer-events-none",
      )}
      onClick={handleTapCanvas}
    >
      {textItems.map((item) => (
        <TextItemView
          key={item.id}
          item={item}
          containerRef={containerRef}
          trashRef={trashRef}
          onDragStateChange={setIsDraggingAny}
          onDropOnTrash={handleDropOnTrash}
        />
      ))}

      {/* Trash drop zone — appears while dragging */}
      <div
        ref={trashRef}
        className={cn(
          "absolute bottom-3 left-1/2 -translate-x-1/2 p-2.5 rounded-full bg-red-500/80 text-white transition-all duration-200 pointer-events-none",
          isDraggingAny
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4",
        )}
      >
        <Trash2 className="h-5 w-5" />
      </div>
    </div>
  );
}
