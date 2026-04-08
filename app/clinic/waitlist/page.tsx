'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getWaitlist, updateWaitlistStatus } from '@/services/appointmentService';
import type { WaitlistEntry, WaitlistStatus } from '@/types';
import { Toast, useToast, friendlyError } from '@/components/appointments/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const STATUS_CONFIG: Record<WaitlistStatus, { label: string; className: string }> = {
    WAITING: { label: 'En espera', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    NOTIFIED: { label: 'Notificado', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    SCHEDULED: { label: 'Agendado', className: 'bg-green-100 text-green-800 border-green-200' },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200' },
};

export default function WaitlistPage() {
    const { token, user } = useAuth();
    const { toasts, dismiss, success, error: toastError } = useToast();

    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const clinicId = user?.clinic_id ?? '';

    const load = useCallback(async () => {
        if (!token || !clinicId) return;
        setLoading(true);
        try {
            const data = await getWaitlist(clinicId, token);
            setEntries(data);
        } catch (err) {
            toastError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, [token, clinicId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { load(); }, [load]);

    const handleStatusChange = async (id: string, status: WaitlistStatus) => {
        setUpdatingId(id);
        try {
            await updateWaitlistStatus(id, status, token ?? undefined);
            setEntries((prev) =>
                prev.map((e) => (e.id === id ? { ...e, status } : e))
            );
            success(`Estado actualizado: ${STATUS_CONFIG[status].label}`);
        } catch (err) {
            toastError(friendlyError(err));
        } finally {
            setUpdatingId(null);
        }
    };

    if (!clinicId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">No se encontró el ID de tu clínica.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-petwell-light via-white to-blue-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-petwell-navy">📋 Lista de Espera</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Pacientes esperando un espacio disponible
                        </p>
                    </div>
                    <button
                        onClick={load}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-petwell-navy text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                        🔄 Actualizar
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner size={48} text="Cargando lista de espera..." />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20 card-glass rounded-2xl">
                        <p className="text-5xl mb-3">✅</p>
                        <p className="text-xl font-bold text-petwell-navy mb-2">
                            La lista de espera está vacía
                        </p>
                        <p className="text-gray-400 text-sm">
                            No hay pacientes esperando un turno disponible.
                        </p>
                    </div>
                ) : (
                    <div className="card-glass rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-petwell-light text-petwell-navy text-xs font-bold uppercase tracking-wide">
                                        <th className="px-4 py-3 text-left">Mascota</th>
                                        <th className="px-4 py-3 text-left">Dueño</th>
                                        <th className="px-4 py-3 text-left">Fecha pref.</th>
                                        <th className="px-4 py-3 text-left">Hora pref.</th>
                                        <th className="px-4 py-3 text-left">Motivo</th>
                                        <th className="px-4 py-3 text-center">Estado</th>
                                        <th className="px-4 py-3 text-center">Cambiar estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry, i) => {
                                        const cfg = STATUS_CONFIG[entry.status];
                                        return (
                                            <tr
                                                key={entry.id}
                                                className={`border-t border-gray-50 hover:bg-petwell-light/30 transition-colors ${
                                                    i % 2 === 1 ? 'bg-gray-50/30' : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3 font-semibold text-petwell-navy">
                                                    🐾 {entry.pet_name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {entry.owner_name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {entry.preferred_date ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {entry.preferred_time ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 max-w-[160px]">
                                                    <p className="truncate">{entry.reason ?? '—'}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center border font-semibold rounded-full text-xs px-2.5 py-1 ${cfg.className}`}>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <select
                                                        disabled={updatingId === entry.id}
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                handleStatusChange(entry.id, e.target.value as WaitlistStatus);
                                                            }
                                                            e.target.value = '';
                                                        }}
                                                        defaultValue=""
                                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none disabled:opacity-50"
                                                    >
                                                        <option value="" disabled>Cambiar →</option>
                                                        {(Object.keys(STATUS_CONFIG) as WaitlistStatus[])
                                                            .filter((s) => s !== entry.status)
                                                            .map((s) => (
                                                                <option key={s} value={s}>
                                                                    {STATUS_CONFIG[s].label}
                                                                </option>
                                                            ))}
                                                    </select>
                                                    {updatingId === entry.id && (
                                                        <span className="text-xs text-gray-400 ml-2">...</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <Toast toasts={toasts} onDismiss={dismiss} />
        </main>
    );
}
