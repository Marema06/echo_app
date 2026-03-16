'use client';

import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { EMOTION_COLORS, type EmotionName } from '@/types';
import { Clock, Trash2, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Letter {
  id: string;
  dominant_emotion: string;
  send_at: string;
  sent: boolean;
  created_at: string;
  visualization_url: string;
}

function timeUntil(dateStr: string): string {
  const diffDays = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  if (diffDays <= 0) return "Envoyée";
  if (diffDays === 1) return "Demain";
  if (diffDays < 30) return `Dans ${diffDays} jours`;
  if (diffDays < 365) return `Dans ${Math.round(diffDays / 30)} mois`;
  return `Dans ${Math.round(diffDays / 365)} an${Math.round(diffDays / 365) > 1 ? 's' : ''}`;
}

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetch('/api/letters')
      .then(r => r.json())
      .then(d => setLetters(d.letters || []))
      .catch(() => toast('Erreur lors du chargement', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleDelete = async (id: string) => {
    const { error } = await fetch('/api/letters', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).then(r => r.json());

    if (error) { toast('Erreur lors de la suppression', 'error'); return; }
    setLetters(prev => prev.filter(l => l.id !== id));
    toast('Lettre supprimée', 'success');
  };

  const pending = letters.filter(l => !l.sent);
  const sent = letters.filter(l => l.sent);

  return (
    <div className="min-h-screen bg-background pb-12">
      <Topbar />
      <main className="max-w-[640px] mx-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="font-serif text-3xl">Lettres au futur</h2>
          <p className="text-ink-500 text-sm mt-1">
            Des messages que votre passé a écrits pour vous.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Clock className="w-10 h-10 text-ink-300 mx-auto" />
            <p className="text-ink-500 text-sm">Aucune lettre programmée.</p>
            <Link href="/create"
              className="inline-block mt-2 px-5 py-2.5 bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900 rounded-full text-sm font-medium">
              Créer une entrée
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-ink-400">En attente d&apos;envoi</p>
                {pending.map(letter => {
                  const color = EMOTION_COLORS[letter.dominant_emotion as EmotionName]?.[0] ?? '#94a3b8';
                  return (
                    <div key={letter.id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-surface-glass border border-ink-100/80 dark:border-ink-700/40 shadow-soft">
                      <img src={letter.visualization_url} alt=""
                        className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize" style={{ color }}>
                          {letter.dominant_emotion}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-ink-400 shrink-0" />
                          <p className="text-xs text-ink-400">{timeUntil(letter.send_at)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(letter.id)}
                        className="p-2 rounded-xl text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {sent.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-ink-400">Envoyées</p>
                {sent.map(letter => {
                  const color = EMOTION_COLORS[letter.dominant_emotion as EmotionName]?.[0] ?? '#94a3b8';
                  return (
                    <div key={letter.id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-ink-50/50 dark:bg-ink-800/20 border border-ink-100/60 dark:border-ink-700/30 opacity-70">
                      <img src={letter.visualization_url} alt=""
                        className="w-12 h-12 rounded-xl object-cover shrink-0 grayscale" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize" style={{ color }}>
                          {letter.dominant_emotion}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                          <p className="text-xs text-ink-400">Envoyée</p>
                        </div>
                      </div>
                      <Mail className="w-4 h-4 text-ink-300" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
