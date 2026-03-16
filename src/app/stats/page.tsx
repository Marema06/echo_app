'use client';

import { useState, useEffect, useCallback } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { StatsSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { BarChart3, Download, Sparkles, Loader2, CalendarDays, FileText } from 'lucide-react';
import { type EmotionName, EMOTION_COLORS } from '@/types';
import Link from 'next/link';

interface StatsData {
  totalEntries: number;
  avgIntensity: number;
  mostFrequent: [string, number] | null;
  emotionCounts: Record<string, number>;
  monthlyData: Record<string, number>;
  calendarData: Record<string, { emotion: string; intensity: number; count: number }>;
  streak: number;
  empty?: boolean;
}

interface EntryForExport {
  visualization_url: string;
  analysis: { dominantEmotion: string };
  text: string;
  created_at: string;
}

async function downloadMosaic(entries: EntryForExport[], toast: (msg: string, type?: 'success' | 'error' | 'info') => void) {
  const TILE = 180;
  const GAP = 6;
  const COLS = 4;
  const HEADER = 56;
  const ROWS = Math.ceil(entries.length / COLS);
  const W = COLS * TILE + (COLS + 1) * GAP;
  const H = HEADER + ROWS * TILE + (ROWS + 1) * GAP;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#faf9f7';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 22px serif';
  ctx.textAlign = 'center';
  ctx.fillText('ECHO.', W / 2, 36);

  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
      img.src = src;
    });

  const images = await Promise.all(entries.map(e => loadImg(e.visualization_url)));

  images.forEach((img, idx) => {
    if (!img.complete || img.naturalWidth === 0) return;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = GAP + col * (TILE + GAP);
    const y = HEADER + GAP + row * (TILE + GAP);
    ctx.save();
    ctx.beginPath();
    const r = 12;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + TILE - r, y);
    ctx.quadraticCurveTo(x + TILE, y, x + TILE, y + r);
    ctx.lineTo(x + TILE, y + TILE - r);
    ctx.quadraticCurveTo(x + TILE, y + TILE, x + TILE - r, y + TILE);
    ctx.lineTo(x + r, y + TILE);
    ctx.quadraticCurveTo(x, y + TILE, x, y + TILE - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, TILE, TILE);
    ctx.restore();
  });

  const link = document.createElement('a');
  link.download = `echo-mosaique-${new Date().toISOString().split('T')[0]}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('Mosaïque téléchargée !', 'success');
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyRetro, setMonthlyRetro] = useState('');
  const [yearlyRetro, setYearlyRetro] = useState('');
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [yearlyLoading, setYearlyLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeRetroTab, setActiveRetroTab] = useState<'monthly' | 'yearly'>('monthly');
  const toast = useToast();

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => toast('Erreur chargement des statistiques', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const generateRetro = useCallback(async (period: 'monthly' | 'yearly') => {
    const setLoading = period === 'monthly' ? setMonthlyLoading : setYearlyLoading;
    const setText = period === 'monthly' ? setMonthlyRetro : setYearlyRetro;
    setLoading(true);
    try {
      const res = await fetch('/api/retrospective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setText(data.retrospective);
      toast(`Rétrospective ${period === 'monthly' ? 'mensuelle' : 'annuelle'} générée !`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erreur lors de la génération', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleExport = useCallback(async () => {
    setExportLoading(true);
    try {
      const res = await fetch('/api/entries?page=1&limit=200');
      const data = await res.json();
      if (data.entries?.length > 0) {
        await downloadMosaic(data.entries, toast);
      } else {
        toast('Aucune entrée à exporter', 'info');
      }
    } catch {
      toast("Erreur lors de l'export", 'error');
    } finally {
      setExportLoading(false);
    }
  }, [toast]);

  const handlePdfExport = useCallback(async () => {
    const res = await fetch('/api/entries?page=1&limit=500');
    const data = await res.json();
    const entries: EntryForExport[] = data.entries || [];
    if (!entries.length) { toast('Aucune entrée à exporter', 'info'); return; }

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>ECHO. — Mon journal</title>
<style>
  body{font-family:Georgia,serif;max-width:680px;margin:0 auto;padding:40px 24px;color:#0f172a;background:#faf9f7}
  h1{font-size:32px;font-weight:400;margin:0 0 4px}
  .sub{color:#64748b;font-size:13px;margin:0 0 32px;font-family:sans-serif}
  .entry{border-bottom:1px solid #e2e8f0;padding:24px 0}
  .entry:last-child{border-bottom:none}
  .emotion{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#64748b;margin:0 0 4px;font-family:sans-serif}
  .date{color:#94a3b8;font-size:12px;font-family:sans-serif;margin:0 0 12px}
  .text{font-size:15px;line-height:1.8;color:#334155;margin:0;white-space:pre-wrap}
  button{margin-bottom:32px;padding:10px 24px;background:#0f172a;color:#fff;border:none;border-radius:999px;font-size:13px;cursor:pointer;font-family:sans-serif}
  @media print{button{display:none}}
</style></head><body>
<h1>ECHO.</h1>
<p class="sub">Journal émotionnel — ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
<button onclick="window.print()">Enregistrer en PDF</button>
${entries.map(e => `<div class="entry">
  <p class="emotion">${e.analysis.dominantEmotion}</p>
  <p class="date">${new Date(e.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  <p class="text">${(e.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
</div>`).join('')}
</body></html>`);
    win.document.close();
  }, [toast]);

  const maxCount = stats ? Math.max(...Object.values(stats.emotionCounts)) : 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-12">
      <Topbar />
      <main className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl">Vos statistiques</h2>
            <p className="text-ink-500 text-sm mt-1">Explorez vos tendances émotionnelles.</p>
          </div>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 border border-ink-200 dark:border-ink-700 bg-white/80 dark:bg-ink-800/80
                       text-ink-700 dark:text-ink-300 rounded-full py-2 px-4 text-sm hover:border-ink-400 transition-colors self-start sm:self-auto"
          >
            <CalendarDays className="w-4 h-4" />
            Voir le calendrier
          </Link>
        </div>

        {loading ? (
          <StatsSkeleton />
        ) : !stats || stats.empty ? (
          <div className="bg-surface-glass rounded-4xl p-12 text-center shadow-soft">
            <BarChart3 className="w-12 h-12 mx-auto text-ink-400 mb-4" />
            <p className="text-ink-500">Créez des entrées pour voir vos statistiques.</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* KPI row */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
                <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Total d&apos;entrées</p>
                <p className="font-serif text-4xl">{stats.totalEntries}</p>
              </div>
              <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
                <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Intensité moyenne</p>
                <p className="font-serif text-4xl">
                  {stats.avgIntensity}
                  <span className="text-lg text-ink-400">/10</span>
                </p>
              </div>
              {stats.mostFrequent && (
                <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
                  <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Émotion dominante</p>
                  <p className="font-serif text-2xl capitalize"
                    style={{ color: EMOTION_COLORS[stats.mostFrequent[0] as EmotionName]?.[0] || '#94a3b8' }}>
                    {stats.mostFrequent[0]}
                  </p>
                  <p className="text-xs text-ink-500 mt-1">{stats.mostFrequent[1]} fois</p>
                </div>
              )}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20
                              border border-amber-200/60 dark:border-amber-700/40 rounded-3xl p-5">
                <p className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">Série</p>
                <p className="font-serif text-4xl text-amber-800 dark:text-amber-300">
                  {stats.streak}
                  <span className="text-lg text-amber-600/70 dark:text-amber-500/70"> j.</span>
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-1">jours consécutifs</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
                <h3 className="text-xs uppercase tracking-wider text-ink-400 mb-5">Répartition des émotions</h3>
                <div className="space-y-3">
                  {Object.entries(stats.emotionCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([emotion, count]) => {
                      const pct = Math.round((count / maxCount) * 100);
                      const color = EMOTION_COLORS[emotion as EmotionName]?.[0] || '#94a3b8';
                      return (
                        <div key={emotion} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize text-ink-700 dark:text-ink-300 font-medium">{emotion}</span>
                            <span className="text-ink-400 tabular-nums text-xs">{count} entrée{count > 1 ? 's' : ''}</span>
                          </div>
                          <div className="h-2.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
                <h3 className="text-xs uppercase tracking-wider text-ink-400 mb-5">Activité mensuelle</h3>
                {Object.keys(stats.monthlyData).length === 0 ? (
                  <p className="text-ink-400 text-sm">Pas encore de données mensuelles.</p>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const monthMax = Math.max(...Object.values(stats.monthlyData));
                      return Object.entries(stats.monthlyData).map(([month, count]) => (
                        <div key={month} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-ink-600 dark:text-ink-400 capitalize">{month}</span>
                            <span className="text-ink-400 tabular-nums text-xs">{count}</span>
                          </div>
                          <div className="h-2.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${Math.round((count / monthMax) * 100)}%`, backgroundColor: 'rgba(192,132,252,0.6)' }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Tendances 30 jours */}
            {stats.calendarData && Object.keys(stats.calendarData).length > 0 && (() => {
              const last30 = Array.from({ length: 30 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                return d.toISOString().split('T')[0];
              });
              return (
                <div className="bg-surface-glass rounded-3xl p-5 shadow-soft">
                  <h3 className="text-xs uppercase tracking-wider text-ink-400 mb-5">Tendances — 30 derniers jours</h3>
                  <div className="flex items-end gap-0.5 h-20">
                    {last30.map((date, i) => {
                      const day = stats.calendarData?.[date];
                      if (!day) {
                        return <div key={i} className="flex-1 rounded-t-sm bg-ink-200/40 dark:bg-ink-700/30" style={{ height: '4px' }} />;
                      }
                      const pct = Math.max((day.intensity / 10) * 100, 8);
                      const color = EMOTION_COLORS[day.emotion as EmotionName]?.[0] ?? '#94a3b8';
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm transition-all duration-500"
                          style={{ height: `${pct}%`, backgroundColor: color, minHeight: '6px' }}
                          title={`${date} · ${day.emotion} · ${day.intensity}/10`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-ink-400">
                    <span>il y a 30j</span>
                    <span>aujourd&apos;hui</span>
                  </div>
                </div>
              );
            })()}

            {/* Rétrospective IA — mensuelle + annuelle */}
            <div className="bg-surface-glass rounded-3xl p-6 shadow-soft space-y-5">
              <div>
                <h3 className="font-serif text-xl">Rétrospective IA</h3>
                <p className="text-ink-500 text-sm mt-0.5">Une analyse bienveillante de votre évolution émotionnelle.</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-ink-100 dark:border-ink-800">
                {(['monthly', 'yearly'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveRetroTab(tab)}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeRetroTab === tab
                        ? 'border-ink-900 dark:border-ink-100 text-ink-900 dark:text-ink-100'
                        : 'border-transparent text-ink-400 hover:text-ink-600 dark:hover:text-ink-300'
                    }`}
                  >
                    {tab === 'monthly' ? '30 derniers jours' : `Année ${currentYear}`}
                  </button>
                ))}
              </div>

              {/* Monthly */}
              {activeRetroTab === 'monthly' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-ink-500">
                      {monthlyRetro ? 'Votre bilan des 30 derniers jours.' : 'Générez votre bilan mensuel.'}
                    </p>
                    <button
                      onClick={() => generateRetro('monthly')}
                      disabled={monthlyLoading}
                      className="inline-flex items-center gap-2 bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900
                                 rounded-full py-2 px-4 text-sm font-medium hover:-translate-y-0.5 transition-all
                                 shadow-pop disabled:opacity-60 disabled:hover:translate-y-0 shrink-0"
                    >
                      {monthlyLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération...</>
                        : <><Sparkles className="w-4 h-4" /> {monthlyRetro ? 'Regénérer' : 'Générer'}</>
                      }
                    </button>
                  </div>
                  {monthlyRetro && (
                    <div className="border-t border-ink-900/[0.06] dark:border-ink-700/30 pt-4 space-y-3">
                      {monthlyRetro.split('\n\n').map((para, i) => (
                        <p key={i} className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">{para}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Yearly */}
              {activeRetroTab === 'yearly' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-ink-500">
                      {yearlyRetro ? `Votre bilan de l'année ${currentYear}.` : `Générez votre bilan annuel ${currentYear}.`}
                    </p>
                    <button
                      onClick={() => generateRetro('yearly')}
                      disabled={yearlyLoading}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white
                                 rounded-full py-2 px-4 text-sm font-medium hover:-translate-y-0.5 transition-all
                                 shadow-pop disabled:opacity-60 disabled:hover:translate-y-0 shrink-0"
                    >
                      {yearlyLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération...</>
                        : <><Sparkles className="w-4 h-4" /> {yearlyRetro ? 'Regénérer' : 'Générer'}</>
                      }
                    </button>
                  </div>
                  {yearlyRetro && (
                    <div className="border-t border-ink-900/[0.06] dark:border-ink-700/30 pt-4 space-y-3">
                      {yearlyRetro.split('\n\n').map((para, i) => (
                        <p key={i} className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">{para}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export */}
            <div className="bg-gradient-to-br from-ink-900 to-ink-800 rounded-3xl p-6 text-white shadow-pop">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/60 mb-1">Export</p>
                  <h3 className="font-serif text-xl">Télécharger ma mosaïque</h3>
                  <p className="text-sm text-white/70 mt-1">Générez une image PNG de toutes vos tuiles émotionnelles.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    onClick={handleExport}
                    disabled={exportLoading}
                    className="inline-flex items-center gap-2 bg-white text-ink-900 rounded-full py-2.5 px-5 text-sm font-medium
                               hover:-translate-y-0.5 transition-all shadow-pop disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {exportLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Export...</>
                      : <><Download className="w-4 h-4" /> PNG</>
                    }
                  </button>
                  <button
                    onClick={handlePdfExport}
                    className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 rounded-full py-2.5 px-5 text-sm font-medium
                               hover:-translate-y-0.5 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
