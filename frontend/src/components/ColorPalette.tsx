import { cn } from "@/lib/utils";
import { EDITOR_COLORS } from "../utils/constants";

interface ColorPaletteProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export function ColorPalette({
  selectedColor,
  onSelectColor,
}: ColorPaletteProps) {
  return (
    <div className="flex gap-2 items-center justify-center flex-wrap">
      {EDITOR_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onSelectColor(color)}
          className={cn(
            "w-7 h-7 rounded-full border-2 shrink-0 transition-transform",
            selectedColor === color
              ? "border-primary scale-110"
              : "border-muted-foreground/30",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
