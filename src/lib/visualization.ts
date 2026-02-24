import { type EmotionName, type VisualizationStyle, EMOTION_COLORS } from '@/types';

interface VisualizationParams {
  emotion: EmotionName;
  intensity: number;
  style: VisualizationStyle;
  size?: number;
}

function getColors(emotion: EmotionName): [string, string, string] {
  return EMOTION_COLORS[emotion] || EMOTION_COLORS.joie;
}

function clampIntensity(intensity: number): number {
  return Math.max(0, Math.min(10, Number.isFinite(intensity) ? intensity : 5));
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- Style: Géométrique ---
function drawGeometrique(ctx: CanvasRenderingContext2D, size: number, emotion: EmotionName, intensity: number) {
  const colors = getColors(emotion);
  const i = clampIntensity(intensity);
  const center = size / 2;

  // Background gradient
  const bg = ctx.createRadialGradient(center, center, 0, center, center, size * 0.7);
  bg.addColorStop(0, hexToRgba(colors[0], 0.08));
  bg.addColorStop(1, hexToRgba(colors[2], 0.03));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  const numShapes = 3 + Math.floor(i * 0.8);
  for (let s = 0; s < numShapes; s++) {
    const sides = 3 + Math.floor(Math.random() * 5);
    const radius = 30 + Math.random() * (i * 12);
    const cx = center + (Math.random() - 0.5) * size * 0.5;
    const cy = center + (Math.random() - 0.5) * size * 0.5;
    const rotation = Math.random() * Math.PI * 2;

    ctx.beginPath();
    for (let j = 0; j <= sides; j++) {
      const angle = rotation + (j / sides) * Math.PI * 2;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.fillStyle = hexToRgba(colors[s % 3], 0.15 + i * 0.04);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(colors[s % 3], 0.3 + i * 0.05);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Central rotating polygon
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(i * 0.3);
  const mainSides = 5 + Math.floor(i / 3);
  const mainRadius = 40 + i * 8;
  ctx.beginPath();
  for (let j = 0; j <= mainSides; j++) {
    const angle = (j / mainSides) * Math.PI * 2;
    const px = Math.cos(angle) * mainRadius;
    const py = Math.sin(angle) * mainRadius;
    if (j === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = hexToRgba(colors[0], 0.2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(colors[1], 0.6);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// --- Style: Organique ---
function drawOrganique(ctx: CanvasRenderingContext2D, size: number, emotion: EmotionName, intensity: number) {
  const colors = getColors(emotion);
  const i = clampIntensity(intensity);
  const center = size / 2;

  // Soft background
  const bg = ctx.createRadialGradient(center, center, 0, center, center, size * 0.8);
  bg.addColorStop(0, hexToRgba(colors[1], 0.06));
  bg.addColorStop(1, hexToRgba(colors[2], 0.02));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  const numBlobs = 3 + Math.floor(i * 0.6);
  for (let b = 0; b < numBlobs; b++) {
    const bx = center + (Math.random() - 0.5) * size * 0.4;
    const by = center + (Math.random() - 0.5) * size * 0.4;
    const blobSize = 40 + Math.random() * (i * 15);
    const points = 6 + Math.floor(Math.random() * 4);

    ctx.beginPath();
    for (let p = 0; p <= points; p++) {
      const angle = (p / points) * Math.PI * 2;
      const wobble = blobSize * (0.7 + Math.random() * 0.6);
      const px = bx + Math.cos(angle) * wobble;
      const py = by + Math.sin(angle) * wobble;

      if (p === 0) {
        ctx.moveTo(px, py);
      } else {
        const cpAngle = ((p - 0.5) / points) * Math.PI * 2;
        const cpDist = wobble * 1.2;
        const cpx = bx + Math.cos(cpAngle) * cpDist;
        const cpy = by + Math.sin(cpAngle) * cpDist;
        ctx.quadraticCurveTo(cpx, cpy, px, py);
      }
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, blobSize);
    grad.addColorStop(0, hexToRgba(colors[b % 3], 0.3 + i * 0.03));
    grad.addColorStop(1, hexToRgba(colors[(b + 1) % 3], 0.05));
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

// --- Style: Aquarelle ---
function drawAquarelle(ctx: CanvasRenderingContext2D, size: number, emotion: EmotionName, intensity: number) {
  const colors = getColors(emotion);
  const i = clampIntensity(intensity);

  // Paper texture background
  ctx.fillStyle = '#faf9f7';
  ctx.fillRect(0, 0, size, size);

  // Grain texture
  for (let g = 0; g < 2000; g++) {
    const gx = Math.random() * size;
    const gy = Math.random() * size;
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.02})`;
    ctx.fillRect(gx, gy, 1, 1);
  }

  const layers = 4 + Math.floor(i * 0.5);
  for (let l = 0; l < layers; l++) {
    const lx = size * (0.2 + Math.random() * 0.6);
    const ly = size * (0.2 + Math.random() * 0.6);
    const layerSize = 60 + Math.random() * (i * 20);

    // Multiple overlapping circles for watercolor effect
    for (let c = 0; c < 8; c++) {
      const cx = lx + (Math.random() - 0.5) * layerSize * 0.4;
      const cy = ly + (Math.random() - 0.5) * layerSize * 0.4;
      const cr = layerSize * (0.3 + Math.random() * 0.5);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      grad.addColorStop(0, hexToRgba(colors[l % 3], 0.06 + i * 0.008));
      grad.addColorStop(0.6, hexToRgba(colors[(l + 1) % 3], 0.03));
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // Edge bleeding effect
  for (let e = 0; e < 3; e++) {
    const ex = size * Math.random();
    const ey = size * Math.random();
    const er = 20 + Math.random() * i * 8;
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(colors[e % 3], 0.04);
    ctx.fill();
  }
}

// --- Style: Minimaliste ---
function drawMinimaliste(ctx: CanvasRenderingContext2D, size: number, emotion: EmotionName, intensity: number) {
  const colors = getColors(emotion);
  const i = clampIntensity(intensity);
  const center = size / 2;

  // Clean white background
  ctx.fillStyle = '#fefefe';
  ctx.fillRect(0, 0, size, size);

  // Concentric empty circles
  const numCircles = 2 + Math.floor(i * 0.4);
  for (let c = 0; c < numCircles; c++) {
    const radius = 30 + c * (size / (numCircles * 2.5));
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(colors[c % 3], 0.15 + c * 0.05);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Minimal lines
  const numLines = 2 + Math.floor(i * 0.3);
  for (let l = 0; l < numLines; l++) {
    ctx.beginPath();
    const startX = size * (0.1 + Math.random() * 0.3);
    const startY = size * (0.2 + Math.random() * 0.6);
    const endX = size * (0.6 + Math.random() * 0.3);
    const endY = size * (0.2 + Math.random() * 0.6);
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = hexToRgba(colors[l % 3], 0.12);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Small accent dot
  ctx.beginPath();
  ctx.arc(center + i * 3, center - i * 2, 4 + i * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(colors[0], 0.4);
  ctx.fill();
}

// --- Style: Abstrait ---
function drawAbstrait(ctx: CanvasRenderingContext2D, size: number, emotion: EmotionName, intensity: number) {
  const colors = getColors(emotion);
  const i = clampIntensity(intensity);

  // Dark-tinted background
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, hexToRgba(colors[2], 0.05));
  bg.addColorStop(1, hexToRgba(colors[0], 0.08));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Rectangles
  const numRects = 3 + Math.floor(i * 0.7);
  for (let r = 0; r < numRects; r++) {
    const rx = Math.random() * size * 0.7;
    const ry = Math.random() * size * 0.7;
    const rw = 30 + Math.random() * i * 15;
    const rh = 20 + Math.random() * i * 12;

    ctx.save();
    ctx.translate(rx + rw / 2, ry + rh / 2);
    ctx.rotate((Math.random() - 0.5) * 0.8);
    ctx.fillStyle = hexToRgba(colors[r % 3], 0.12 + i * 0.02);
    ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
    ctx.restore();
  }

  // Expressive curves
  const numCurves = 2 + Math.floor(i * 0.4);
  for (let c = 0; c < numCurves; c++) {
    ctx.beginPath();
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    ctx.moveTo(sx, sy);

    const cp1x = Math.random() * size;
    const cp1y = Math.random() * size;
    const cp2x = Math.random() * size;
    const cp2y = Math.random() * size;
    const ex = Math.random() * size;
    const ey = Math.random() * size;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
    ctx.strokeStyle = hexToRgba(colors[c % 3], 0.2 + i * 0.04);
    ctx.lineWidth = 1.5 + i * 0.3;
    ctx.stroke();
  }
}

// --- Style: Mosaïque ---
function drawMosaique(ctx: CanvasRenderingContext2D, size: number, emotion: EmotionName, intensity: number) {
  const colors = getColors(emotion);
  const i = clampIntensity(intensity);

  const gridSize = 4 + Math.floor(i * 0.6);
  const tileSize = size / gridSize;
  const gap = 2;

  // Background
  ctx.fillStyle = '#f8f8f6';
  ctx.fillRect(0, 0, size, size);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = col * tileSize + gap;
      const y = row * tileSize + gap;
      const w = tileSize - gap * 2;
      const h = tileSize - gap * 2;

      const colorIdx = (row + col) % 3;
      const alpha = 0.1 + Math.random() * (i * 0.06);
      const radius = Math.min(w, h) * 0.15;

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fillStyle = hexToRgba(colors[colorIdx], alpha);
      ctx.fill();

      // Random accent tiles
      if (Math.random() < i * 0.05) {
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, w - 4, h - 4, radius);
        ctx.strokeStyle = hexToRgba(colors[(colorIdx + 1) % 3], 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

// --- Main Generator ---
export function generateVisualization({ emotion, intensity, style, size = 400 }: VisualizationParams): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const drawFunctions: Record<VisualizationStyle, typeof drawGeometrique> = {
    geometrique: drawGeometrique,
    organique: drawOrganique,
    aquarelle: drawAquarelle,
    minimaliste: drawMinimaliste,
    abstrait: drawAbstrait,
    mosaique: drawMosaique,
  };

  const drawFn = drawFunctions[style];
  drawFn(ctx, size, emotion, clampIntensity(intensity));

  return canvas.toDataURL('image/png');
}

export function generateVisualizationHD(params: VisualizationParams): string {
  return generateVisualization({ ...params, size: 2000 });
}
