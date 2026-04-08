'use client';

import { useState } from 'react';

interface CancelModalProps {
    appointmentId: string;
    onConfirm: (id: string, reason: string) => Promise<void>;
    onClose: () => void;
}

export default function CancelModal({ appointmentId, onConfirm, onClose }: CancelModalProps) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (!reason.trim()) {
            setError('Por favor indica el motivo de cancelación.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await onConfirm(appointmentId, reason.trim());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cancelar la cita.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="card-glass w-full max-w-md mx-4 p-6 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">⚠️</span>
                    <h2 className="text-lg font-bold text-petwell-navy">Cancelar cita</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Esta acción no se puede deshacer. Por favor indica el motivo de cancelación.
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-semibold text-petwell-navy mb-1">
                        Motivo de cancelación <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-petwell-navy focus:outline-none focus:ring-2 focus:ring-petwell-blue resize-none"
                        placeholder="Ej: No puedo asistir por cuestiones personales..."
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (error) setError(null);
                        }}
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Cancelando...
                            </>
                        ) : (
                            'Confirmar cancelación'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
