'use client';

import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { Spinner } from '@/components/ui/spinner';
import { BarChart3, Wand2 } from 'lucide-react';
import { type Entry, type EmotionName, EMOTION_COLORS } from '@/types';

interface Stats {
  totalEntries: number;
  avgIntensity: string;
  mostFrequent: [string, number] | null;
  emotionCounts: Record<string, number>;
  monthlyData: Record<string, number>;
}

function computeStats(entries: Entry[]): Stats | null {
  if (entries.length === 0) return null;

  const emotionCounts: Record<string, number> = {};
  const monthlyData: Record<string, number> = {};
  let totalIntensity = 0;

  entries.forEach((entry) => {
    const emotion = entry.analysis.dominantEmotion;
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    totalIntensity += entry.analysis.intensity;

    const month = new Date(entry.created_at).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });

  const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);

  return {
    totalEntries: entries.length,
    avgIntensity: (totalIntensity / entries.length).toFixed(1),
    mostFrequent: sorted[0] || null,
    emotionCounts,
    monthlyData,
  };
}

export default function StatsPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Load all entries for stats (increased limit)
        const res = await fetch('/api/entries?page=1&limit=500');
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries);
        }
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = computeStats(entries);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <Topbar />
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" className="border-ink-300 border-t-ink-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Topbar />
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <h2 className="font-serif text-3xl mb-8">Vos statistiques</h2>

        {!stats ? (
          <div className="bg-surface-glass rounded-4xl p-12 text-center shadow-soft">
            <BarChart3 className="w-12 h-12 mx-auto text-ink-400 mb-4" />
            <p className="text-ink-500">Créez des entrées pour voir vos statistiques.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total entries */}
            <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Total d&apos;entrées</p>
              <p className="font-serif text-4xl">{stats.totalEntries}</p>
            </div>

            {/* Average intensity */}
            <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Intensité moyenne</p>
              <p className="font-serif text-4xl">{stats.avgIntensity}<span className="text-lg text-ink-400">/10</span></p>
            </div>

            {/* Dominant emotion */}
            {stats.mostFrequent && (
              <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
                <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Émotion dominante</p>
                <p className="font-serif text-2xl capitalize" style={{
                  color: EMOTION_COLORS[stats.mostFrequent[0] as EmotionName]?.[0] || '#94a3b8'
                }}>
                  {stats.mostFrequent[0]}
                </p>
                <p className="text-xs text-ink-500 mt-1">{stats.mostFrequent[1]} fois</p>
              </div>
            )}

            {/* Emotion distribution */}
            <div className="bg-surface-glass rounded-3xl p-5 shadow-soft sm:col-span-2 lg:col-span-2">
              <h3 className="text-xs uppercase tracking-wider text-ink-400 mb-4">Répartition des émotions</h3>
              <div className="space-y-3">
                {Object.entries(stats.emotionCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emotion, count]) => (
                    <div key={emotion} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize text-ink-600">{emotion}</span>
                        <span className="text-ink-400 tabular-nums">{count}</span>
                      </div>
                      <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${(count / stats.totalEntries) * 100}%`,
                            backgroundColor: EMOTION_COLORS[emotion as EmotionName]?.[0] || '#94a3b8',
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Monthly activity */}
            <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
              <h3 className="text-xs uppercase tracking-wider text-ink-400 mb-4">Activité mensuelle</h3>
              <div className="space-y-2">
                {Object.entries(stats.monthlyData)
                  .slice(-6)
                  .map(([month, count]) => (
                    <div key={month} className="flex items-center justify-between text-sm">
                      <span className="text-ink-600">{month}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-accent-brand/30 rounded-full" style={{ width: `${count * 12}px` }} />
                        <span className="text-ink-400 tabular-nums w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Export CTA */}
            <div className="col-span-full bg-gradient-to-br from-ink-900 to-ink-800 rounded-3xl p-6 text-white shadow-pop">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/60 mb-1">Version premium</p>
                  <h3 className="font-serif text-xl">Exporter votre mosaïque</h3>
                  <p className="text-sm text-white/70 mt-1">
                    Générer un poster ou un livre personnel à partir de vos tuiles.
                  </p>
                </div>
                <button className="inline-flex items-center gap-2 bg-white text-ink-900 rounded-full py-2.5 px-5 text-sm font-medium
                                   hover:-translate-y-0.5 transition-all shadow-pop shrink-0">
                  <Wand2 className="w-4 h-4" />
                  Préparer mon export
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
