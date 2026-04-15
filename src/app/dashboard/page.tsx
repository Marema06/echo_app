'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PenLine, Sparkles, Grid3X3, Plus, Search, X } from 'lucide-react';
import { EntryModal } from '@/components/mosaic/entry-modal';
import { MosaicSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { type Entry, EMOTION_COLORS, type EmotionName } from '@/types';
import { createClient } from '@/lib/supabase/client';

const EMOTION_FILTERS: { label: string; value: EmotionName }[] = [
  { label: 'Joie', value: 'joie' },
  { label: 'Tristesse', value: 'tristesse' },
  { label: 'Sérénité', value: 'sérénité' },
  { label: 'Anxiété', value: 'anxiété' },
  { label: 'Espoir', value: 'espoir' },
  { label: 'Colère', value: 'colère' },
  { label: 'Nostalgie', value: 'nostalgie' },
  { label: 'Peur', value: 'peur' },
  { label: 'Surprise', value: 'surprise' },
  { label: 'Frustration', value: 'frustration' },
];

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string>('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeEmotion, setActiveEmotion] = useState<EmotionName | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const observerRef = useRef<HTMLDivElement | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useToast();

  const buildUrl = useCallback((pageNum: number, emotion: EmotionName | null, q: string) => {
    const params = new URLSearchParams({ page: String(pageNum), limit: '20' });
    if (emotion) params.set('emotion', emotion);
    if (q.trim()) params.set('search', q.trim());
    return `/api/entries?${params}`;
  }, []);

  const fetchEntries = useCallback(async (pageNum: number, emotion: EmotionName | null, q: string, append = false) => {
    try {
      const res = await fetch(buildUrl(pageNum, emotion, q));
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(prev => append ? [...prev, ...data.entries] : data.entries);
      setHasMore(data.hasMore);
    } catch {
      toast('Erreur lors du chargement des entrées', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildUrl, toast]);

  useEffect(() => {
    fetchEntries(1, null, '');
    // Récupère le prénom de l'utilisateur
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const name = fullName ? fullName.split(' ')[0] : user.email?.split('@')[0] || '';
      setFirstName(name);
    });
  }, [fetchEntries]);

  const applyFilter = useCallback((emotion: EmotionName | null, q: string) => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    fetchEntries(1, emotion, q);
  }, [fetchEntries]);

  const handleEmotionFilter = (emotion: EmotionName) => {
    const next = activeEmotion === emotion ? null : emotion;
    setActiveEmotion(next);
    applyFilter(next, search);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(value);
      applyFilter(activeEmotion, value);
    }, 400);
  };

  const clearFilters = () => {
    setActiveEmotion(null);
    setSearch('');
    setSearchInput('');
    applyFilter(null, '');
  };

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (obs) => {
        if (obs[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchEntries(nextPage, activeEmotion, search, true);
        }
      },
      { threshold: 0.1 }
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loadingMore, page, fetchEntries, activeEmotion, search]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== id));
        setSelectedEntry(null);
        toast('Entrée supprimée', 'success');
      } else {
        toast('Erreur lors de la suppression', 'error');
      }
    } catch {
      toast('Erreur lors de la suppression', 'error');
    }
  };

  const selectedIndex = selectedEntry ? entries.findIndex(e => e.id === selectedEntry.id) : -1;
  const hasActiveFilter = activeEmotion !== null || search.trim() !== '';

  return (
    <section className="space-y-5">
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

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher dans mes entrées..."
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-full border border-ink-200 dark:border-ink-700
                       bg-white/80 dark:bg-ink-800/80 text-sm text-ink-700 dark:text-ink-300
                       focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-900/5 transition-all"
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {EMOTION_FILTERS.map(f => {
            const color = EMOTION_COLORS[f.value]?.[0] || '#94a3b8';
            const isActive = activeEmotion === f.value;
            return (
              <button
                key={f.value}
                onClick={() => handleEmotionFilter(f.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isActive
                    ? 'text-white border-transparent shadow-sm'
                    : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 bg-white/80 dark:bg-ink-800/60 hover:border-ink-300'
                }`}
                style={isActive ? { backgroundColor: color } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.6)' : color }}
                />
                {f.label}
              </button>
            );
          })}
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-ink-500 border border-dashed border-ink-300 hover:border-ink-500 transition-colors"
            >
              <X className="w-3 h-3" />
              Tout effacer
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <MosaicSkeleton />
      ) : entries.length === 0 && !hasActiveFilter ? (
        <div className="bg-surface-glass rounded-4xl p-10 shadow-soft space-y-8">
          <div className="text-center">
            <h3 className="font-serif text-2xl">
              {firstName ? `Bonjour, ${firstName}.` : 'Bienvenue dans votre espace'}
            </h3>
            <p className="text-ink-500 text-sm mt-2">Trois étapes pour créer votre première tuile émotionnelle.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: PenLine, title: 'Écrivez', desc: 'Décrivez ce que vous ressentez, librement.' },
              { icon: Sparkles, title: "L'IA analyse", desc: 'Elle détecte les émotions et leur intensité.' },
              { icon: Grid3X3, title: 'Votre tuile', desc: 'Une visualisation unique rejoint votre mosaïque.' },
            ].map(s => (
              <div key={s.title} className="text-center space-y-3 p-4">
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
      ) : entries.length === 0 ? (
        <div className="bg-surface-glass rounded-4xl p-10 text-center shadow-soft">
          <p className="text-ink-500">Aucune entrée ne correspond à votre recherche.</p>
          <button onClick={clearFilters} className="mt-3 text-sm underline text-ink-600 hover:text-ink-900">
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          {hasActiveFilter && (
            <p className="text-xs text-ink-500">
              {entries.length} résultat{entries.length > 1 ? 's' : ''}
              {activeEmotion ? ` · ${activeEmotion}` : ''}
              {search ? ` · "${search}"` : ''}
            </p>
          )}

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
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <img
                    src={entry.visualization_url}
                    alt={entry.analysis.dominantEmotion}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                  flex items-end p-4">
                    <div className="text-white text-left">
                      <p className="text-sm font-medium capitalize">{entry.analysis.dominantEmotion}</p>
                      <p className="text-xs opacity-80">
                        {new Date(entry.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="absolute top-3 right-3 w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                </button>
              );
            })}
          </div>

          {hasMore && !hasActiveFilter && (
            <div ref={observerRef} className="flex justify-center py-8">
              {loadingMore && (
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-ink-300 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onPrev={() => selectedIndex > 0 && setSelectedEntry(entries[selectedIndex - 1])}
          onNext={() => selectedIndex < entries.length - 1 && setSelectedEntry(entries[selectedIndex + 1])}
          onDelete={handleDelete}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < entries.length - 1}
        />
      )}
    </section>
  );
}
