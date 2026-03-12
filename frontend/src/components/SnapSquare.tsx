interface SnapSquareProps {
  filled: boolean;
  color: string;
}

export function SnapSquare({ filled, color }: SnapSquareProps) {
  return (
    <div
      className="w-3 h-3 rounded-[1px] shrink-0"
      style={
        filled ? { backgroundColor: color } : { border: `2px solid ${color}` }
      }
    />
  );
}
