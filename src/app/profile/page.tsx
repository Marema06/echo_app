'use client';

import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { VISUALIZATION_STYLES, type VisualizationStyle } from '@/types';
import { User, Mail, Calendar, Flame, BookOpen, Palette } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EmotionalPortrait } from '@/components/ui/emotional-portrait';
import { EMOTION_COLORS, type EmotionName } from '@/types';

interface ProfileData {
  email: string;
  created_at: string;
  subscription_tier: string;
  preferences: {
    defaultStyle?: VisualizationStyle;
    theme?: string;
  };
}

interface StatsData {
  totalEntries: number;
  streak: number;
  avgIntensity?: number;
  mostFrequent?: [string, number] | null;
  emotionCounts?: Record<string, number>;
  empty?: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultStyle, setDefaultStyle] = useState<VisualizationStyle>('aquarelle');
  const toast = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [profileRes, statsRes] = await Promise.all([
          supabase.from('users').select('*').eq('id', user.id).single(),
          fetch('/api/stats').then(r => r.json()),
        ]);

        if (profileRes.data) {
          setProfile(profileRes.data);
          setDefaultStyle(profileRes.data.preferences?.defaultStyle || 'aquarelle');
        }

        setStats(statsRes);
      } catch {
        toast('Erreur lors du chargement du profil', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase, toast]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ preferences: { ...profile?.preferences, defaultStyle } })
        .eq('id', user.id);

      if (error) throw error;
      toast('Préférences sauvegardées', 'success');
      setProfile(prev => prev ? { ...prev, preferences: { ...prev.preferences, defaultStyle } } : prev);
    } catch {
      toast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : '';

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-12">
      <Topbar />
      <main className="max-w-[760px] mx-auto px-6 py-8 space-y-5">

        <div>
          <h2 className="font-serif text-3xl">Mon profil</h2>
          <p className="text-ink-500 text-sm mt-1">Gérez vos préférences et consultez vos statistiques.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            {/* Identity card */}
            <div className="bg-surface-glass rounded-3xl p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-ink-900/[0.08] dark:bg-ink-50/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-ink-500" />
                </div>
                <div>
                  <p className="font-medium text-ink-800 dark:text-ink-200">{profile?.email}</p>
                  <p className="text-xs text-ink-400 capitalize">
                    Abonnement {profile?.subscription_tier || 'gratuit'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-3 bg-ink-900/[0.04] dark:bg-ink-50/5 rounded-2xl p-3">
                  <Mail className="w-4 h-4 text-ink-400 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink-400">Email</p>
                    <p className="text-sm text-ink-700 dark:text-ink-300 truncate">{profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-ink-900/[0.04] dark:bg-ink-50/5 rounded-2xl p-3">
                  <Calendar className="w-4 h-4 text-ink-400 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink-400">Membre depuis</p>
                    <p className="text-sm text-ink-700 dark:text-ink-300">{memberSince}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-2xl p-3">
                  <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">Série</p>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      {stats?.streak || 0} jour{(stats?.streak || 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emotional Portrait */}
            {stats && !stats.empty && stats.emotionCounts && Object.keys(stats.emotionCounts).length > 0 && (
              <div className="bg-surface-glass rounded-3xl p-6 shadow-soft">
                <p className="text-xs uppercase tracking-wider text-ink-400 mb-5">Votre ADN émotionnel</p>
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="shrink-0">
                    <EmotionalPortrait
                      emotionCounts={stats.emotionCounts}
                      size={180}
                      className="rounded-full"
                    />
                  </div>
                  <div className="space-y-3 text-center sm:text-left">
                    <div>
                      <h3 className="font-serif text-xl leading-snug">
                        {stats.mostFrequent ? (
                          <>Votre émotion dominante est{' '}
                            <span
                              className="capitalize"
                              style={{ color: EMOTION_COLORS[stats.mostFrequent[0] as EmotionName]?.[0] }}
                            >
                              {stats.mostFrequent[0]}
                            </span>
                          </>
                        ) : 'Portrait unique'}
                      </h3>
                      <p className="text-sm text-ink-500 mt-1">
                        Ce portrait évolue à chaque entrée, reflétant fidèlement votre paysage intérieur.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      {Object.entries(stats.emotionCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([emotion, count]) => {
                          const color = EMOTION_COLORS[emotion as EmotionName]?.[0] ?? '#94a3b8';
                          return (
                            <span
                              key={emotion}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                              style={{
                                color,
                                borderColor: `${color}33`,
                                backgroundColor: `${color}12`,
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="capitalize">{emotion}</span>
                              <span className="opacity-60">×{count}</span>
                            </span>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity */}
            <div className="bg-surface-glass rounded-3xl p-6 shadow-soft">
              <h3 className="text-xs uppercase tracking-wider text-ink-400 mb-4">Activité</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center py-4 bg-ink-900/[0.03] dark:bg-ink-50/5 rounded-2xl">
                  <BookOpen className="w-5 h-5 text-ink-400 mx-auto mb-2" />
                  <p className="font-serif text-3xl">{stats?.totalEntries || 0}</p>
                  <p className="text-xs text-ink-500 mt-1">entrée{(stats?.totalEntries || 0) > 1 ? 's' : ''} au total</p>
                </div>
                <div className="text-center py-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                  <Flame className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                  <p className="font-serif text-3xl text-amber-700 dark:text-amber-300">{stats?.streak || 0}</p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">jours consécutifs</p>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-surface-glass rounded-3xl p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-ink-400" />
                <h3 className="text-xs uppercase tracking-wider text-ink-400">Style par défaut</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VISUALIZATION_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setDefaultStyle(s.id)}
                    className={`text-left px-4 py-3 rounded-2xl border text-sm transition-all ${
                      defaultStyle === s.id
                        ? 'border-ink-900 bg-ink-900 text-white dark:bg-ink-50 dark:text-ink-900'
                        : 'border-ink-200 dark:border-ink-700 bg-white/80 dark:bg-ink-800/60 text-ink-700 dark:text-ink-300 hover:border-ink-300'
                    }`}
                  >
                    <span className="font-medium block text-sm">{s.name}</span>
                    <span className={`text-xs ${defaultStyle === s.id ? 'text-white/70 dark:text-ink-500' : 'text-ink-400'}`}>
                      {s.description}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={savePreferences}
                disabled={saving || defaultStyle === profile?.preferences?.defaultStyle}
                className="w-full py-2.5 rounded-full bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900 text-sm font-medium
                           hover:-translate-y-0.5 transition-all shadow-pop
                           disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
