import type { QRShape, CornerMarkerShape } from './config';

export function drawDot(
  ctx: any,
  x: number,
  y: number,
  size: number,
  shape: QRShape,
  spacing: number
): void {
  const actualSize = size * spacing;
  const halfSize = actualSize / 2;
  
  ctx.beginPath();
  
  switch (shape.type) {
    case 'circle':
      ctx.arc(x, y, halfSize, 0, Math.PI * 2);
      break;
      
    case 'square':
      ctx.rect(x - halfSize, y - halfSize, actualSize, actualSize);
      break;
      
    case 'roundedSquare':
      const radius = shape.radius || actualSize * 0.3;
      if (ctx.roundRect) {
        ctx.roundRect(x - halfSize, y - halfSize, actualSize, actualSize, radius);
      } else {
        ctx.moveTo(x - halfSize + radius, y - halfSize);
        ctx.lineTo(x + halfSize - radius, y - halfSize);
        ctx.quadraticCurveTo(x + halfSize, y - halfSize, x + halfSize, y - halfSize + radius);
        ctx.lineTo(x + halfSize, y + halfSize - radius);
        ctx.quadraticCurveTo(x + halfSize, y + halfSize, x + halfSize - radius, y + halfSize);
        ctx.lineTo(x - halfSize + radius, y + halfSize);
        ctx.quadraticCurveTo(x - halfSize, y + halfSize, x - halfSize + radius, y + halfSize);
        ctx.lineTo(x - halfSize, y - halfSize + radius);
        ctx.quadraticCurveTo(x - halfSize, y - halfSize, x - halfSize + radius, y - halfSize);
      }
      break;
  }
  
  ctx.closePath();
  ctx.fill();
}

export function drawRoundedRect(
  ctx: any,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawCornerMarker(
  ctx: any,
  x: number,
  y: number,
  cellSize: number,
  cornerSize: number,
  shape: CornerMarkerShape,
  fgColor: string,
  bgColor: string
): void {
  const size = cornerSize * cellSize;
  
  if (shape.type === 'roundedSquare') {
    const cornerRadius = shape.radius || cellSize * 1.8;
    
    // Outer shell
    ctx.fillStyle = fgColor;
    drawRoundedRect(ctx, x, y, size, size, cornerRadius);
    
    // Inner cutout
    ctx.fillStyle = bgColor;
    const innerRadius = Math.max(0, cornerRadius - cellSize);
    drawRoundedRect(ctx, x + cellSize, y + cellSize, size - cellSize * 2, size - cellSize * 2, innerRadius);
    
    // Center dot
    ctx.fillStyle = fgColor;
    const centerDotX = x + cellSize * 3.5;
    const centerDotY = y + cellSize * 3.5;
    const centerDotR = cellSize * 1.5;
    
    ctx.beginPath();
    ctx.arc(centerDotX, centerDotY, centerDotR, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Square corner marker
    ctx.fillStyle = fgColor;
    ctx.fillRect(x, y, size, size);
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(x + cellSize, y + cellSize, size - cellSize * 2, size - cellSize * 2);
    
    ctx.fillStyle = fgColor;
    ctx.fillRect(x + cellSize * 2.5, y + cellSize * 2.5, cellSize * 2, cellSize * 2);
  }
}
