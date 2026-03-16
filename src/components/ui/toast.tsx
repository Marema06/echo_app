'use client';

import { useState, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <ToastCard
            key={t.id}
            item={t}
            onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const config = {
    success: {
      icon: CheckCircle2,
      iconClass: 'text-green-500',
      cardClass: 'bg-white dark:bg-ink-800 border-green-200 dark:border-green-800/60',
    },
    error: {
      icon: AlertCircle,
      iconClass: 'text-red-500',
      cardClass: 'bg-white dark:bg-ink-800 border-red-200 dark:border-red-800/60',
    },
    info: {
      icon: Info,
      iconClass: 'text-blue-500',
      cardClass: 'bg-white dark:bg-ink-800 border-ink-900/[0.1] dark:border-ink-700/50',
    },
  };

  const { icon: Icon, iconClass, cardClass } = config[item.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 border rounded-2xl px-4 py-3 shadow-pop animate-rise min-w-[260px] max-w-[380px] ${cardClass}`}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClass}`} />
      <p className="text-sm text-ink-800 dark:text-ink-200 flex-1 leading-relaxed">{item.message}</p>
      <button
        onClick={onDismiss}
        className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 transition-colors mt-0.5 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.toast;
}
