export interface FilterPreset {
  name: string;
  label: string;
  cssFilter: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { name: "normal", label: "Normal", cssFilter: "none" },
  { name: "grayscale", label: "B&W", cssFilter: "grayscale(100%)" },
  { name: "sepia", label: "Sepia", cssFilter: "sepia(80%)" },
  {
    name: "warm",
    label: "Warm",
    cssFilter: "saturate(1.3) hue-rotate(-10deg) brightness(1.05)",
  },
  {
    name: "cool",
    label: "Cool",
    cssFilter: "saturate(0.9) hue-rotate(15deg) brightness(1.05)",
  },
  {
    name: "highcontrast",
    label: "Contrast",
    cssFilter: "contrast(1.4) saturate(1.2)",
  },
  {
    name: "vintage",
    label: "Vintage",
    cssFilter: "sepia(40%) contrast(0.9) brightness(1.1) saturate(0.8)",
  },
  {
    name: "noir",
    label: "Noir",
    cssFilter: "grayscale(100%) contrast(1.3) brightness(0.9)",
  },
  {
    name: "fade",
    label: "Fade",
    cssFilter: "contrast(0.8) brightness(1.1) saturate(0.7)",
  },
];

export const THUMBNAIL_SIZE = 80;

// Editor tools
export type EditorTool = "filter" | "text" | "draw" | "sticker" | "crop";

// Crop
export interface CropRegion {
  x: number; // 0-1, left edge relative to source
  y: number; // 0-1, top edge relative to source
  w: number; // 0-1, width relative to source
  h: number; // 0-1, height relative to source
}

export type CropAspectRatio = "free" | "1:1" | "4:3" | "16:9" | "9:16";

export const CROP_ASPECT_RATIOS: { value: CropAspectRatio; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
];

export function getAspectRatioValue(ratio: CropAspectRatio): number | null {
  switch (ratio) {
    case "free":
      return null;
    case "1:1":
      return 1;
    case "4:3":
      return 4 / 3;
    case "16:9":
      return 16 / 9;
    case "9:16":
      return 9 / 16;
  }
}

export const DEFAULT_CROP_REGION: CropRegion = { x: 0, y: 0, w: 1, h: 1 };
export const MIN_CROP_SIZE = 0.1;

export interface TextItem {
  id: string;
  content: string;
  x: number; // 0-1 relative horizontal position
  y: number; // 0-1 relative vertical position
  color: string;
  fontSize: number; // pixels at display size
  isSticker?: boolean;
}

export interface DrawingStroke {
  points: { x: number; y: number }[]; // 0-1 relative positions
  color: string;
  width: number; // pixels at display size
}

export const EDITOR_COLORS = [
  "#FFFFFF",
  "#000000",
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#00C7BE",
  "#007AFF",
  "#5856D6",
  "#FF2D55",
];

export const DEFAULT_TEXT_FONT_SIZE = 24;
export const MIN_TEXT_FONT_SIZE = 12;
export const MAX_TEXT_FONT_SIZE = 48;

export const DEFAULT_BRUSH_SIZE = 4;
export const MIN_BRUSH_SIZE = 2;
export const MAX_BRUSH_SIZE = 16;

// Video recording
export const MAX_VIDEO_DURATION_MS = 60_000;
export const LONG_PRESS_THRESHOLD_MS = 300;

export function getSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus"))
    return "video/webm;codecs=vp9,opus";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus"))
    return "video/webm;codecs=vp8,opus";
  if (MediaRecorder.isTypeSupported("video/webm")) return "video/webm";
  if (MediaRecorder.isTypeSupported("video/mp4")) return "video/mp4";
  return "";
}

export const DEFAULT_STICKER_SIZE = 48;

export const EMOJI_STICKERS = [
  "😀",
  "😂",
  "🥹",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "😭",
  "🥺",
  "😤",
  "🤯",
  "🥳",
  "😈",
  "👻",
  "💀",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "💕",
  "🔥",
  "⭐",
  "✨",
  "💯",
  "🎉",
  "👑",
  "💎",
  "👍",
  "👎",
  "🙌",
  "👏",
  "✌️",
  "💪",
  "🙏",
  "🫶",
  "🦋",
  "🌈",
];

// Snapchat status colors
export const SNAP_RED = "#E5403D";
export const SNAP_PURPLE = "#C038FF";
export const SNAP_GRAY = "#8E8E93";
export const SNAP_BLUE = "#0AADFF";
