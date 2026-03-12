import type { DrawingStroke, TextItem } from "./constants";

export function renderStrokesToCanvas(
  ctx: CanvasRenderingContext2D,
  strokes: DrawingStroke[],
  width: number,
  height: number,
  scaleFactor: number,
) {
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width * scaleFactor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
    }
    ctx.stroke();
  }
}

export function renderTextToCanvas(
  ctx: CanvasRenderingContext2D,
  items: TextItem[],
  width: number,
  height: number,
  scaleFactor: number,
) {
  for (const item of items) {
    if (!item.content) continue;
    const fontSize = item.fontSize * scaleFactor;
    ctx.font = `600 ${fontSize}px sans-serif`;
    ctx.fillStyle = item.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3 * scaleFactor;
    ctx.shadowOffsetY = 1 * scaleFactor;
    ctx.fillText(item.content, item.x * width, item.y * height);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
}
