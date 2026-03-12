interface SnapArrowProps {
  filled: boolean;
  color: string;
}

export function SnapArrow({ filled, color }: SnapArrowProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0">
      <path
        d="M2 1L11 6L2 11V1Z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={filled ? 0 : 1.5}
      />
    </svg>
  );
}
