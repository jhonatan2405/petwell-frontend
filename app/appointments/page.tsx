'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getAppointments, changeAppointmentStatus } from '@/services/appointmentService';
import type { Appointment, AppointmentStatus } from '@/types';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import CancelModal from '@/components/appointments/CancelModal';
import { Toast, useToast, friendlyError } from '@/components/appointments/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const STATUS_OPTIONS: { value: AppointmentStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todos los estados' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'CONFIRMED', label: 'Confirmada' },
    { value: 'COMPLETED', label: 'Completada' },
    { value: 'CANCELLED', label: 'Cancelada' },
    { value: 'NO_SHOW', label: 'No asistió' },
];

export default function OwnerAppointmentsPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const { toasts, dismiss, success, error: toastError } = useToast();

    // Redirect clinic staff away from the owner-scoped list
    useEffect(() => {
        if (user && user.role !== 'DUENO_MASCOTA') {
            router.replace('/clinic/appointments');
        }
    }, [user, router]);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'ALL'>('ALL');
    const [filterDate, setFilterDate] = useState('');
    const [cancelId, setCancelId] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await getAppointments(token);
            setAppointments(data);
        } catch (err) {
            toastError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        load();
    }, [load]);

    // ─── Filter ──────────────────────────────────────────────────────────────
    const filtered = appointments.filter((a) => {
        const statusOk = filterStatus === 'ALL' || a.status === filterStatus;
        const dateOk = !filterDate || a.appointment_date === filterDate;
        return statusOk && dateOk;
    });

    // ─── Cancel handler ──────────────────────────────────────────────────────
    const handleCancel = async (id: string, reason: string) => {
        await changeAppointmentStatus(id, 'CANCELLED', reason, token ?? undefined);
        // optimistic update
        setAppointments((prev) =>
            prev.map((a) =>
                a.id === id ? { ...a, status: 'CANCELLED', cancelled_reason: reason } : a
            )
        );
        setCancelId(null);
        success('Cita cancelada correctamente.');
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-petwell-light via-white to-blue-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-petwell-navy">📅 Mis Citas</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Gestiona tus citas veterinarias
                        </p>
                    </div>
                    <Link
                        href="/appointments/new"
                        className="inline-flex items-center gap-2 bg-petwell-blue text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-petwell-navy transition-colors shadow-md"
                    >
                        <span>+</span>
                        Agendar nueva cita
                    </Link>
                </div>

                {/* Filters */}
                <div className="card-glass p-4 rounded-2xl mb-6 flex flex-wrap gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'ALL')}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-petwell-navy focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-petwell-navy focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                    />
                    {(filterStatus !== 'ALL' || filterDate) && (
                        <button
                            onClick={() => { setFilterStatus('ALL'); setFilterDate(''); }}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner size={48} text="Cargando tus citas..." />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 animate-fade-in">
                        <p className="text-5xl mb-4">📋</p>
                        <h2 className="text-xl font-bold text-petwell-navy mb-2">
                            {appointments.length === 0
                                ? 'No tienes citas registradas'
                                : 'Sin resultados para los filtros seleccionados'}
                        </h2>
                        <p className="text-gray-500 text-sm mb-6">
                            {appointments.length === 0
                                ? 'Agenda tu primera cita con un veterinario de confianza.'
                                : 'Intenta cambiar los filtros.'}
                        </p>
                        {appointments.length === 0 && (
                            <Link
                                href="/appointments/new"
                                className="inline-flex items-center gap-2 bg-petwell-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-petwell-navy transition-colors"
                            >
                                Agendar primera cita
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filtered.map((appt) => (
                            <AppointmentCard
                                key={appt.id}
                                appointment={appt}
                                showCancelButton
                                onCancel={setCancelId}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Cancel modal */}
            {cancelId && (
                <CancelModal
                    appointmentId={cancelId}
                    onConfirm={handleCancel}
                    onClose={() => setCancelId(null)}
                />
            )}

            <Toast toasts={toasts} onDismiss={dismiss} />
        </main>
    );
}
