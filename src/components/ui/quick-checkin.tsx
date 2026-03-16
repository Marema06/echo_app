'use client';

import { useState } from 'react';
import { X, Zap, Loader2 } from 'lucide-react';
import { EMOTION_COLORS, type EmotionName } from '@/types';
import { useToast } from '@/components/ui/toast';

const EMOTIONS: EmotionName[] = [
  'joie', 'sérénité', 'espoir', 'surprise', 'nostalgie',
  'tristesse', 'peur', 'anxiété', 'colère', 'frustration',
];

interface QuickCheckinProps {
  onClose: () => void;
}

export function QuickCheckin({ onClose }: QuickCheckinProps) {
  const [emotion, setEmotion] = useState<EmotionName | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!emotion) return;
    setLoading(true);
    try {
      const text = `Check-in rapide : je me sens ${emotion} aujourd'hui, avec une intensité de ${intensity} sur 10.`;
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style: 'minimaliste' }),
      });
      if (!res.ok) throw new Error();
      onClose();
      toast('Check-in enregistré !', 'success');
    } catch {
      toast('Erreur lors du check-in', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-ink-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5
                      border border-ink-100/80 dark:border-ink-700/50 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink-900 dark:text-ink-100">Check-in rapide</h2>
            <p className="text-xs text-ink-400 mt-0.5">Comment tu te sens maintenant ?</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-400 hover:text-ink-600 hover:bg-ink-50 dark:hover:bg-ink-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {EMOTIONS.map(em => {
            const color = EMOTION_COLORS[em]?.[0] ?? '#94a3b8';
            const isSelected = emotion === em;
            return (
              <button
                key={em}
                onClick={() => setEmotion(em)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-sm font-medium capitalize transition-all ${
                  isSelected
                    ? 'text-white border-transparent'
                    : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 bg-white/80 dark:bg-ink-800/60 hover:border-ink-300'
                }`}
                style={isSelected ? { backgroundColor: color } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.6)' : color }}
                />
                {em}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-ink-400">
            <span>Intensité</span>
            <span className="font-semibold text-ink-700 dark:text-ink-300">{intensity}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            className="w-full accent-ink-900"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!emotion || loading}
          className="w-full py-3 rounded-full bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900
                     text-sm font-medium hover:-translate-y-0.5 transition-all shadow-pop
                     disabled:opacity-40 disabled:hover:translate-y-0
                     inline-flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
            : <><Zap className="w-4 h-4" /> Enregistrer</>
          }
        </button>
      </div>
    </div>
  );
}
