'use client';

import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Download, Trash2 } from 'lucide-react';
import { type Entry, EMOTION_COLORS, type EmotionName } from '@/types';
import { generateVisualizationHD } from '@/lib/visualization';

interface EntryModalProps {
  entry: Entry;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onDelete?: (id: string) => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function EntryModal({ entry, onClose, onPrev, onNext, onDelete, hasPrev, hasNext }: EntryModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
    if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDownload = () => {
    const hdUrl = generateVisualizationHD({
      emotion: entry.analysis.dominantEmotion,
      intensity: entry.analysis.intensity,
      style: entry.visualization_style,
    });

    const link = document.createElement('a');
    link.href = hdUrl;
    link.download = `echo-${entry.analysis.dominantEmotion}-${new Date(entry.created_at).toISOString().slice(0, 10)}.png`;
    link.click();
  };

  const emotionColor = EMOTION_COLORS[entry.analysis.dominantEmotion as EmotionName]?.[0] || '#94a3b8';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface rounded-4xl shadow-pop max-w-[900px] w-full max-h-[90vh] overflow-y-auto relative animate-fade-in
                      dark:border dark:border-ink-700/50">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full
                     bg-ink-900/5 dark:bg-ink-100/10 hover:bg-ink-900/10 dark:hover:bg-ink-100/20 transition-colors"
        >
          <X className="w-5 h-5 text-ink-600 dark:text-ink-300" />
        </button>

        {/* Navigation arrows */}
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full
                       bg-ink-900/5 dark:bg-ink-100/10 hover:bg-ink-900/10 dark:hover:bg-ink-100/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-ink-600 dark:text-ink-300" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full
                       bg-ink-900/5 dark:bg-ink-100/10 hover:bg-ink-900/10 dark:hover:bg-ink-100/20 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-ink-600" />
          </button>
        )}

        <div className="grid md:grid-cols-2 gap-0">
          {/* Visualization */}
          <div className="p-6">
            <img
              src={entry.visualization_url}
              alt={`Visualisation - ${entry.analysis.dominantEmotion}`}
              className="w-full rounded-3xl shadow-pop"
            />
            <div className="flex items-center gap-2 mt-4 text-xs text-ink-500">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {/* Info */}
          <div className="p-6 space-y-5">
            {/* Original text */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-ink-400 mb-3">Texte original</h3>
              <p className="text-sm leading-relaxed text-ink-700">{entry.text}</p>
            </div>

            {/* Analysis card */}
            <div className="bg-surface-glass rounded-2xl p-4 space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-ink-400">Analyse émotionnelle</h3>

              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink-800 capitalize" style={{ color: emotionColor }}>
                  {entry.analysis.dominantEmotion}
                </span>
                <span className="bg-ink-900/10 px-2.5 py-1 rounded-full text-xs text-ink-600">Dominant</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Intensité</span>
                <span className="font-semibold text-ink-800">{entry.analysis.intensity}/10</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Valence</span>
                <span className="font-semibold text-ink-800 capitalize">{entry.analysis.valence}</span>
              </div>

              {/* Emotion bars */}
              <div className="space-y-1.5 pt-2">
                {entry.analysis.emotions
                  .filter((e) => e.score > 0)
                  .sort((a, b) => b.score - a.score)
                  .map((emotion) => (
                    <div key={emotion.name} className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-ink-500 capitalize">{emotion.name}</span>
                      <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${emotion.score * 10}%`,
                            backgroundColor: EMOTION_COLORS[emotion.name as EmotionName]?.[0] || '#94a3b8',
                          }}
                        />
                      </div>
                      <span className="w-5 text-right text-ink-400">{emotion.score}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Keywords */}
            {entry.analysis.keywords.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-ink-400 mb-2">Mots-clés</h3>
                <div className="flex flex-wrap gap-2">
                  {entry.analysis.keywords.map((kw, i) => (
                    <span key={i} className="bg-accent-cool px-3 py-1 rounded-full text-xs text-ink-700">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-ink-100">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs border border-ink-200
                           text-ink-600 hover:bg-ink-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger HD
              </button>
              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm('Supprimer cette entrée ?')) {
                      onDelete(entry.id);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs border border-red-200
                             text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
