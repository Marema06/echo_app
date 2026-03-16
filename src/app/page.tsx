'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EchoLogo } from '@/components/ui/echo-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { generateVisualization } from '@/lib/visualization';
import { type EmotionName, type VisualizationStyle } from '@/types';
import {
  Mic, Sparkles, Grid3X3, Brain,
  ArrowRight, CheckCircle2,
} from 'lucide-react';
import { GoogleButton } from '@/components/ui/google-button';

const DEMO_TILES: { emotion: EmotionName; intensity: number; style: VisualizationStyle; label: string }[] = [
  { emotion: 'sérénité', intensity: 7, style: 'aquarelle', label: 'Sérénité' },
  { emotion: 'joie', intensity: 8, style: 'organique', label: 'Joie' },
  { emotion: 'nostalgie', intensity: 5, style: 'minimaliste', label: 'Nostalgie' },
  { emotion: 'espoir', intensity: 6, style: 'geometrique', label: 'Espoir' },
  { emotion: 'surprise', intensity: 9, style: 'abstrait', label: 'Surprise' },
  { emotion: 'sérénité', intensity: 4, style: 'mosaique', label: 'Calme' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Mic,
    title: 'Exprimez-vous',
    desc: 'Écrivez ou dictez librement votre ressenti du jour. Texte libre, sans contrainte.',
  },
  {
    step: '02',
    icon: Brain,
    title: "L'IA analyse",
    desc: "Détection de 10 émotions, mesure d'intensité et analyse de votre état émotionnel global.",
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'Une tuile naît',
    desc: 'Une visualisation algorithmique unique traduit visuellement votre émotion et son intensité.',
  },
  {
    step: '04',
    icon: Grid3X3,
    title: 'La mosaïque grandit',
    desc: "Chaque entrée enrichit votre mosaïque personnelle — un portrait vivant de vous-même.",
  },
];


