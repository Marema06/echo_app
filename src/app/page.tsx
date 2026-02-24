'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EchoLogo } from '@/components/ui/echo-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { generateVisualization } from '@/lib/visualization';
import { type EmotionName, type VisualizationStyle } from '@/types';

const DEMO_TILES: { emotion: EmotionName; intensity: number; style: VisualizationStyle; label: string }[] = [
  { emotion: 'sérénité', intensity: 7, style: 'aquarelle', label: 'Sérénité' },
  { emotion: 'joie', intensity: 8, style: 'organique', label: 'Joie' },
  { emotion: 'nostalgie', intensity: 5, style: 'minimaliste', label: 'Nostalgie' },
  { emotion: 'espoir', intensity: 6, style: 'geometrique', label: 'Espoir' },
  { emotion: 'surprise', intensity: 9, style: 'abstrait', label: 'Surprise' },
  { emotion: 'sérénité', intensity: 4, style: 'mosaique', label: 'Calme' },
];

export default function HomePage() {
  const [tiles, setTiles] = useState<string[]>([]);

  useEffect(() => {
    const generated = DEMO_TILES.map((t) =>
      generateVisualization({ emotion: t.emotion, intensity: t.intensity, style: t.style })
    );
    setTiles(generated);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      {/* Decorative blur */}
      <div className="absolute top-[-220px] left-[-120px] w-[520px] h-[520px] rounded-full opacity-50 pointer-events-none"
           style={{ background: 'radial-gradient(circle at 30% 30%, rgba(196, 181, 253, 0.6), transparent 70%)' }} />

      {/* Topbar */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-surface-glass border-b border-ink-900/[0.08]">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <EchoLogo size={34} />
            <span className="font-serif text-[28px] font-semibold">ECHO.</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#pricing" className="text-sm text-ink-600 hover:text-ink-900 dark:hover:text-ink-200 transition-colors hidden sm:inline">
              Abonnement
            </a>
            <ThemeToggle />
            <Link href="/login" className="border border-ink-900/[0.12] dark:border-ink-600/30 bg-white/80 dark:bg-ink-800/80 text-ink-700 dark:text-ink-300 rounded-full px-4 py-2 text-sm hover:bg-ink-900 hover:text-white transition-all">
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 pt-16 pb-12 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-6">
          <h1 className="font-serif font-semibold text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
            Vos émotions, sculptées en oeuvres visuelles.
          </h1>

          <p className="text-ink-600 text-lg leading-relaxed max-w-[520px]">
            Un journal émotionnel qui transforme les nuances en une mosaïque
            réellement belle. Simple à utiliser, profond à comprendre.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-ink-900 text-white rounded-full py-3.5 px-7 text-base font-medium
                       hover:-translate-y-0.5 transition-all shadow-pop"
          >
            Commencer gratuitement
          </Link>
        </div>

        {/* Live mosaic preview */}
        <div className="grid grid-cols-3 gap-3">
          {tiles.map((src, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft
                         hover:-translate-y-1 hover:shadow-pop transition-all duration-300"
            >
              <img
                src={src}
                alt={DEMO_TILES[idx].label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300
                              flex items-end p-3">
                <span className="text-white text-xs font-medium">{DEMO_TILES[idx].label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-[1100px] mx-auto px-6 py-14 space-y-7 relative z-10">
        <div className="space-y-4">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-ink-900/[0.08] text-ink-600 text-xs uppercase tracking-[0.2em]">
            Abonnement
          </span>
          <h2 className="font-serif text-3xl">Une expérience premium, à votre rythme.</h2>
          <p className="text-ink-500">Choisissez l&apos;offre qui correspond à votre ambition.</p>
          <div className="flex flex-wrap gap-2.5">
            {['Sans engagement', 'Annulation en 1 clic', 'Données privées'].map((b) => (
              <span key={b} className="inline-flex items-center px-3.5 py-2 rounded-full bg-ink-900/[0.08] text-ink-600 text-xs uppercase tracking-wider">
                {b}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Free */}
          <div className="bg-surface-glass backdrop-blur-md rounded-[22px] p-5 shadow-soft border border-ink-900/[0.08] flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">Essentiel</p>
              <p className="font-serif text-3xl">Gratuit</p>
              <p className="text-xs text-ink-500 mt-1">Pour découvrir l&apos;expérience ECHO.</p>
            </div>
            <ul className="text-sm space-y-2 pl-4 list-disc text-ink-600">
              <li>50 entrées / mois</li>
              <li>Mosaïque évolutive</li>
              <li>Analyse émotionnelle IA</li>
            </ul>
            <Link href="/signup" className="mt-auto w-full text-center py-2.5 rounded-full border border-ink-900/10 text-ink-700 hover:bg-ink-50 transition-colors text-sm">
              Continuer gratuitement
            </Link>
          </div>

          {/* Premium */}
          <div className="bg-gradient-to-br from-ink-900/[0.96] to-ink-800/[0.96] text-white rounded-[22px] p-5 shadow-pop border border-ink-400/20 flex flex-col gap-4 relative">
            <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-[11px] uppercase tracking-wider bg-white/[0.14] text-white/85">
              Choix premium
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/70 mb-1">Premium</p>
              <p className="font-serif text-3xl">8 &euro; / mois</p>
              <p className="text-xs text-white/60 mt-1">Pour un suivi émotionnel approfondi.</p>
            </div>
            <ul className="text-sm space-y-2 pl-4 list-disc text-white/80">
              <li>Entrées illimitées</li>
              <li>Dictée vocale &amp; transcription</li>
              <li>6 styles visuels avancés</li>
              <li>Insights hebdomadaires</li>
            </ul>
            <Link href="/signup" className="mt-auto w-full text-center py-2.5 rounded-full bg-white text-ink-900 font-medium text-sm hover:-translate-y-0.5 transition-all shadow-pop">
              Passer en premium
            </Link>
          </div>

          {/* Studio */}
          <div className="bg-surface-glass backdrop-blur-md rounded-[22px] p-5 shadow-soft border border-ink-900/[0.08] flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">Studio</p>
              <p className="font-serif text-3xl">24 &euro; / mois</p>
              <p className="text-xs text-ink-500 mt-1">Pour créer une oeuvre exportable.</p>
            </div>
            <ul className="text-sm space-y-2 pl-4 list-disc text-ink-600">
              <li>Export poster ou livre</li>
              <li>Archivage haute définition</li>
              <li>Assistance prioritaire</li>
            </ul>
            <Link href="/signup" className="mt-auto w-full text-center py-2.5 rounded-full border border-ink-900/10 text-ink-700 hover:bg-ink-50 transition-colors text-sm">
              Préparer mon livre
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-[1100px] mx-auto px-6 pt-8 pb-6 border-t border-ink-900/[0.08] relative z-10">
        <p className="text-center text-xs text-ink-400">
          <span className="font-serif text-sm text-ink-500">ECHO.</span>
          {' '}&middot;{' '}Journal émotionnel artistique
        </p>
      </footer>
    </div>
  );
}
