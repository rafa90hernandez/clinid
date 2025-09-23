'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms (default: 3000)
};

type ToastContextValue = {
  toast: (t: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    const duration = t.duration ?? 3000;
    const next: Toast = { id, ...t, duration };
    setToasts((prev) => [...prev, next]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, duration);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

function Toaster({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={[
            'min-w-64 max-w-96 rounded-xl px-4 py-3 shadow-lg border text-sm',
            t.variant === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : t.variant === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : t.variant === 'warning'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
              : 'bg-white border-slate-200 text-slate-900',
          ].join(' ')}
        >
          {t.title && <div className="font-medium">{t.title}</div>}
          {t.description && (
            <div className="mt-0.5 opacity-80">{t.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}
