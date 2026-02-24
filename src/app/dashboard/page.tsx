'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PenLine, Sparkles, Grid3X3, Plus } from 'lucide-react';
import { EntryModal } from '@/components/mosaic/entry-modal';
import { Spinner } from '@/components/ui/spinner';
import { type Entry, EMOTION_COLORS, type EmotionName } from '@/types';

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const fetchEntries = useCallback(async (pageNum: number, append = false) => {
    try {
      const res = await fetch(`/api/entries?page=${pageNum}&limit=20`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();

      setEntries((prev) => append ? [...prev, ...data.entries] : data.entries);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching entries:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries(1);
  }, [fetchEntries]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchEntries(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loadingMore, page, fetchEntries]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        setSelectedEntry(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const selectedIndex = selectedEntry ? entries.findIndex((e) => e.id === selectedEntry.id) : -1;

  const handlePrev = () => {
    if (selectedIndex > 0) setSelectedEntry(entries[selectedIndex - 1]);
  };

  const handleNext = () => {
    if (selectedIndex < entries.length - 1) setSelectedEntry(entries[selectedIndex + 1]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="border-ink-300 border-t-ink-900" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl">Votre mosaïque</h2>
          <p className="text-ink-500 text-sm mt-1">Chaque tuile incarne une émotion capturée.</p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900
                     rounded-full py-2.5 px-5 text-sm font-medium
                     hover:-translate-y-0.5 transition-all shadow-pop self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nouvelle entrée
        </Link>
      </div>

      {/* Empty state - Onboarding */}
      {entries.length === 0 ? (
        <div className="bg-surface-glass rounded-4xl p-10 shadow-soft space-y-8">
          <div className="text-center">
            <h3 className="font-serif text-2xl">Bienvenue dans votre espace</h3>
            <p className="text-ink-500 text-sm mt-2">Trois étapes pour créer votre première tuile émotionnelle.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: PenLine, step: '1', title: 'Écrivez', desc: 'Décrivez ce que vous ressentez, librement.' },
              { icon: Sparkles, step: '2', title: 'L\'IA analyse', desc: 'Elle détecte les émotions et leur intensité.' },
              { icon: Grid3X3, step: '3', title: 'Votre tuile', desc: 'Une visualisation unique rejoint votre mosaïque.' },
            ].map((s) => (
              <div key={s.step} className="text-center space-y-3 p-4">
                <div className="w-11 h-11 rounded-2xl bg-ink-900/[0.06] flex items-center justify-center mx-auto">
                  <s.icon className="w-5 h-5 text-ink-600" />
                </div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-ink-500">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-ink-900 text-white rounded-full py-2.5 px-5 text-sm
                         hover:-translate-y-0.5 transition-all shadow-pop"
            >
              <Plus className="w-4 h-4" />
              Créer ma première tuile
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Mosaic grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {entries.map((entry, idx) => {
              const color = EMOTION_COLORS[entry.analysis.dominantEmotion as EmotionName]?.[0] || '#94a3b8';
              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="group relative aspect-square rounded-3xl overflow-hidden bg-white shadow-soft
                             hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-pop
                             transition-all duration-300 animate-rise border-0 p-0 cursor-pointer"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  <img
                    src={entry.visualization_url}
                    alt={entry.analysis.dominantEmotion}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                  flex items-end p-4">
                    <div className="text-white text-left">
                      <p className="text-sm font-medium capitalize">{entry.analysis.dominantEmotion}</p>
                      <p className="text-xs opacity-80">
                        Intensité {entry.analysis.intensity}/10
                      </p>
                    </div>
                    <div
                      className="absolute top-3 right-3 w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={observerRef} className="flex justify-center py-8">
              {loadingMore && <Spinner size="md" className="border-ink-300 border-t-ink-900" />}
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onPrev={handlePrev}
          onNext={handleNext}
          onDelete={handleDelete}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < entries.length - 1}
        />
      )}
    </section>
  );
}
