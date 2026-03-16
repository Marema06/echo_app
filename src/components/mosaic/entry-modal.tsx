'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Download, Trash2, Share2, Check } from 'lucide-react';
import { type Entry, EMOTION_COLORS, type EmotionName } from '@/types';
import { generateVisualizationHD } from '@/lib/visualization';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showConfirm) return; // don't navigate while confirm is open
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
    if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
  }, [onClose, onPrev, onNext, hasPrev, hasNext, showConfirm]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !showConfirm) onClose();
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

  const handleDeleteConfirmed = () => {
    setShowConfirm(false);
    onDelete?.(entry.id);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await fetch('/api/entries/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: entry.id }),
      });
      const data = await res.json();
      if (data.token) {
        const url = `${window.location.origin}/share/${data.token}`;
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      }
    } finally {
      setSharing(false);
    }
  };

  const emotionColor = EMOTION_COLORS[entry.analysis.dominantEmotion as EmotionName]?.[0] || '#94a3b8';

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-surface rounded-4xl shadow-pop max-w-[900px] w-full max-h-[90vh] overflow-y-auto relative animate-fade-in
                        dark:border dark:border-ink-700/50">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full
                       bg-ink-900/5 dark:bg-ink-100/10 hover:bg-ink-900/10 dark:hover:bg-ink-100/20 transition-colors"
          >
            <X className="w-5 h-5 text-ink-600 dark:text-ink-300" />
          </button>

          {/* Navigation */}
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
              className="absolute right-14 top-4 z-10 w-10 h-10 flex items-center justify-center rounded-full
                         bg-ink-900/5 dark:bg-ink-100/10 hover:bg-ink-900/10 dark:hover:bg-ink-100/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-ink-600 dark:text-ink-300" />
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
                <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-300">{entry.text}</p>
              </div>

              {/* Analysis */}
              <div className="bg-surface-glass rounded-2xl p-4 space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-ink-400">Analyse émotionnelle</h3>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold capitalize" style={{ color: emotionColor }}>
                    {entry.analysis.dominantEmotion}
                  </span>
                  <span className="bg-ink-900/10 dark:bg-ink-100/10 px-2.5 py-1 rounded-full text-xs text-ink-600 dark:text-ink-400">Dominant</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-600 dark:text-ink-400">Intensité</span>
                  <span className="font-semibold">{entry.analysis.intensity}/10</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-600 dark:text-ink-400">Valence</span>
                  <span className={`font-semibold capitalize px-2 py-0.5 rounded-full text-xs ${
                    entry.analysis.valence === 'positive'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : entry.analysis.valence === 'negative'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400'
                  }`}>
                    {entry.analysis.valence}
                  </span>
                </div>

                {/* Emotion bars */}
                <div className="space-y-1.5 pt-2 border-t border-ink-100 dark:border-ink-800">
                  {entry.analysis.emotions
                    .filter(e => e.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .map(emotion => (
                      <div key={emotion.name} className="flex items-center gap-2 text-xs">
                        <span className="w-20 text-ink-500 capitalize">{emotion.name}</span>
                        <div className="flex-1 h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${emotion.score * 10}%`,
                              backgroundColor: EMOTION_COLORS[emotion.name as EmotionName]?.[0] || '#94a3b8',
                            }}
                          />
                        </div>
                        <span className="w-4 text-right text-ink-400">{emotion.score}</span>
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
                      <span key={i} className="bg-accent-cool px-3 py-1 rounded-full text-xs text-ink-700 dark:text-ink-300">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink-100 dark:border-ink-800">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs border border-ink-200 dark:border-ink-700
                             text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger HD
                </button>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs border transition-colors ${
                    shared
                      ? 'border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                      : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
                  }`}
                >
                  {shared ? <><Check className="w-3.5 h-3.5" /> Lien copié !</> : <><Share2 className="w-3.5 h-3.5" /> Partager</>}
                </button>
                {onDelete && (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs border border-red-200 dark:border-red-800/50
                               text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

      {/* Confirmation dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Supprimer cette entrée ?"
          message="Cette action est irréversible. La tuile et son analyse seront définitivement supprimées de votre mosaïque."
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          variant="danger"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
