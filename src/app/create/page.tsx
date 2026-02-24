'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Mic, Sparkles, Wand2, Image, Layers, Crown, ArrowRight } from 'lucide-react';
import { Topbar } from '@/components/layout/topbar';
import { Spinner } from '@/components/ui/spinner';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useSpeech } from '@/hooks/use-speech';
import { generateVisualization } from '@/lib/visualization';
import { VISUALIZATION_STYLES, type VisualizationStyle, type Analysis } from '@/types';

type ImageMode = 'canvas' | 'ai';

export default function CreatePage() {
  const [text, setText] = useState('');
  const [style, setStyle] = useState<VisualizationStyle>('aquarelle');
  const [imageMode, setImageMode] = useState<ImageMode>('canvas');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const router = useRouter();

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

  const handleSubmit = async () => {
    if (!isValid || isAnalyzing) return;
    setError('');
    setIsAnalyzing(true);

    try {
      // Step 1: Analyze with AI
      setAnalysisStep('Analyse émotionnelle en cours...');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!analyzeRes.ok) {
        throw new Error('Erreur lors de l\'analyse IA');
      }

      const analysis: Analysis = await analyzeRes.json();

      // Step 2: Generate visualization
      let visualizationUrl: string;

      if (imageMode === 'ai') {
        // AI image generation via Pollinations
        setAnalysisStep('Génération de l\'image IA... (15-30s)');
        try {
          const imageRes = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emotion: analysis.dominantEmotion,
              intensity: analysis.intensity,
              style,
              keywords: analysis.keywords,
            }),
          });

          if (imageRes.ok) {
            const imageData = await imageRes.json();
            visualizationUrl = imageData.url;
          } else {
            // AI failed - fallback to Canvas
            console.warn('AI image failed, falling back to Canvas');
            setAnalysisStep('IA indisponible, création Canvas...');
            visualizationUrl = generateVisualization({
              emotion: analysis.dominantEmotion,
              intensity: analysis.intensity,
              style,
            });
          }
        } catch {
          // Network error - fallback to Canvas
          console.warn('AI image network error, falling back to Canvas');
          setAnalysisStep('IA indisponible, création Canvas...');
          visualizationUrl = generateVisualization({
            emotion: analysis.dominantEmotion,
            intensity: analysis.intensity,
            style,
          });
        }
      } else {
        // Canvas generation (instant)
        setAnalysisStep('Création de la visualisation...');
        visualizationUrl = generateVisualization({
          emotion: analysis.dominantEmotion,
          intensity: analysis.intensity,
          style,
        });
      }

      // Step 3: Save entry
      setAnalysisStep('Sauvegarde...');
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
        console.error('Save error:', entryRes.status, errBody);
        throw new Error(errBody.error || 'Erreur lors de la sauvegarde');
      }

      clearDraft();
      setSaveSuccess(true);
      // Redirect after short delay to show success
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

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

          {/* Waveform animation */}
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
                L&apos;IA synthétise vos émotions en visualisation unique.
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
            <p className="text-sm font-medium text-ink-700">Mode de génération</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setImageMode('canvas')}
                className={`
                  relative text-left px-4 py-4 rounded-2xl border text-sm transition-all
                  ${imageMode === 'canvas'
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-200 bg-white/80 text-ink-700 hover:border-ink-300'
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
                    : 'border-purple-200 bg-purple-50/50 text-ink-700 hover:border-purple-300'
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
            <p className="text-sm font-medium text-ink-700">Style visuel</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VISUALIZATION_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`
                    text-left px-4 py-3 rounded-2xl border text-sm transition-all
                    ${style === s.id
                      ? 'border-ink-900 bg-ink-900 text-white dark:bg-ink-50 dark:text-ink-900'
                      : 'border-ink-200 bg-white/80 text-ink-700 hover:border-ink-300'
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

          {saveSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-3 text-sm text-green-700 dark:text-green-300 flex items-center justify-between">
              <span>✨ Tuile créée avec succès ! Redirection...</span>
              <Link href="/dashboard" className="underline font-medium hover:opacity-80">
                Voir ma mosaïque
              </Link>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 space-y-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 underline"
              >
                Retourner à ma mosaïque
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
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
              <>
                <Spinner size="sm" />
                {analysisStep}
              </>
            ) : (
              <>
                {imageMode === 'ai' ? <Image className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {imageMode === 'ai' ? 'Générer avec l\'IA' : 'Créer ma tuile'}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
