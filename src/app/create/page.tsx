'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Mic, Sparkles, Wand2, Image, Layers, Crown, ArrowRight, RotateCcw, Clock, Send } from 'lucide-react';
import { Topbar } from '@/components/layout/topbar';
import { Spinner } from '@/components/ui/spinner';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useSpeech } from '@/hooks/use-speech';
import { useToast } from '@/components/ui/toast';
import { generateVisualization } from '@/lib/visualization';
import { VISUALIZATION_STYLES, EMOTION_COLORS, type VisualizationStyle, type Analysis, type EmotionName } from '@/types';

type ImageMode = 'canvas' | 'ai';
type Step = 'write' | 'preview' | 'letter';

const DELAY_OPTIONS: { days: 30 | 90 | 365; label: string; sublabel: string }[] = [
  { days: 30, label: 'Dans 30 jours', sublabel: 'Un mois plus tard' },
  { days: 90, label: 'Dans 3 mois', sublabel: 'Un trimestre plus tard' },
  { days: 365, label: 'Dans 1 an', sublabel: 'Un an plus tard' },
];

interface ResonanceEntry {
  id: string;
  text: string;
  created_at: string;
  analysis: Analysis;
  visualization_url: string;
}

function timeAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return 'hier';
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`;
  return `il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
}

const VALENCE_LABEL: Record<string, string> = {
  positive: 'Positive',
  negative: 'Négative',
  neutre: 'Neutre',
};

const VALENCE_COLOR: Record<string, string> = {
  positive: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  negative: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  neutre: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400',
};

