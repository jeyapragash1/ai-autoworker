'use client';

import { useState, useEffect } from 'react';
import type { Toast } from '@/lib/toast';
import { onToastShow, onToastDismiss } from '@/lib/toast';

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribeShow = onToastShow((toast) => {
      setToasts((prev) => [...prev, toast]);

      // Auto-dismiss if duration is set and > 0
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    });

    const unsubscribeDismiss = onToastDismiss((id) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    });

    return () => {
      unsubscribeShow();
      unsubscribeDismiss();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-amber-600',
  }[toast.type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }[toast.type];

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm animate-in slide-in-from-bottom-4`}
    >
      <span className="font-bold text-lg">{icon}</span>
      <p className="text-sm">{toast.message}</p>
    </div>
  );
}
