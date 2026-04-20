'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
    getAppointments,
    deleteAppointment,
    changeAppointmentStatus,
} from '@/services/appointmentService';
import type { Appointment, AppointmentStatus } from '@/types';
import StatusBadge from '@/components/appointments/StatusBadge';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import CancelModal from '@/components/appointments/CancelModal';
import { Toast, useToast, friendlyError } from '@/components/appointments/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const formatDate = (date?: string) => {
    if (!date) return 'Sin fecha';
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
};

const REASON_CONFIG = {
    CONSULTA:   { label: '🟢 Consulta',   cls: 'bg-green-100 text-green-700' },
    VACUNACION: { label: '💉 Vacunación', cls: 'bg-blue-100 text-blue-700' },
    URGENCIA:   { label: '🔴 Urgencia',   cls: 'bg-red-100 text-red-600' },
} as const;

function ReasonBadge({ reasonType }: { reasonType?: string | null }) {
    if (!reasonType) return null;
    const cfg = REASON_CONFIG[reasonType as keyof typeof REASON_CONFIG];
    if (!cfg) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 bg-white border border-current">{reasonType}</span>;
    return (
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

// ─── Status transitions per current status ────────────────────────────────────
const NEXT_STATUSES: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
    PENDING: 'Pendiente',
    PENDING_PAYMENT: 'Pendiente de Pago',
    PROCESSING_PAYMENT: 'Procesando Pago',
    CONFIRMED: 'Confirmada',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'No asistió',
};

export default function ClinicAppointmentsPage() {
    const { token, user } = useAuth();
    const { toasts, dismiss, success, error: toastError } = useToast();

    const role = user?.role;
    const isVet = role === 'VETERINARIO';
    const isAdmin = role === 'CLINIC_ADMIN';

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [filterVet, setFilterVet] = useState('');
    const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'ALL'>('ALL');
    const [cancelId, setCancelId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = useCallback(async (silent = false) => {
        if (!token) return;
        if (!silent) setLoading(true);
        try {
            const params: Record<string, string> = {};
            // Vets only see their own appointments
            if (isVet && user?.id) params.veterinarian_id = user.id;
            const data = await getAppointments(token, params);
            setAppointments(data);
        } catch (err) {
            if (!silent) toastError(friendlyError(err));
        } finally {
            if (!silent) setLoading(false);
        }
    }, [token, isVet, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { 
        load();
        
        // Polling silencioso cada 15 segundos
        const interval = setInterval(() => load(true), 15000);
        return () => clearInterval(interval);
    }, [load]);

    // ─── Filters ─────────────────────────────────────────────────────────────
    const filtered = appointments.filter((a) => {
        const dateOk = !filterDate || a.appointment_date === filterDate || (a as any).date === filterDate;
        const vetOk = !filterVet ||
            (a.veterinarian_name ?? '').toLowerCase().includes(filterVet.toLowerCase());
        const statusOk = filterStatus === 'ALL' || a.status === filterStatus;
        return dateOk && vetOk && statusOk;
    });

    // ─── Status change (non-cancel) ───────────────────────────────────────────
    const handleStatusChange = async (id: string, status: AppointmentStatus) => {
        if (status === 'CANCELLED') { setCancelId(id); return; }
        try {
            await changeAppointmentStatus(id, status, undefined, token ?? undefined);
            setAppointments((prev) =>
                prev.map((a) => (a.id === id ? { ...a, status } : a))
            );
            success(`Estado actualizado: ${STATUS_LABEL[status]}`);
        } catch (err) {
            toastError(friendlyError(err));
        }
    };

    // ─── Cancel ──────────────────────────────────────────────────────────────
    const handleCancel = async (id: string, reason: string) => {
        await changeAppointmentStatus(id, 'CANCELLED', reason, token ?? undefined);
        setAppointments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: 'CANCELLED', cancelled_reason: reason } : a))
        );
        setCancelId(null);
        success('Cita cancelada.');
    };

    // ─── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await deleteAppointment(id, token ?? undefined);
            setAppointments((prev) => prev.filter((a) => a.id !== id));
            setDeleteId(null);
            success('Cita eliminada.');
        } catch (err) {
            toastError(friendlyError(err));
        } finally {
            setDeletingId(null);
        }
    };

    // ─── VET simple list view ─────────────────────────────────────────────────
    if (isVet) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-petwell-light via-white to-blue-50 py-8 px-4">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-bold text-petwell-navy mb-2">📅 Mi Agenda</h1>
                    <p className="text-gray-500 text-sm mb-6">Tus citas del día y la semana</p>

                    {/* Filter */}
                    <div className="card-glass p-3 rounded-2xl mb-6 flex gap-3 flex-wrap">
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'ALL')}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="CONFIRMED">Confirmada</option>
                            <option value="COMPLETED">Completada</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size={48} text="Cargando agenda..." />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-5xl mb-3">📋</p>
                            <p className="text-xl font-bold text-petwell-navy mb-1">
                                {appointments.length === 0
                                    ? 'No tienes citas asignadas'
                                    : 'Sin resultados'}
                            </p>
                            <p className="text-gray-400 text-sm">Intenta cambiar los filtros.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                                {filtered.sort((a, b) => `${a.appointment_date}${a.start_time}` > `${b.appointment_date}${b.start_time}` ? 1 : -1).map((appt) => {
                                const rawType = (appt as any).type || (appt as any).mode || (appt as any).category || '';
                                const isTelemedicina = rawType.toUpperCase().includes('TELE') || rawType.toUpperCase().includes('VIRTUAL');

                                // Nueva lgica de EHR compartida
                                const validEHRStatuses = ['CONFIRMED', 'IN_PROGRESS'];
                                const canRegisterEhr = isVet && appt.pet_id && validEHRStatuses.includes(appt.status as string);

                                // 🐛 Debug temporal
                                console.log('👨‍⚕️ Vet appointment:', appt, 'isTelemedicina:', isTelemedicina, 'canEHR:', canRegisterEhr);

                                    return (
                                        <AppointmentCard
                                            key={appt.id}
                                            appointment={appt as any}
                                            onStatusChange={handleStatusChange}
                                        />
                                    );
                            })}
                        </div>
                    )}
                </div>
                <Toast toasts={toasts} onDismiss={dismiss} />
            </main>
        );
    }

    // ─── ADMIN / RECEPCIONISTA full table view ────────────────────────────────
    return (
        <main className="min-h-screen bg-gradient-to-br from-petwell-light via-white to-blue-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-petwell-navy">🏥 Agenda de la Clínica</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {filtered.length} cita{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/clinic/waitlist"
                            className="px-4 py-2 rounded-xl border border-gray-200 text-petwell-navy text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                            📋 Lista de espera
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="card-glass p-4 rounded-2xl mb-5 flex flex-wrap gap-3">
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                    />
                    <input
                        type="text"
                        placeholder="Buscar veterinario..."
                        value={filterVet}
                        onChange={(e) => setFilterVet(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'ALL')}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                    >
                        <option value="ALL">Todos los estados</option>
                        {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => (
                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                    </select>
                    {(filterDate || filterVet || filterStatus !== 'ALL') && (
                        <button
                            onClick={() => { setFilterDate(''); setFilterVet(''); setFilterStatus('ALL'); }}
                            className="text-xs text-gray-400 hover:text-red-500 px-2"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner size={48} text="Cargando agenda..." />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 card-glass rounded-2xl">
                        <p className="text-5xl mb-3">📋</p>
                        <p className="text-xl font-bold text-petwell-navy mb-1">
                            {appointments.length === 0 ? 'No hay citas registradas' : 'Sin resultados para los filtros'}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            {appointments.length > 0 ? 'Intenta cambiar los filtros.' : ''}
                        </p>
                    </div>
                ) : (
                    <div className="card-glass rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-petwell-light text-petwell-navy text-xs font-bold uppercase tracking-wide">
                                        <th className="px-4 py-3 text-left">Mascota / Dueño</th>
                                        <th className="px-4 py-3 text-left">Veterinario</th>
                                        <th className="px-4 py-3 text-left">Fecha / Hora</th>
                                        <th className="px-4 py-3 text-left">Tipo</th>
                                        <th className="px-4 py-3 text-left">Estado</th>
                                        <th className="px-4 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.sort((a, b) =>
                                        `${a.appointment_date}${a.start_time}` > `${b.appointment_date}${b.start_time}` ? 1 : -1
                                    ).map((appt, i) => (
                                        <tr
                                            key={appt.id}
                                            className={`border-t border-gray-50 hover:bg-petwell-light/40 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-petwell-navy">{appt.pet_name || 'No disponible'}</p>
                                                <p className="text-xs text-gray-400">{appt.owner_name || 'No disponible'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {appt.veterinarian_name ? `Dr. ${appt.veterinarian_name}` : 'No disponible'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium">
                                                        {formatDate(appt.appointment_date)}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {appt.start_time}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {appt.type === 'PRESENCIAL' ? '🏥' : '💻'} {appt.type}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={appt.status} size="sm" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                                    {/* Ver detalle */}
                                                    <Link
                                                        href={`/appointments/${appt.id}`}
                                                        className="text-xs font-semibold text-petwell-blue hover:underline"
                                                    >
                                                        Ver
                                                    </Link>

                                                    {/* Change status dropdown */}
                                                    {NEXT_STATUSES[appt.status] && (
                                                        <select
                                                            onChange={(e) => {
                                                                if (e.target.value)
                                                                    handleStatusChange(appt.id, e.target.value as AppointmentStatus);
                                                                e.target.value = '';
                                                            }}
                                                            defaultValue=""
                                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-petwell-blue"
                                                        >
                                                            <option value="" disabled>Estado →</option>
                                                            {NEXT_STATUSES[appt.status]!.map((s) => (
                                                                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {/* Delete — CLINIC_ADMIN only */}
                                                    {isAdmin && (
                                                        deleteId === appt.id ? (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleDelete(appt.id)}
                                                                    disabled={deletingId === appt.id}
                                                                    className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                                                                >
                                                                    {deletingId === appt.id ? '...' : 'Confirmar'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteId(null)}
                                                                    className="text-xs text-gray-400 hover:underline"
                                                                >
                                                                    No
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeleteId(appt.id)}
                                                                className="text-xs font-semibold text-red-400 hover:text-red-600"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

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
