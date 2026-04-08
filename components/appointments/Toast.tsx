'use client';

import { useEffect, useState } from 'react';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

interface ToastProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

const ICONS = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
};

const STYLES = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function Toast({ toasts, onDismiss }: ToastProps) {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-80">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg animate-slide-up ${STYLES[t.type]}`}
                >
                    <span className="text-base flex-shrink-0">{ICONS[t.type]}</span>
                    <p className="text-sm font-medium flex-1">{t.message}</p>
                    <button
                        onClick={() => onDismiss(t.id)}
                        className="text-lg leading-none opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}

// ─── Hook para gestionar toasts ───────────────────────────────────────────────
export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (type: ToastMessage['type'], message: string, durationMs = 4000) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, durationMs);
    };

    const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

    return {
        toasts,
        dismiss,
        success: (msg: string) => addToast('success', msg),
        error: (msg: string) => addToast('error', msg),
        info: (msg: string) => addToast('info', msg),
    };
}

// ─── Helper: traduce errores del servicio a mensajes UX ──────────────────────
export function friendlyError(err: unknown): string {
    if (!(err instanceof Error)) return 'Error inesperado. Intenta de nuevo.';
    if (err.message === 'SLOT_TAKEN') return 'Este horario ya fue tomado. Por favor elige otro slot.';
    if (err.message === 'FORBIDDEN') return 'No tienes permisos para realizar esta acción.';
    if (err.message === 'SERVER_ERROR') return 'Error del servidor. Intenta de nuevo más tarde.';
    return err.message;
}
