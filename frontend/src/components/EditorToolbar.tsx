import {
  Check,
  Crop,
  ImageIcon,
  Pencil,
  RotateCcw,
  Smile,
  Trash2,
  Type,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAppStore } from "../hooks/useAppStore";
import { ColorPalette } from "./ColorPalette";
import { FilterThumbnail } from "./FilterThumbnail";
import {
  type EditorTool,
  type CropAspectRatio,
  FILTER_PRESETS,
  EMOJI_STICKERS,
  DEFAULT_STICKER_SIZE,
  CROP_ASPECT_RATIOS,
  MIN_TEXT_FONT_SIZE,
  MAX_TEXT_FONT_SIZE,
  MIN_BRUSH_SIZE,
  MAX_BRUSH_SIZE,
  getAspectRatioValue,
} from "../utils/constants";

interface EditorToolbarProps {
  sourceImage: HTMLImageElement | null;
  onApplyCrop: () => void;
  onResetCrop: () => void;
}

const EDITOR_TOOLS: {
  value: EditorTool;
  icon: typeof ImageIcon;
  label: string;
}[] = [
  { value: "filter", icon: ImageIcon, label: "Filter" },
  { value: "text", icon: Type, label: "Text" },
  { value: "sticker", icon: Smile, label: "Sticker" },
  { value: "draw", icon: Pencil, label: "Draw" },
  { value: "crop", icon: Crop, label: "Crop" },
];

export function EditorToolbar({
  sourceImage,
  onApplyCrop,
  onResetCrop,
}: EditorToolbarProps) {
  const {
    activeEditorTool,
    setActiveEditorTool,
    selectedFilter,
    setSelectedFilter,
    textItems,
    editingTextId,
    setEditingTextId,
    updateTextItem,
    removeTextItem,
    textColor,
    setTextColor,
    textFontSize,
    setTextFontSize,
    addTextItem,
    drawColor,
    setDrawColor,
    drawBrushSize,
    setDrawBrushSize,
    undoDrawingStroke,
    clearDrawingStrokes,
    drawingStrokes,
    cropAspectRatio,
    setCropAspectRatio,
    setCropRegion,
  } = useAppStore();

  const activeFilter = selectedFilter ?? "normal";
  const editingItem = editingTextId
    ? textItems.find((t) => t.id === editingTextId)
    : null;

  const handleTextContentChange = (content: string) => {
    if (editingTextId) {
      updateTextItem(editingTextId, { content });
    }
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    if (editingTextId) {
      updateTextItem(editingTextId, { color });
    }
  };

  const handleTextSizeChange = (value: number[]) => {
    const size = value[0];
    setTextFontSize(size);
    if (editingTextId) {
      updateTextItem(editingTextId, { fontSize: size });
    }
  };

  const handleDoneEditing = () => {
    if (editingItem && !editingItem.content.trim()) {
      removeTextItem(editingItem.id);
    }
    setEditingTextId(null);
  };

  const handleDeleteText = () => {
    if (editingTextId) {
      removeTextItem(editingTextId);
    }
  };

  let nextStickerId = 0;
  const handleAddSticker = (emoji: string) => {
    addTextItem({
      id: `sticker-${Date.now()}-${nextStickerId++}`,
      content: emoji,
      x: 0.5,
      y: 0.5,
      color: "#FFFFFF",
      fontSize: DEFAULT_STICKER_SIZE,
      isSticker: true,
    });
  };

  const handleAspectRatioChange = (ratio: CropAspectRatio) => {
    setCropAspectRatio(ratio);
    const targetRatio = getAspectRatioValue(ratio);
    if (!targetRatio || !sourceImage) return;

    const sourceAR = sourceImage.width / sourceImage.height;
    const normalizedRatio = targetRatio / sourceAR;

    let newW: number;
    let newH: number;
    if (normalizedRatio >= 1) {
      newW = 1;
      newH = 1 / normalizedRatio;
    } else {
      newH = 1;
      newW = normalizedRatio;
    }

    setCropRegion({
      x: (1 - newW) / 2,
      y: (1 - newH) / 2,
      w: newW,
      h: newH,
    });
  };

  return (
    <div className="bg-card">
      <ScrollArea className="w-full">
        <div className="flex gap-1 py-2 px-2 w-max mx-auto">
          {EDITOR_TOOLS.map(({ value, icon: Icon, label }) => {
            const isActive = activeEditorTool === value;
            return (
              <button
                key={value}
                onClick={() => setActiveEditorTool(value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="px-4 pb-3 space-y-2">
        {activeEditorTool === "filter" && sourceImage && (
          <ScrollArea className="w-full">
            <div className="flex gap-2">
              {FILTER_PRESETS.map((filter) => (
                <FilterThumbnail
                  key={filter.name}
                  filter={filter}
                  sourceImage={sourceImage}
                  isSelected={activeFilter === filter.name}
                  onSelect={() => setSelectedFilter(filter.name)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {activeEditorTool === "text" && (
          <>
            {editingItem ? (
              <div className="flex gap-2 items-center">
                <Input
                  value={editingItem.content}
                  onChange={(e) => handleTextContentChange(e.target.value)}
                  placeholder="Enter text..."
                  className="flex-1 text-base"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleDoneEditing();
                    }
                  }}
                />
                <Button variant="ghost" size="icon" onClick={handleDoneEditing}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDeleteText}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Tap the image to add text
              </p>
            )}
            <ColorPalette
              selectedColor={textColor}
              onSelectColor={handleTextColorChange}
            />
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">A</span>
              <Slider
                value={[textFontSize]}
                onValueChange={handleTextSizeChange}
                min={MIN_TEXT_FONT_SIZE}
                max={MAX_TEXT_FONT_SIZE}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-bold text-muted-foreground">A</span>
            </div>
          </>
        )}

        {activeEditorTool === "sticker" && (
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_STICKERS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddSticker(emoji)}
                className="h-10 w-full flex items-center justify-center text-2xl rounded-md hover:bg-muted/50 active:scale-90 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {activeEditorTool === "crop" && (
          <>
            <div className="flex gap-2 justify-center flex-wrap">
              {CROP_ASPECT_RATIOS.map((ratio) => (
                <Button
                  key={ratio.value}
                  variant={
                    cropAspectRatio === ratio.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleAspectRatioChange(ratio.value)}
                >
                  {ratio.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={onResetCrop}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={onApplyCrop}>
                <Check className="h-4 w-4 mr-1" />
                Apply
              </Button>
            </div>
          </>
        )}

        {activeEditorTool === "draw" && (
          <>
            <ColorPalette
              selectedColor={drawColor}
              onSelectColor={setDrawColor}
            />
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              <Slider
                value={[drawBrushSize]}
                onValueChange={(val) => setDrawBrushSize(val[0])}
                min={MIN_BRUSH_SIZE}
                max={MAX_BRUSH_SIZE}
                step={1}
                className="flex-1"
              />
              <div className="w-4 h-4 rounded-full bg-foreground shrink-0" />
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={undoDrawingStroke}
                disabled={drawingStrokes.length === 0}
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearDrawingStrokes}
                disabled={drawingStrokes.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
