import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET(request: NextRequest) {
  const size = parseInt(request.nextUrl.searchParams.get('size') || '192');
  const r = Math.round(size * 0.18);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#0f172a"/>
  <text x="${Math.round(size/2)}" y="${Math.round(size * 0.66)}" font-family="Georgia,serif" font-size="${Math.round(size * 0.46)}" font-weight="700" fill="#faf9f7" text-anchor="middle">E</text>
  <circle cx="${Math.round(size/2)}" cy="${Math.round(size * 0.83)}" r="${Math.round(size * 0.04)}" fill="#6366f1"/>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
