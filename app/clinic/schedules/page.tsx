'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
} from '@/services/appointmentService';
import type { ClinicSchedule, DayOfWeek, ScheduleRequest } from '@/types';
import { DAY_OF_WEEK_MAP } from '@/types';
import { Toast, useToast, friendlyError } from '@/components/appointments/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const DAYS: { key: DayOfWeek; label: string }[] = [
    { key: 'MONDAY', label: 'Lunes' },
    { key: 'TUESDAY', label: 'Martes' },
    { key: 'WEDNESDAY', label: 'Miércoles' },
    { key: 'THURSDAY', label: 'Jueves' },
    { key: 'FRIDAY', label: 'Viernes' },
    { key: 'SATURDAY', label: 'Sábado' },
    { key: 'SUNDAY', label: 'Domingo' },
];

interface ScheduleForm {
    start_time: string;
    end_time: string;
    is_active: boolean;
}

export default function ClinicSchedulesPage() {
    const { token, user } = useAuth();
    const { toasts, dismiss, success, error: toastError } = useToast();

    const [schedules, setSchedules] = useState<ClinicSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [editDay, setEditDay] = useState<DayOfWeek | null>(null);
    const [form, setForm] = useState<ScheduleForm>({ start_time: '08:00', end_time: '18:00', is_active: true });
    const [saving, setSaving] = useState(false);

    const clinicId = user?.clinic_id ?? '';

    const load = useCallback(async () => {
        if (!token || !clinicId) return;
        setLoading(true);
        try {
            const data = await getSchedules(clinicId, token);
            setSchedules(data);
        } catch (err) {
            toastError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, [token, clinicId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { load(); }, [load]);

    const getScheduleForDay = (day: DayOfWeek) =>
        schedules.find((s) => s.day_of_week === DAY_OF_WEEK_MAP[day]);

    const openEdit = (day: DayOfWeek) => {
        const existing = getScheduleForDay(day);
        setForm({
            start_time: existing?.start_time ?? '08:00',
            end_time: existing?.end_time ?? '18:00',
            is_active: existing?.is_active ?? true,
        });
        setEditDay(day);
    };

    const handleSave = async () => {
        if (!clinicId || !editDay) return;
        setSaving(true);
        try {
            const existing = getScheduleForDay(editDay);
            const payload: ScheduleRequest = {
                day_of_week: DAY_OF_WEEK_MAP[editDay],
                start_time: form.start_time,
                end_time: form.end_time,
                is_active: form.is_active,
            };
            if (existing) {
                await updateSchedule(existing.id, payload, token ?? undefined);
            } else {
                await createSchedule(payload, token ?? undefined);
            }
            await load();
            setEditDay(null);
            success('Horario guardado correctamente.');
        } catch (err) {
            toastError(friendlyError(err));
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (schedule: ClinicSchedule) => {
        try {
            await updateSchedule(
                schedule.id,
                { is_active: !schedule.is_active },
                token ?? undefined
            );
            setSchedules((prev) =>
                prev.map((s) =>
                    s.id === schedule.id ? { ...s, is_active: !s.is_active } : s
                )
            );
            success(`${schedule.is_active ? 'Dia desactivado' : 'Día activado'}.`);
        } catch (err) {
            toastError(friendlyError(err));
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteSchedule(id, token ?? undefined);
            setSchedules((prev) => prev.filter((s) => s.id !== id));
            success('Horario eliminado.');
        } catch (err) {
            toastError(friendlyError(err));
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
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-petwell-navy mb-2">🕐 Horarios de la Clínica</h1>
                <p className="text-gray-500 text-sm mb-6">
                    Configura los horarios de apertura y cierre por día de la semana.
                </p>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner size={48} text="Cargando horarios..." />
                    </div>
                ) : (
                    <div className="card-glass rounded-2xl overflow-hidden">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-petwell-light text-petwell-navy text-xs font-bold uppercase tracking-wide">
                                    <th className="px-4 py-3 text-left">Día</th>
                                    <th className="px-4 py-3 text-left">Apertura</th>
                                    <th className="px-4 py-3 text-left">Cierre</th>
                                    <th className="px-4 py-3 text-center">Activo</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DAYS.map(({ key, label }) => {
                                    const sched = getScheduleForDay(key);
                                    return (
                                        <tr key={key} className="border-t border-gray-50 hover:bg-petwell-light/30 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-petwell-navy">{label}</td>
                                            <td className="px-4 py-3 text-gray-600">{sched?.start_time ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{sched?.end_time ?? '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                {sched ? (
                                                    <button
                                                        onClick={() => handleToggle(sched)}
                                                        className={`w-10 h-5 rounded-full transition-colors relative ${
                                                            sched.is_active ? 'bg-petwell-teal' : 'bg-gray-200'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                                                sched.is_active ? 'left-5' : 'left-0.5'
                                                            }`}
                                                        />
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300 text-xs">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() => openEdit(key)}
                                                        className="text-xs font-semibold text-petwell-blue hover:underline"
                                                    >
                                                        {sched ? 'Editar' : 'Agregar'}
                                                    </button>
                                                    {sched && (
                                                        <button
                                                            onClick={() => handleDelete(sched.id)}
                                                            className="text-xs font-semibold text-red-400 hover:text-red-600"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="card-glass w-full max-w-sm mx-4 p-6 rounded-2xl shadow-2xl">
                        <h2 className="text-lg font-bold text-petwell-navy mb-4">
                            Horario — {DAYS.find((d) => d.key === editDay)?.label}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-petwell-navy mb-1">Hora apertura</label>
                                <input
                                    type="time"
                                    value={form.start_time}
                                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-petwell-navy mb-1">Hora cierre</label>
                                <input
                                    type="time"
                                    value={form.end_time}
                                    onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                                    className="accent-petwell-blue"
                                />
                                Día activo
                            </label>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setEditDay(null)}
                                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2 rounded-xl bg-petwell-blue text-white text-sm font-bold disabled:opacity-60"
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Toast toasts={toasts} onDismiss={dismiss} />
        </main>
    );
}