export default function CreatePage() {
  const [step, setStep] = useState<Step>('write');
  const [text, setText] = useState('');
  const [style, setStyle] = useState<VisualizationStyle>('aquarelle');
  const [imageMode, setImageMode] = useState<ImageMode>('canvas');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [visualizationUrl, setVisualizationUrl] = useState('');
  const [error, setError] = useState('');
  const [resonanceEntries, setResonanceEntries] = useState<ResonanceEntry[]>([]);
  const router = useRouter();
  const toast = useToast();

  const { clearDraft, loadDraft } = useAutoSave('echo:draft', text);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) setText(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTranscript = useCallback((transcript: string) => {
    setText(transcript);
  }, []);

  const speech = useSpeech(handleTranscript);

  const charCount = text.length;
  const isValid = charCount >= 50 && charCount <= 2000;

  // Step 1 → analyze + generate visualization, show preview
  const handleAnalyze = async () => {
    if (!isValid || isAnalyzing) return;
    setError('');
    setIsAnalyzing(true);

    try {
      setAnalysisStep('Analyse émotionnelle...');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!analyzeRes.ok) throw new Error('Erreur lors de l\'analyse IA');
      const result: Analysis = await analyzeRes.json();

      let vizUrl: string;

      if (imageMode === 'ai') {
        setAnalysisStep('Génération IA... (15-30s)');
        try {
          const imageRes = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emotion: result.dominantEmotion,
              intensity: result.intensity,
              style,
              keywords: result.keywords,
            }),
          });
          if (imageRes.ok) {
            const imageData = await imageRes.json();
            vizUrl = imageData.url;
          } else {
            vizUrl = generateVisualization({ emotion: result.dominantEmotion, intensity: result.intensity, style });
          }
        } catch {
          vizUrl = generateVisualization({ emotion: result.dominantEmotion, intensity: result.intensity, style });
        }
      } else {
        setAnalysisStep('Création de la visualisation...');
        vizUrl = generateVisualization({ emotion: result.dominantEmotion, intensity: result.intensity, style });
      }

      setAnalysis(result);
      setVisualizationUrl(vizUrl);

      // Fetch resonance entries (same dominant emotion, past entries)
      try {
        const resRes = await fetch(`/api/entries?emotion=${encodeURIComponent(result.dominantEmotion)}&limit=3`);
        if (resRes.ok) {
          const resData = await resRes.json();
          setResonanceEntries(resData.entries || []);
        }
      } catch { /* fail silently */ }

      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Step 2 → save entry
  const handleSave = async () => {
    if (!analysis || !visualizationUrl || isSaving) return;
    setIsSaving(true);

    try {
      const entryRes = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          analysis,
          visualization_url: visualizationUrl,
          visualization_style: style,
        }),
      });

      if (!entryRes.ok) {
        const errBody = await entryRes.json().catch(() => ({}));
        throw new Error(errBody.error || 'Erreur lors de la sauvegarde');
      }

      clearDraft();
      toast('Tuile ajoutée à votre mosaïque !', 'success');
      setStep('letter');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setStep('write');
    setError('');
  };

  const handleSendLetter = async (delayDays: 30 | 90 | 365) => {
    if (!analysis || !visualizationUrl) return;
    try {
      await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          dominant_emotion: analysis.dominantEmotion,
          visualization_url: visualizationUrl,
          delay_days: delayDays,
        }),
      });
      const option = DELAY_OPTIONS.find(o => o.days === delayDays);
      toast(`Lettre programmée — ${option?.label} 📬`, 'success');
    } catch {
      toast('Erreur lors de la programmation', 'error');
    } finally {
      router.push('/dashboard');
      router.refresh();
    }
  };

  // ── Letter step ───────────────────────────────────────────
  if (step === 'letter' && analysis) {
    const dominantColor = EMOTION_COLORS[analysis.dominantEmotion as EmotionName]?.[0] || '#94a3b8';
    return (
      <div className="min-h-screen bg-background pb-12">
        <Topbar />
        <main className="max-w-[520px] mx-auto px-6 py-16 space-y-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${dominantColor}18` }}>
              <Clock className="w-7 h-7" style={{ color: dominantColor }} />
            </div>
            <h2 className="font-serif text-2xl">Écrire à votre futur vous ?</h2>
            <p className="text-sm text-ink-500 leading-relaxed">
              Cette entrée sera envoyée à votre adresse email plus tard,<br />
              quand vous en aurez peut-être oublié les détails.
            </p>
          </div>

          <div className="space-y-3">
            {DELAY_OPTIONS.map(option => (
              <button
                key={option.days}
                onClick={() => handleSendLetter(option.days)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-ink-200 dark:border-ink-700
                           bg-white/80 dark:bg-ink-800/50 hover:border-ink-400 dark:hover:border-ink-500
                           transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{option.label}</p>
                  <p className="text-xs text-ink-400">{option.sublabel}</p>
                </div>
                <Send className="w-4 h-4 text-ink-400 group-hover:text-ink-700 dark:group-hover:text-ink-200 transition-colors" />
              </button>
            ))}
          </div>

          <button
            onClick={() => { router.push('/dashboard'); router.refresh(); }}
            className="w-full text-center text-sm text-ink-400 hover:text-ink-600 transition-colors py-2"
          >
            Non merci, aller au tableau de bord
          </button>
        </main>
      </div>
    );
  }

  // ── Preview step ──────────────────────────────────────────
  if (step === 'preview' && analysis) {
    const dominantColor = EMOTION_COLORS[analysis.dominantEmotion as EmotionName]?.[0] || '#94a3b8';
    const topEmotions = [...analysis.emotions]
      .filter(e => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const maxScore = topEmotions[0]?.score || 1;

    return (
      <div className="min-h-screen bg-background pb-12">
        <Topbar />
        <main className="max-w-[720px] mx-auto px-6 py-8 space-y-6">
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-2 text-ink-600 hover:text-ink-900 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Modifier mon texte
          </button>

          <div className="bg-surface-glass backdrop-blur-sm rounded-4xl p-8 shadow-soft space-y-7">

            {/* Header */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400">Résultat de l&apos;analyse</p>
              <h2 className="font-serif text-2xl mt-1">Votre portrait émotionnel</h2>
              <p className="text-ink-500 text-sm mt-1">Voici ce que l&apos;IA a perçu dans votre texte.</p>
            </div>

            {/* Tile + dominant emotion */}
            <div className="flex gap-6 items-start">
              <div className="shrink-0">
                <img
                  src={visualizationUrl}
                  alt={analysis.dominantEmotion}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-pop"
                />
              </div>
              <div className="space-y-3 pt-1">
                <div>
                  <p className="text-xs text-ink-400 uppercase tracking-wider mb-1">Émotion dominante</p>
                  <p
                    className="font-serif text-3xl font-semibold capitalize"
                    style={{ color: dominantColor }}
                  >
                    {analysis.dominantEmotion}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink-900/[0.07] text-ink-600 text-xs font-medium">
                    Intensité <strong>{analysis.intensity}/10</strong>
                  </span>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${VALENCE_COLOR[analysis.valence]}`}>
                    {VALENCE_LABEL[analysis.valence]}
                  </span>
                </div>
              </div>
            </div>

            {/* Emotion bars */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-ink-400">Émotions détectées</p>
              {topEmotions.map(e => {
                const pct = Math.round((e.score / maxScore) * 100);
                const color = EMOTION_COLORS[e.name as EmotionName]?.[0] || '#94a3b8';
                return (
                  <div key={e.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm capitalize text-ink-700 dark:text-ink-300">{e.name}</span>
                      <span className="text-xs text-ink-400 tabular-nums">{e.score}/10</span>
                    </div>
                    <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Keywords */}
            {analysis.keywords.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-ink-400">Mots-clés</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.map(kw => (
                    <span key={kw} className="px-3 py-1 rounded-full bg-ink-900/[0.06] text-ink-600 dark:text-ink-400 text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resonance temporelle */}
            {resonanceEntries.length > 0 && (
              <div className="space-y-3 pt-1">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-400">Résonances passées</p>
                  <p className="text-sm text-ink-500 mt-0.5">
                    Tu as déjà ressenti <span className="font-medium capitalize" style={{ color: EMOTION_COLORS[analysis.dominantEmotion as EmotionName]?.[0] }}>{analysis.dominantEmotion}</span>...
                  </p>
                </div>
                <div className="space-y-2">
                  {resonanceEntries.map(entry => (
                    <div key={entry.id} className="flex gap-3 items-start p-3 rounded-2xl bg-ink-50/60 dark:bg-ink-800/30 border border-ink-100/80 dark:border-ink-700/40">
                      <img
                        src={entry.visualization_url}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover shrink-0 opacity-80"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-ink-400 mb-0.5">{timeAgo(entry.created_at)}</p>
                        <p className="text-sm text-ink-600 dark:text-ink-400 line-clamp-2">{entry.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={handleEdit}
                className="inline-flex items-center justify-center gap-2 border border-ink-900/[0.12] dark:border-ink-600/30
                           rounded-full py-3 px-6 text-sm text-ink-700 dark:text-ink-300
                           hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Modifier mon texte
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900
                           rounded-full py-3 px-6 text-sm font-medium
                           hover:-translate-y-0.5 transition-all shadow-pop
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSaving ? (
                  <><Spinner size="sm" /> Enregistrement...</>
                ) : (
                  <>Ajouter à ma mosaïque <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Write step ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-12">
      <Topbar />
      <main className="max-w-[720px] mx-auto px-6 py-8 space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-ink-600 hover:text-ink-900 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="bg-surface-glass backdrop-blur-sm rounded-4xl p-8 shadow-soft space-y-6">
          <div>
            <h2 className="font-serif text-2xl">Comment vous sentez-vous ?</h2>
            <p className="text-ink-500 text-sm mt-2">
              Exprimez vos émotions librement, au moins 50 caractères.
            </p>
          </div>

          {/* Voice recording toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => speech.toggleRecording(text)}
              disabled={!speech.isSupported}
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all
                ${speech.isRecording
                  ? 'border-red-400/60 bg-red-50/60 text-red-700'
                  : 'border-dashed border-ink-200 bg-surface-glass text-ink-600 hover:border-ink-300'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <Mic className="w-4 h-4" />
              {speech.isRecording ? 'Arrêter' : 'Dictée vocale'}
            </button>

            {speech.isRecording && (
              <>
                <span className="text-xs bg-red-100/50 text-red-700 px-2.5 py-1 rounded-full">
                  Enregistrement...
                </span>
                <span className="text-xs text-ink-500 tabular-nums">{speech.formattedTime}</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-ring" />
              </>
            )}
            {!speech.isSupported && (
              <span className="text-xs text-ink-400">Non supporté par le navigateur</span>
            )}
          </div>

          {speech.isRecording && (
            <div className="flex gap-1.5 items-end h-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-1.5 bg-red-400/70 rounded-full animate-wave"
                  style={{ animationDelay: `${i * 0.15}s`, height: '6px' }}
                />
              ))}
            </div>
          )}

          {speech.interimText && (
            <p className="text-xs text-ink-400 italic">...{speech.interimText}</p>
          )}

          {/* Text area */}
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Aujourd'hui, je me sens..."
              disabled={isAnalyzing}
              className="w-full min-h-[180px] rounded-3xl border border-ink-200 dark:border-ink-700 bg-surface
                         p-4 text-sm resize-y font-sans
                         focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-900/5
                         transition-all disabled:opacity-50"
            />
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs text-ink-500">
                <Wand2 className="w-3.5 h-3.5" />
                L&apos;IA analyse et visualise vos émotions.
              </div>
              <span className={`text-xs tabular-nums ${
                charCount < 50 ? 'text-amber-600' : charCount > 2000 ? 'text-red-600' : 'text-green-600'
              }`}>
                {charCount} / 2000{charCount < 50 && ` (min. 50)`}
              </span>
            </div>
          </div>

          {/* Image mode selector */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-700 dark:text-ink-300">Mode de génération</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setImageMode('canvas')}
                className={`
                  relative text-left px-4 py-4 rounded-2xl border text-sm transition-all
                  ${imageMode === 'canvas'
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-200 bg-white/80 dark:bg-ink-800/60 dark:border-ink-700 text-ink-700 dark:text-ink-300 hover:border-ink-300'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="font-medium">Canvas</span>
                </div>
                <span className={`text-xs block ${imageMode === 'canvas' ? 'text-white/70' : 'text-ink-400'}`}>
                  Instantané, formes génératives
                </span>
                <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full ${
                  imageMode === 'canvas' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                }`}>
                  Gratuit
                </span>
              </button>

              <button
                onClick={() => setImageMode('ai')}
                className={`
                  relative text-left px-4 py-4 rounded-2xl border text-sm transition-all
                  ${imageMode === 'ai'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-600 to-pink-500 text-white'
                    : 'border-purple-200 bg-purple-50/50 dark:bg-purple-900/10 dark:border-purple-800/40 text-ink-700 dark:text-ink-300 hover:border-purple-300'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Image className="w-4 h-4" />
                  <span className="font-medium">IA Générative</span>
                </div>
                <span className={`text-xs block ${imageMode === 'ai' ? 'text-white/80' : 'text-ink-400'}`}>
                  Art unique par Stable Diffusion
                </span>
                <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  imageMode === 'ai' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                }`}>
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              </button>
            </div>
          </div>

          {/* Style selector */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-700 dark:text-ink-300">Style visuel</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VISUALIZATION_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`
                    text-left px-4 py-3 rounded-2xl border text-sm transition-all
                    ${style === s.id
                      ? 'border-ink-900 bg-ink-900 text-white dark:bg-ink-50 dark:text-ink-900'
                      : 'border-ink-200 dark:border-ink-700 bg-white/80 dark:bg-ink-800/60 text-ink-700 dark:text-ink-300 hover:border-ink-300'
                    }
                  `}
                >
                  <span className="font-medium block">{s.name}</span>
                  <span className={`text-xs ${style === s.id ? 'text-white/70 dark:text-ink-500' : 'text-ink-400'}`}>
                    {s.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!isValid || isAnalyzing}
            className={`w-full flex items-center justify-center gap-2 rounded-full py-3.5 px-6 text-sm font-medium
                       hover:-translate-y-0.5 transition-all shadow-pop
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                       ${imageMode === 'ai'
                         ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                         : 'bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900'
                       }`}
          >
            {isAnalyzing ? (
              <><Spinner size="sm" />{analysisStep}</>
            ) : (
              <><Sparkles className="w-4 h-4" />Analyser mes émotions</>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
