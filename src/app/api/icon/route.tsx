import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export function GET(request: NextRequest) {
  const size = parseInt(request.nextUrl.searchParams.get('size') || '192');
  const radius = Math.round(size * 0.18);

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: `${radius}px`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0px',
          }}
        >
          <span
            style={{
              color: '#faf9f7',
              fontSize: size * 0.45,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            E
          </span>
          <div
            style={{
              width: size * 0.08,
              height: size * 0.08,
              borderRadius: '50%',
              background: '#6366f1',
              marginTop: size * 0.02,
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
