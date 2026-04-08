'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getVetBlocks,
    createVetBlock,
    updateVetBlock,
    deleteVetBlock,
} from '@/services/appointmentService';
import { getClinicStaff } from '@/services/clinicService';
import type { VetBlock, DayOfWeek, VetBlockRequest, StaffMember } from '@/types';
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
const DAY_LABEL: Record<DayOfWeek, string> = Object.fromEntries(
    DAYS.map((d) => [d.key, d.label])
) as Record<DayOfWeek, string>;

const SLOT_DURATIONS = [15, 30, 45, 60];

interface BlockForm {
    veterinarian_id: string;
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
}

const defaultForm: BlockForm = {
    veterinarian_id: '',
    day_of_week: 'MONDAY',
    start_time: '09:00',
    end_time: '13:00',
    slot_duration_minutes: 30,
};

export default function VetBlocksPage() {
    const { token, user } = useAuth();
    const { toasts, dismiss, success, error: toastError } = useToast();

    const [blocks, setBlocks] = useState<VetBlock[]>([]);
    const [vets, setVets] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<VetBlock | null>(null);
    const [form, setForm] = useState<BlockForm>(defaultForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const clinicId = user?.clinic_id ?? '';
    const isAdmin = user?.role === 'CLINIC_ADMIN';

    const load = useCallback(async () => {
        if (!token || !clinicId) return;
        setLoading(true);
        try {
            const [blockData, staffData] = await Promise.all([
                getVetBlocks(clinicId, token),
                getClinicStaff(clinicId, token),
            ]);
            setBlocks(blockData);
            setVets(staffData.filter((s) => s.role === 'VETERINARIO'));
        } catch (err) {
            toastError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, [token, clinicId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { load(); }, [load]);

    const openAdd = () => {
        setEditingBlock(null);
        setForm(defaultForm);
        setModalOpen(true);
    };

    const openEdit = (block: VetBlock) => {
        setEditingBlock(block);
        setForm({
            veterinarian_id: block.veterinarian_id,
            day_of_week: block.day_of_week,
            start_time: block.start_time,
            end_time: block.end_time,
            slot_duration_minutes: block.slot_duration_minutes,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.veterinarian_id) return;
        setSaving(true);
        try {
            const payload: VetBlockRequest = { ...form, clinic_id: clinicId };
            if (editingBlock) {
                await updateVetBlock(editingBlock.id, payload, token ?? undefined);
            } else {
                await createVetBlock(payload, token ?? undefined);
            }
            await load();
            setModalOpen(false);
            success(editingBlock ? 'Bloque actualizado.' : 'Bloque creado correctamente.');
        } catch (err) {
            toastError(friendlyError(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await deleteVetBlock(id, token ?? undefined);
            setBlocks((prev) => prev.filter((b) => b.id !== id));
            success('Bloque eliminado.');
        } catch (err) {
            toastError(friendlyError(err));
        } finally {
            setDeletingId(null);
        }
    };

    // Group blocks by vet
    const grouped = vets.reduce<Record<string, { vet: StaffMember; blocks: VetBlock[] }>>(
        (acc, vet) => ({
            ...acc,
            [vet.id]: { vet, blocks: blocks.filter((b) => b.veterinarian_id === vet.id) },
        }),
        {}
    );

    if (!clinicId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">No se encontró el ID de tu clínica.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-petwell-light via-white to-blue-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-petwell-navy">👨‍⚕️ Bloques de Veterinarios</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Configura los turnos y duración de slots por veterinario.
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={openAdd}
                            className="bg-petwell-blue text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-petwell-navy transition-colors"
                        >
                            + Agregar bloque
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner size={48} text="Cargando bloques..." />
                    </div>
                ) : vets.length === 0 ? (
                    <div className="text-center py-20 card-glass rounded-2xl">
                        <p className="text-4xl mb-3">👨‍⚕️</p>
                        <p className="text-lg font-bold text-petwell-navy mb-1">
                            No hay veterinarios en tu clínica
                        </p>
                        <p className="text-gray-400 text-sm">Agrega veterinarios desde el panel de clínica.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5">
                        {Object.values(grouped).map(({ vet, blocks: vetBlocks }) => (
                            <div key={vet.id} className="card-glass rounded-2xl overflow-hidden">
                                <div className="bg-petwell-light px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-petwell-navy">Dr. {vet.name}</p>
                                        <p className="text-xs text-gray-400">{vet.email}</p>
                                    </div>
                                    <span className="text-sm text-gray-400">
                                        {vetBlocks.length} bloque{vetBlocks.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {vetBlocks.length === 0 ? (
                                    <div className="px-5 py-4 text-sm text-gray-400 italic">
                                        Sin bloques asignados.
                                    </div>
                                ) : (
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="text-xs text-gray-500 uppercase border-b border-gray-50">
                                                <th className="px-5 py-2 text-left font-semibold">Día</th>
                                                <th className="px-5 py-2 text-left font-semibold">Inicio</th>
                                                <th className="px-5 py-2 text-left font-semibold">Fin</th>
                                                <th className="px-5 py-2 text-left font-semibold">Slot</th>
                                                <th className="px-5 py-2 text-center font-semibold">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vetBlocks.map((block) => (
                                                <tr key={block.id} className="border-t border-gray-50 hover:bg-petwell-light/20 transition-colors">
                                                    <td className="px-5 py-2.5 font-medium text-petwell-navy">
                                                        {DAY_LABEL[block.day_of_week]}
                                                    </td>
                                                    <td className="px-5 py-2.5 text-gray-600">{block.start_time}</td>
                                                    <td className="px-5 py-2.5 text-gray-600">{block.end_time}</td>
                                                    <td className="px-5 py-2.5 text-gray-600">{block.slot_duration_minutes} min</td>
                                                    <td className="px-5 py-2.5 text-center">
                                                        {isAdmin ? (
                                                            <div className="flex justify-center gap-3">
                                                                <button
                                                                    onClick={() => openEdit(block)}
                                                                    className="text-xs font-semibold text-petwell-blue hover:underline"
                                                                >
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(block.id)}
                                                                    disabled={deletingId === block.id}
                                                                    className="text-xs font-semibold text-red-400 hover:text-red-600 disabled:opacity-50"
                                                                >
                                                                    {deletingId === block.id ? '...' : 'Eliminar'}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Solo lectura</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="card-glass w-full max-w-md mx-4 p-6 rounded-2xl shadow-2xl">
                        <h2 className="text-lg font-bold text-petwell-navy mb-4">
                            {editingBlock ? 'Editar bloque' : 'Nuevo bloque de veterinario'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-petwell-navy mb-1">
                                    Veterinario <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.veterinarian_id}
                                    onChange={(e) => setForm((f) => ({ ...f, veterinarian_id: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                                >
                                    <option value="">Seleccionar veterinario</option>
                                    {vets.map((v) => (
                                        <option key={v.id} value={v.id}>Dr. {v.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-petwell-navy mb-1">Día de la semana</label>
                                <select
                                    value={form.day_of_week}
                                    onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value as DayOfWeek }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                                >
                                    {DAYS.map((d) => (
                                        <option key={d.key} value={d.key}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-petwell-navy mb-1">Hora inicio</label>
                                    <input
                                        type="time"
                                        value={form.start_time}
                                        onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-petwell-navy mb-1">Hora fin</label>
                                    <input
                                        type="time"
                                        value={form.end_time}
                                        onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-petwell-navy mb-1">Duración de slot</label>
                                <div className="flex gap-2">
                                    {SLOT_DURATIONS.map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setForm((f) => ({ ...f, slot_duration_minutes: d }))}
                                            className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                                                form.slot_duration_minutes === d
                                                    ? 'border-petwell-blue bg-petwell-blue text-white'
                                                    : 'border-gray-200 text-gray-500 hover:border-petwell-blue/40'
                                            }`}
                                        >
                                            {d}m
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.veterinarian_id}
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
