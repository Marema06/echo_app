import { EMOTION_COLORS, type EmotionName } from '@/types';
import Link from 'next/link';

interface SharedEntry {
  text: string;
  created_at: string;
  visualization_url: string;
  analysis: {
    dominantEmotion: string;
    intensity: number;
    keywords: string[];
  };
}

async function getSharedEntry(token: string): Promise<SharedEntry | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/share/${token}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.entry ?? null;
  } catch {
    return null;
  }
}

export default async function SharePage({ params }: { params: { token: string } }) {
  const entry = await getSharedEntry(params.token);

  if (!entry) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-slate-500 text-sm">Ce lien est invalide ou a expiré.</p>
          <Link href="/" className="inline-block px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm">
            Retour à ECHO.
          </Link>
        </div>
      </div>
    );
  }

  const color = EMOTION_COLORS[entry.analysis.dominantEmotion as EmotionName]?.[0] ?? '#94a3b8';
  const date = new Date(entry.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] space-y-6">

        {/* Brand */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">ECHO.</p>
          <p className="text-slate-500 text-xs mt-1">Journal émotionnel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <img
            src={entry.visualization_url}
            alt={entry.analysis.dominantEmotion}
            className="w-full h-56 object-cover"
          />
          <div className="p-6 space-y-4">
            <div>
              <p
                className="text-sm font-semibold capitalize"
                style={{ color }}
              >
                {entry.analysis.dominantEmotion}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{date} · Intensité {entry.analysis.intensity}/10</p>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed line-clamp-6">
              {entry.text}
            </p>

            {entry.analysis.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.analysis.keywords.slice(0, 5).map(kw => (
                  <span
                    key={kw}
                    className="px-2.5 py-1 rounded-full text-[11px]"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-400">Partagé depuis ECHO., le journal émotionnel.</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Créer mon journal
          </Link>
        </div>

      </div>
    </div>
  );
}
