import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "../hooks/useAppStore";
import { type TextItem } from "../utils/constants";

interface TextItemViewProps {
  item: TextItem;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onDragStateChange?: (isDragging: boolean) => void;
  onDropOnTrash?: (itemId: string) => void;
  trashRef?: React.RefObject<HTMLDivElement | null>;
}

export function TextItemView({
  item,
  containerRef,
  onDragStateChange,
  onDropOnTrash,
  trashRef,
}: TextItemViewProps) {
  const { updateTextItem, setEditingTextId, editingTextId } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, itemX: 0, itemY: 0 });

  const isEditing = editingTextId === item.id;

  const checkOverTrash = (clientX: number, clientY: number) => {
    if (!trashRef?.current) return false;
    const trashRect = trashRef.current.getBoundingClientRect();
    return (
      clientX >= trashRect.left &&
      clientX <= trashRect.right &&
      clientY >= trashRect.top &&
      clientY <= trashRect.bottom
    );
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setIsOverTrash(false);
    onDragStateChange?.(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      itemX: item.x,
      itemY: item.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dx = (e.clientX - dragStartRef.current.x) / rect.width;
    const dy = (e.clientY - dragStartRef.current.y) / rect.height;
    updateTextItem(item.id, {
      x: Math.max(0, Math.min(1, dragStartRef.current.itemX + dx)),
      y: Math.max(0, Math.min(1, dragStartRef.current.itemY + dy)),
    });
    setIsOverTrash(checkOverTrash(e.clientX, e.clientY));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsOverTrash(false);
    onDragStateChange?.(false);

    if (checkOverTrash(e.clientX, e.clientY)) {
      onDropOnTrash?.(item.id);
      return;
    }

    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    // Treat as tap if barely moved — stickers don't enter edit mode
    if (dx < 5 && dy < 5 && !item.isSticker) {
      setEditingTextId(item.id);
    }
  };

  if (!item.content) return null;

  return (
    <div
      className={cn(
        "absolute select-none cursor-move touch-none -translate-x-1/2 -translate-y-1/2 whitespace-nowrap",
        isEditing && "ring-2 ring-primary rounded px-1",
        isDragging && "scale-110 transition-transform",
        isOverTrash && "opacity-50 scale-90",
      )}
      style={{
        left: `${item.x * 100}%`,
        top: `${item.y * 100}%`,
        color: item.color,
        fontSize: `${item.fontSize}px`,
        textShadow: "0 1px 3px rgba(0,0,0,0.5)",
        fontWeight: 600,
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {item.content}
    </div>
  );
}
