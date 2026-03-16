'use client';

import { useEffect, useRef } from 'react';
import { EMOTION_COLORS, type EmotionName } from '@/types';

interface EmotionalPortraitProps {
  emotionCounts: Record<string, number>;
  size?: number;
  className?: string;
}

function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function draw(ctx: CanvasRenderingContext2D, size: number, emotionCounts: Record<string, number>) {
  const cx = size / 2;
  const cy = size / 2;
  ctx.clearRect(0, 0, size, size);

  const emotions = Object.entries(emotionCounts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1]);

  if (emotions.length === 0) return;

  const maxCount = emotions[0][1];
  const n = emotions.length;
  const dominantName = emotions[0][0] as EmotionName;
  const dominantColor = EMOTION_COLORS[dominantName]?.[0] ?? '#94a3b8';

  // Background radial glow
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
  bgGrad.addColorStop(0, rgba(dominantColor, 0.15));
  bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Petals — two layers per emotion (soft halo + core)
  emotions.forEach(([name, count], i) => {
    const colors = EMOTION_COLORS[name as EmotionName] ?? ['#94a3b8', '#64748b', '#475569'];
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const norm = count / maxCount;
    const len = cx * 0.28 + norm * cx * 0.52;
    const w = 7 + norm * 20;
    const perp = angle + Math.PI / 2;
    const tipX = cx + Math.cos(angle) * len;
    const tipY = cy + Math.sin(angle) * len;

    const drawPetal = (widthFactor: number, opacityBase: number) => {
      const pw = w * widthFactor;
      const cp1x = cx + Math.cos(angle) * len * 0.35 + Math.cos(perp) * pw;
      const cp1y = cy + Math.sin(angle) * len * 0.35 + Math.sin(perp) * pw;
      const cp2x = cx + Math.cos(angle) * len * 0.75 + Math.cos(perp) * pw * 0.5;
      const cp2y = cy + Math.sin(angle) * len * 0.75 + Math.sin(perp) * pw * 0.5;
      const cp3x = cx + Math.cos(angle) * len * 0.75 - Math.cos(perp) * pw * 0.5;
      const cp3y = cy + Math.sin(angle) * len * 0.75 - Math.sin(perp) * pw * 0.5;
      const cp4x = cx + Math.cos(angle) * len * 0.35 - Math.cos(perp) * pw;
      const cp4y = cy + Math.sin(angle) * len * 0.35 - Math.sin(perp) * pw;

      const g = ctx.createLinearGradient(cx, cy, tipX, tipY);
      g.addColorStop(0, rgba(colors[0], opacityBase * 0.9));
      g.addColorStop(0.55, rgba(colors[1], opacityBase));
      g.addColorStop(1, rgba(colors[2], opacityBase * 0.15));

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tipX, tipY);
      ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, cx, cy);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
    };

    drawPetal(1.9, 0.15); // soft outer halo
    drawPetal(1.0, 0.65); // core petal
  });

  // Center circle + halo
  const r = cx * 0.13;
  const halo = ctx.createRadialGradient(cx, cy, r, cx, cy, r * 2.8);
  halo.addColorStop(0, rgba(dominantColor, 0.3));
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.8, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  cg.addColorStop(0, rgba(dominantColor, 1));
  cg.addColorStop(0.65, rgba(dominantColor, 0.8));
  cg.addColorStop(1, rgba(dominantColor, 0.25));
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = cg;
  ctx.fill();
}

export function EmotionalPortrait({ emotionCounts, size = 220, className = '' }: EmotionalPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    draw(ctx, size, emotionCounts);
  }, [emotionCounts, size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label="Portrait émotionnel"
    />
  );
}
