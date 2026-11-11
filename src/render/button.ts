export interface ButtonRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function isPointInRect(p: { x: number; y: number }, r: ButtonRect): boolean {
  return p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
}

export function drawButton(
  ctx: CanvasRenderingContext2D,
  rect: ButtonRect,
  label: string,
  hover: boolean,
  fontSize = 22,
): void {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  ctx.save();
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  // Cyan outline — brighter/thicker on hover for feedback
  ctx.lineWidth = hover ? 2.5 : 2;
  ctx.strokeStyle = hover ? '#00ffff' : '#00aaff';
  ctx.strokeText(label, cx, cy);

  // Deep navy fill — same as About/Exit hints
  ctx.fillStyle = hover ? '#0a0a8a' : '#1a1a6a';
  ctx.fillText(label, cx, cy);

  ctx.restore();
}
