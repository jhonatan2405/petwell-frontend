'use client';

import { useEffect, useState } from 'react';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    duration?: number;
}

interface ToastProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

const ICONS = {
    success: (
        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    error: (
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    info: (
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const STYLES = {
    success: { wrapper: 'bg-white border-emerald-200', bar: 'bg-emerald-400' },
    error:   { wrapper: 'bg-white border-red-200',     bar: 'bg-red-400' },
    info:    { wrapper: 'bg-white border-blue-200',    bar: 'bg-blue-400' },
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
    const [visible, setVisible] = useState(false);
    const duration = toast.duration ?? 4000;
    const { wrapper, bar } = STYLES[toast.type];

    useEffect(() => {
        // Trigger entrance animation
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`
                relative overflow-hidden rounded-xl border shadow-lg
                transition-all duration-300 ease-out
                ${wrapper}
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
        >
            {/* Progress bar */}
            <div
                className={`absolute top-0 left-0 h-0.5 ${bar} toast-progress`}
                style={{ animationDuration: `${duration}ms` }}
            />

            <div className="flex items-start gap-3 px-4 py-3.5">
                <span className="mt-0.5">{ICONS[toast.type]}</span>
                <p className="text-sm font-medium text-gray-700 flex-1 leading-relaxed">{toast.message}</p>
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-1 mt-0.5"
                    aria-label="Cerrar notificación"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export function Toast({ toasts, onDismiss }: ToastProps) {
    return (
        <div
            aria-label="Notificaciones"
            className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 w-80 sm:w-96"
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

// ─── Hook para gestionar toasts ───────────────────────────────────────────────
export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (type: ToastMessage['type'], message: string, durationMs = 4000) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, type, message, duration: durationMs }]);
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
