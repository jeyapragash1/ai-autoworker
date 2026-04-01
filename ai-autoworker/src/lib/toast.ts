// Toast notification system with event-driven architecture

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // milliseconds, 0 = infinite
}

const TOAST_EVENT_NAME = 'toast-event';
const DEFAULT_DURATION = 4000;

export function showToast(
  message: string,
  type: ToastType = 'info',
  duration: number = DEFAULT_DURATION
): string {
  const id = Math.random().toString(36).substring(2, 11);
  const toast: Toast = { id, type, message, duration };

  if (typeof window !== 'undefined') {
    const event = new CustomEvent(TOAST_EVENT_NAME, { detail: toast });
    window.dispatchEvent(event);
  }

  return id;
}

export function dismissToast(id: string): void {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('dismiss-toast', { detail: { id } });
    window.dispatchEvent(event);
  }
}

export function onToastShow(callback: (toast: Toast) => void): () => void {
  const handler = (event: Event) => {
    if (event instanceof CustomEvent) {
      callback(event.detail as Toast);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(TOAST_EVENT_NAME, handler);
    return () => window.removeEventListener(TOAST_EVENT_NAME, handler);
  }

  return () => {};
}

export function onToastDismiss(callback: (id: string) => void): () => void {
  const handler = (event: Event) => {
    if (event instanceof CustomEvent) {
      callback(event.detail.id as string);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('dismiss-toast', handler);
    return () => window.removeEventListener('dismiss-toast', handler);
  }

  return () => {};
}
