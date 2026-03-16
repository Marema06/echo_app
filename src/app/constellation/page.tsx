'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { EMOTION_COLORS, type EmotionName, type Entry } from '@/types';
import { X, Calendar, Zap } from 'lucide-react';
import Link from 'next/link';

const EMOTION_COLOR_MEANING: Record<string, string> = {
  joie:        'Jaune & orange — soleil, énergie, chaleur',
  tristesse:   'Bleu profond — mélancolie, intériorité',
  colère:      'Rouge vif — intensité, feu intérieur',
  peur:        'Noir & vert sombre — obscurité, instinct',
  sérénité:    'Vert pâle & bleu ciel — nature, apaisement',
  surprise:    'Jaune & rose — vivacité, l\'inattendu',
  nostalgie:   'Mauve & violet — rêverie, mémoire',
  anxiété:     'Gris — brume, incertitude',
  espoir:      'Bleu ciel & or — aube, lumière à venir',
  frustration: 'Orange & rouge — tension retenue',
};

interface Star {
  id: string;
  x: number;
  y: number;
  r: number;
  color: string;
  phase: number;
  entry: Entry;
}

// Each emotion occupies a zone in the sky (evenly distributed around center)
const EMOTIONS_ORDER = [
  'joie', 'sérénité', 'espoir', 'surprise', 'nostalgie',
  'tristesse', 'peur', 'anxiété', 'colère', 'frustration',
] as const;

const EMOTION_ANGLES: Record<string, number> = Object.fromEntries(
  EMOTIONS_ORDER.map((e, i) => [e, -Math.PI / 2 + (i / EMOTIONS_ORDER.length) * Math.PI * 2])
);

function seeded(seed: string) {
  let s = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 1);
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0xffffffff;
  };
}

function hexRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function computeStars(entries: Entry[], W: number, H: number): Star[] {
  const cx = W / 2;
  const cy = H / 2;
  const zoneR = Math.min(W, H) * 0.34;
  return entries.map(entry => {
    const emotion = entry.analysis.dominantEmotion;
    const angle = EMOTION_ANGLES[emotion] ?? 0;
    const rng = seeded(entry.id);
    const scatter = 30 + rng() * 60;
    const a = rng() * Math.PI * 2;
    return {
      id: entry.id,
      x: cx + Math.cos(angle) * zoneR + Math.cos(a) * scatter,
      y: cy + Math.sin(angle) * zoneR + Math.sin(a) * scatter,
      r: 4 + (entry.analysis.intensity / 10) * 6,   // 4–10px
      color: EMOTION_COLORS[emotion as EmotionName]?.[0] ?? '#94a3b8',
      phase: rng() * Math.PI * 2,
      entry,
    };
  });
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  stars: Star[],
  hovered: Star | null,
  selected: Star | null,
  t: number,
) {
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#04060f';
  ctx.fillRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
  bg.addColorStop(0, 'rgba(15,23,42,0.6)');
  bg.addColorStop(1, 'rgba(2,6,23,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Emotion zone labels
  const zoneR = Math.min(W, H) * 0.34;
  for (const emotion of EMOTIONS_ORDER) {
    const angle = EMOTION_ANGLES[emotion];
    const lx = W / 2 + Math.cos(angle) * (zoneR + 72);
    const ly = H / 2 + Math.sin(angle) * (zoneR + 72);
    const [r, g, b] = hexRgb(EMOTION_COLORS[emotion as EmotionName]?.[0] ?? '#94a3b8');
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(${r},${g},${b},0.65)`;
    ctx.fillText(emotion.toUpperCase(), lx, ly);
  }

  // Connection lines (nearest neighbor within same emotion group)
  const groups: Record<string, Star[]> = {};
  for (const star of stars) {
    const em = star.entry.analysis.dominantEmotion;
    if (!groups[em]) groups[em] = [];
    groups[em].push(star);
  }

  for (const group of Object.values(groups)) {
    if (group.length < 2) continue;
    const [r, g, b] = hexRgb(group[0].color);
    for (const star of group) {
      let minD = Infinity;
      let nearest: Star | null = null;
      for (const other of group) {
        if (other.id === star.id) continue;
        const d = Math.hypot(star.x - other.x, star.y - other.y);
        if (d < minD) { minD = d; nearest = other; }
      }
      if (nearest && minD < 140) {
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(nearest.x, nearest.y);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.1)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // Stars
  for (const star of stars) {
    const isHov = hovered?.id === star.id;
    const isSel = selected?.id === star.id;
    const twinkle = 0.75 + 0.25 * Math.sin(t * 1.4 + star.phase);
    const alpha = isHov || isSel ? 1 : twinkle;
    const displayR = isHov || isSel ? star.r * 2 : star.r;
    const [r, g, b] = hexRgb(star.color);

    // Outer glow
    const glowR = displayR * 5;
    const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowR);
    glow.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.5})`);
    glow.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.2})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(star.x, star.y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Solid colored core
    ctx.beginPath();
    ctx.arc(star.x, star.y, displayR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fill();

    // White center highlight
    ctx.beginPath();
    ctx.arc(star.x, star.y, displayR * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
    ctx.fill();
  }
}

export default function ConstellationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const starsRef = useRef<Star[]>([]);
  const hoveredRef = useRef<Star | null>(null);
  const selectedRef = useRef<Star | null>(null);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Star | null>(null);
  const [hovered, setHovered] = useState<Star | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Keep refs in sync
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // Fetch entries
  useEffect(() => {
    fetch('/api/entries?limit=500')
      .then(r => r.json())
      .then(d => setEntries(d.entries || []))
      .finally(() => setLoading(false));
  }, []);

  // Resize
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight - 72 });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Canvas setup + star computation + animation — all in one effect so stars
  // are always computed before the loop starts, and the effect re-runs when
  // entries load (canvas only mounts after entries arrive).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w) return;

    // Compute stars synchronously before the first frame
    starsRef.current = entries.length ? computeStars(entries, size.w, size.h) : [];

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const loop = (ts: number) => {
      drawFrame(ctx, size.w, size.h, starsRef.current, hoveredRef.current, selectedRef.current, ts / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [entries, size]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const found = starsRef.current.find(s => Math.hypot(s.x - mx, s.y - my) < s.r + 10) ?? null;
    hoveredRef.current = found;
    setHovered(found);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = starsRef.current.find(s => Math.hypot(s.x - mx, s.y - my) < s.r + 10) ?? null;
    setSelected(prev => (hit && prev?.id !== hit.id) ? hit : null);
  }, []);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="h-screen overflow-hidden bg-[#04060f] flex flex-col">
      <Topbar />
      <div className="relative flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-2 h-2 bg-white/30 rounded-full mx-auto animate-pulse" />
              <p className="text-white/30 text-sm tracking-widest uppercase">Chargement</p>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <p className="text-white/40 text-sm">Aucune étoile pour l&apos;instant.</p>
              <Link href="/create"
                className="inline-block px-5 py-2.5 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition-all">
                Créer une entrée
              </Link>
            </div>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              className="block"
              style={{ cursor: hovered ? 'pointer' : 'default' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => { hoveredRef.current = null; setHovered(null); }}
              onClick={handleClick}
            />

            {/* Hover tooltip */}
            {hovered && !selected && (
              <div
                className="absolute pointer-events-none z-10 bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white max-w-[200px] shadow-xl"
                style={{ left: Math.min(hovered.x + 14, size.w - 224), top: Math.max(hovered.y - 44, 8) }}
              >
                <p className="font-semibold capitalize" style={{ color: hovered.color }}>
                  {hovered.entry.analysis.dominantEmotion}
                </p>
                <p className="text-white/30 mt-0.5 text-[10px] italic leading-relaxed">
                  {EMOTION_COLOR_MEANING[hovered.entry.analysis.dominantEmotion]}
                </p>
                <p className="text-white/40 mt-1">{fmt(hovered.entry.created_at)}</p>
                <p className="text-white/65 mt-1 line-clamp-2 leading-relaxed">{hovered.entry.text}</p>
              </div>
            )}

            {/* Selected entry panel */}
            {selected && (
              <div className="absolute right-4 top-4 w-72 bg-slate-900/96 backdrop-blur-md border border-white/10 rounded-3xl p-5 space-y-4 z-20 shadow-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-white/35 uppercase tracking-widest">Entrée sélectionnée</p>
                    <p className="font-semibold capitalize mt-1 text-base" style={{ color: selected.color }}>
                      {selected.entry.analysis.dominantEmotion}
                    </p>
                    <p className="text-white/30 text-[10px] italic mt-0.5 leading-relaxed">
                      {EMOTION_COLOR_MEANING[selected.entry.analysis.dominantEmotion]}
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)}
                    className="text-white/30 hover:text-white/70 transition-colors p-1 -mt-1 -mr-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <img src={selected.entry.visualization_url} alt=""
                  className="w-full h-28 object-cover rounded-2xl" />

                <div className="flex gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {fmt(selected.entry.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    {selected.entry.analysis.intensity}/10
                  </span>
                </div>

                <p className="text-sm text-white/65 leading-relaxed line-clamp-5">
                  {selected.entry.text}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {selected.entry.analysis.keywords.slice(0, 4).map(kw => (
                    <span key={kw}
                      className="px-2 py-0.5 rounded-full text-[10px]"
                      style={{ backgroundColor: `${selected.color}20`, color: selected.color }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Star count */}
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/20 text-xs tracking-[0.25em] uppercase select-none">
              {entries.length} étoile{entries.length > 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
