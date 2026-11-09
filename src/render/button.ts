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
  // Fill — placeholder until phase 10 (original used graffiti PNGs)
  ctx.fillStyle = hover ? '#5a3fa8' : '#3a2a6a';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Border
  ctx.strokeStyle = hover ? '#ffd700' : '#8a7ac0';
  ctx.lineWidth = 3;
  ctx.strokeRect(rect.x + 1.5, rect.y + 1.5, rect.w - 3, rect.h - 3);

  // Label
  ctx.fillStyle = hover ? '#ffd700' : '#ecf0f1';
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
}
