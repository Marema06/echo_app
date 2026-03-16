'use client';

import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { Skeleton } from '@/components/ui/skeleton';
import { EMOTION_COLORS, type EmotionName } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayData {
  emotion: string;
  intensity: number;
  count: number;
}

interface StatsData {
  calendarData: Record<string, DayData>;
  streak: number;
  totalEntries: number;
  empty?: boolean;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function getMonthGrid(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday-first: convert Sunday(0) → 6, Monday(1) → 0, etc.
  const startDow = (firstDay.getDay() + 6) % 7;
  const grid: (string | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const m = String(month + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    grid.push(`${year}-${m}-${day}`);
  }
  return grid;
}

function EmotionDot({ dayKey, data }: { dayKey: string; data: DayData | undefined }) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = dayKey === today;
  const isFuture = dayKey > today;

  if (isFuture) {
    return (
      <div className="w-full aspect-square rounded-lg bg-ink-50 dark:bg-ink-900/30 opacity-30" />
    );
  }

  if (!data) {
    return (
      <div className={`w-full aspect-square rounded-lg bg-ink-100 dark:bg-ink-800/60 ${isToday ? 'ring-2 ring-ink-400 dark:ring-ink-500' : ''}`} />
    );
  }

  const color = EMOTION_COLORS[data.emotion as EmotionName]?.[0] || '#94a3b8';
  const opacity = 0.4 + (data.intensity / 10) * 0.6;

  return (
    <div
      className={`w-full aspect-square rounded-lg transition-transform hover:scale-110 cursor-default ${isToday ? 'ring-2 ring-white/60' : ''}`}
      style={{ backgroundColor: color, opacity }}
      title={`${data.emotion} · intensité ${data.intensity}/10 · ${data.count} entrée${data.count > 1 ? 's' : ''}`}
    />
  );
}

function MonthGrid({ year, month, calendarData }: { year: number; month: number; calendarData: Record<string, DayData> }) {
  const grid = getMonthGrid(year, month);

  return (
    <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
      <h3 className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-4">
        {MONTH_NAMES[month]} {year}
      </h3>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-ink-400 font-medium pb-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((dateStr, i) =>
          dateStr === null ? (
            <div key={i} />
          ) : (
            <EmotionDot key={dateStr} dayKey={dateStr} data={calendarData[dateStr]} />
          )
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleMonths, setVisibleMonths] = useState(6);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  // Build last N months from today
  const now = new Date();
  const months: { year: number; month: number }[] = [];
  for (let i = visibleMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  const calendarData = stats?.calendarData || {};

  // Legend
  const emotions: EmotionName[] = ['joie', 'tristesse', 'sérénité', 'anxiété', 'espoir', 'colère', 'nostalgie', 'peur', 'surprise', 'frustration'];

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-12">
      <Topbar />
      <main className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl">Calendrier émotionnel</h2>
            <p className="text-ink-500 text-sm mt-1">Visualisez vos émotions jour par jour.</p>
          </div>

          {/* Streak */}
          {stats && !stats.empty && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20
                            border border-amber-200/60 dark:border-amber-700/40 rounded-2xl px-5 py-3 flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">Série en cours</p>
                <p className="font-serif text-2xl text-amber-800 dark:text-amber-300">
                  {stats.streak} jour{stats.streak > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : stats?.empty ? (
          <div className="bg-surface-glass rounded-4xl p-12 text-center shadow-soft">
            <p className="text-4xl mb-4">📅</p>
            <p className="font-serif text-xl mb-2">Votre calendrier est vide</p>
            <p className="text-ink-500 text-sm">Créez votre première entrée pour commencer à construire votre calendrier émotionnel.</p>
          </div>
        ) : (
          <>
            {/* Month range selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVisibleMonths(v => Math.max(3, v - 3))}
                disabled={visibleMonths <= 3}
                className="p-2 rounded-full border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-ink-600" />
              </button>
              <span className="text-sm text-ink-500 min-w-[120px] text-center">
                {visibleMonths} derniers mois
              </span>
              <button
                onClick={() => setVisibleMonths(v => Math.min(12, v + 3))}
                disabled={visibleMonths >= 12}
                className="p-2 rounded-full border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-ink-600" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {months.map(({ year, month }) => (
                <MonthGrid
                  key={`${year}-${month}`}
                  year={year}
                  month={month}
                  calendarData={calendarData}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
              <h3 className="text-xs uppercase tracking-wider text-ink-400 mb-4">Légende des émotions</h3>
              <div className="flex flex-wrap gap-3">
                {emotions.map(emotion => (
                  <div key={emotion} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: EMOTION_COLORS[emotion]?.[0] || '#94a3b8' }}
                    />
                    <span className="text-xs text-ink-600 dark:text-ink-400 capitalize">{emotion}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-ink-100 dark:bg-ink-800" />
                  <span className="text-xs text-ink-600 dark:text-ink-400">Pas d&apos;entrée</span>
                </div>
              </div>
              <p className="text-xs text-ink-400 mt-3">L&apos;opacité reflète l&apos;intensité de l&apos;émotion.</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