export default function HomePage() {
  const [tiles, setTiles] = useState<string[]>([]);

  useEffect(() => {
    const generated = DEMO_TILES.map(t =>
      generateVisualization({ emotion: t.emotion, intensity: t.intensity, style: t.style })
    );
    setTiles(generated);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      {/* Decorative blurs */}
      <div className="absolute top-[-220px] left-[-120px] w-[520px] h-[520px] rounded-full opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 30% 30%, rgba(196, 181, 253, 0.7), transparent 70%)' }} />
      <div className="absolute top-[40%] right-[-100px] w-[400px] h-[400px] rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(147, 197, 253, 0.5), transparent 70%)' }} />

      {/* Topbar */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md bg-surface-glass border-b border-ink-900/[0.08]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <EchoLogo size={34} />
            <span className="font-serif text-[28px] font-semibold">ECHO.</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#how-it-works" className="text-sm text-ink-600 hover:text-ink-900 dark:hover:text-ink-200 transition-colors hidden sm:inline">
              Comment ça marche
            </a>
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

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-7">
          <h1 className="font-serif font-semibold text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
            Vos émotions,<br />
            <span className="text-ink-400">sculptées en</span><br />
            œuvres visuelles.
          </h1>

          <p className="text-ink-600 dark:text-ink-400 text-lg leading-relaxed max-w-[480px]">
            Un journal émotionnel qui transforme chaque ressenti en une visualisation unique.
            Analysé par l&apos;IA, archivé en mosaïque, rétrospectivé chaque mois et chaque année.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <GoogleButton next="/dashboard" />
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-ink-900 text-white rounded-full py-3.5 px-7 text-base font-medium
                           hover:-translate-y-0.5 transition-all shadow-pop"
              >
                Créer un compte
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 border border-ink-900/[0.12] dark:border-ink-600/30 rounded-full py-3.5 px-7 text-base
                           text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-all"
              >
                Comment ça marche
              </a>
            </div>
          </div>

        </div>

        {/* Live mosaic preview */}
        <div className="grid grid-cols-3 gap-3">
          {tiles.map((src, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft
                         hover:-translate-y-1 hover:shadow-pop transition-all duration-300"
            >
              <img src={src} alt={DEMO_TILES[idx].label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300
                              flex items-end p-3">
                <span className="text-white text-xs font-medium">{DEMO_TILES[idx].label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how-it-works" className="max-w-[1100px] mx-auto px-6 py-20 relative z-10">
        <div className="text-center space-y-3 mb-14">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-ink-900/[0.07] text-ink-600 text-xs uppercase tracking-[0.2em]">
            Comment ça marche
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl">Quatre étapes, une mosaïque.</h2>
          <p className="text-ink-500 max-w-md mx-auto">De l&apos;expression brute à l&apos;œuvre visuelle, en quelques secondes.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HOW_IT_WORKS.map((item, idx) => (
            <div key={idx} className="relative bg-surface-glass backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-ink-900/[0.06] space-y-4 group hover:-translate-y-1 hover:shadow-pop transition-all duration-300">
              {idx < HOW_IT_WORKS.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-2.5 w-5 h-px bg-ink-200 dark:bg-ink-700 z-10" />
              )}
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-2xl bg-ink-900/[0.07] dark:bg-ink-50/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-ink-700 dark:text-ink-300" />
                </div>
                <span className="font-serif text-3xl text-ink-300 dark:text-ink-600 font-bold leading-none">{item.step}</span>
              </div>
              <div>
                <h3 className="font-semibold text-ink-900 dark:text-ink-100 mb-1.5">{item.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className="max-w-[1100px] mx-auto px-6 py-20 space-y-7 relative z-10">
        <div className="space-y-4">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-ink-900/[0.08] text-ink-600 text-xs uppercase tracking-[0.2em]">
            Abonnement
          </span>
          <h2 className="font-serif text-3xl">Une expérience premium, à votre rythme.</h2>
          <p className="text-ink-500">Choisissez l&apos;offre qui correspond à votre ambition.</p>
          <div className="flex flex-wrap gap-2.5">
            {['Sans engagement', 'Annulation en 1 clic', 'Données privées'].map(b => (
              <span key={b} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-ink-900/[0.07] text-ink-600 text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
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
            <ul className="text-sm space-y-2 text-ink-600">
              {['50 entrées / mois', 'Mosaïque évolutive', 'Analyse émotionnelle IA', 'Calendrier émotionnel'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-auto w-full text-center py-2.5 rounded-full border border-ink-900/10 text-ink-700 hover:bg-ink-50 transition-colors text-sm">
              Commencer gratuitement
            </Link>
          </div>

          {/* Premium */}
          <div className="bg-gradient-to-br from-ink-900/[0.96] to-ink-800/[0.96] text-white rounded-[22px] p-5 shadow-pop border border-ink-400/20 flex flex-col gap-4 relative">
            <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-[11px] uppercase tracking-wider bg-white/[0.14] text-white/85">
              Populaire
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/70 mb-1">Premium</p>
              <p className="font-serif text-3xl">8 € / mois</p>
              <p className="text-xs text-white/60 mt-1">Pour un suivi émotionnel approfondi.</p>
            </div>
            <ul className="text-sm space-y-2 text-white/80">
              {['Entrées illimitées', 'Dictée vocale & transcription', '6 styles visuels avancés', 'Rétrospective mensuelle IA', 'Export HD de vos tuiles'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/upgrade?plan=premium" className="mt-auto w-full text-center py-2.5 rounded-full bg-white text-ink-900 font-medium text-sm hover:-translate-y-0.5 transition-all shadow-pop">
              Passer en premium
            </Link>
          </div>

          {/* Studio */}
          <div className="bg-surface-glass backdrop-blur-md rounded-[22px] p-5 shadow-soft border border-ink-900/[0.08] flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">Studio</p>
              <p className="font-serif text-3xl">24 € / mois</p>
              <p className="text-xs text-ink-500 mt-1">Pour créer une œuvre exportable.</p>
            </div>
            <ul className="text-sm space-y-2 text-ink-600">
              {['Tout Premium inclus', 'Export poster & livre', 'Rétrospective annuelle IA', 'Archivage haute définition', 'Assistance prioritaire'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/upgrade?plan=studio" className="mt-auto w-full text-center py-2.5 rounded-full border border-ink-900/10 text-ink-700 hover:bg-ink-50 transition-colors text-sm">
              Préparer mon livre
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────── */}
      <footer className="max-w-[1100px] mx-auto px-6 pt-8 pb-10 border-t border-ink-900/[0.08] relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <EchoLogo size={24} />
            <span className="font-serif text-lg text-ink-500">ECHO.</span>
            <span className="text-xs text-ink-400">Journal émotionnel artistique</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-ink-400">
            <a href="#how-it-works" className="hover:text-ink-700 transition-colors">Comment ça marche</a>
            <a href="#pricing" className="hover:text-ink-700 transition-colors">Abonnement</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
