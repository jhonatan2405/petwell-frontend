'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { getToken } from '@/utils/auth';
import { getVaccinations, createVaccination } from '@/services/ehrService';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import type { Vaccination, VaccinationRequest } from '@/types';

// ─── constants ────────────────────────────────────────────────────────────────

const COMMON_VACCINES = [
    'Rabia',
    'Parvovirus',
    'Moquillo (Distemper)',
    'Rinotraqueitis Felina',
    'Panleucopenia',
    'Leptospirosis',
    'Bordetella',
    'Leucemia Felina',
    'Calicivirus',
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function isUpcoming(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
}

function isOverdue(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
}

// ─── Blank form ───────────────────────────────────────────────────────────────

const BLANK: Omit<VaccinationRequest, 'pet_id'> = {
    vaccine_name: '',
    application_date: new Date().toISOString().slice(0, 10),
    next_due_date: '',
    batch_number: '',
    notes: '',
};

// ─── VaccinationCard ─────────────────────────────────────────────────────────

function VaccinationCard({ v }: { v: Vaccination }) {
    const upcoming = isUpcoming(v.next_due_date);
    const overdue = isOverdue(v.next_due_date);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-petwell-navy">{v.vaccine_name}</h3>
                {overdue && (
                    <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        ⚠ Vencida
                    </span>
                )}
                {!overdue && upcoming && (
                    <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        ⏰ Próxima
                    </span>
                )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Aplicación</span>
                    <p className="text-petwell-navy font-medium">{formatDate(v.application_date)}</p>
                </div>
                <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Próxima dosis</span>
                    <p className={`font-medium ${overdue ? 'text-red-500' : upcoming ? 'text-amber-600' : 'text-petwell-navy'}`}>
                        {v.next_due_date ? formatDate(v.next_due_date) : '—'}
                    </p>
                </div>
                {v.batch_number && (
                    <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Lote</span>
                        <p className="text-petwell-navy font-medium">{v.batch_number}</p>
                    </div>
                )}
            </div>
            {v.notes && (
                <p className="text-xs text-gray-500 mt-1 italic">{v.notes}</p>
            )}
        </div>
    );
}

// ─── Vaccination Form ─────────────────────────────────────────────────────────

function VaccinationForm({
    petId,
    token,
    onCreated,
    onCancel,
}: {
    petId: string;
    token: string;
    onCreated: (v: Vaccination) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState(BLANK);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (key: keyof typeof form, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.vaccine_name.trim()) { setError('El nombre de la vacuna es requerido.'); return; }
        if (!form.application_date) { setError('La fecha de aplicación es requerida.'); return; }

        setLoading(true);
        setError(null);
        try {
            const payload: VaccinationRequest = {
                pet_id: petId,
                vaccine_name: form.vaccine_name.trim(),
                application_date: form.application_date,
                ...(form.next_due_date && { next_due_date: form.next_due_date }),
                ...(form.batch_number && { batch_number: form.batch_number.trim() }),
                ...(form.notes && { notes: form.notes.trim() }),
            };
            const created = await createVaccination(payload, token);
            onCreated(created);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al registrar vacuna.');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm text-petwell-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-petwell-blue/30 focus:border-petwell-blue transition-all hover:border-petwell-blue/50 disabled:opacity-60";
    const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

    return (
        <form onSubmit={handleSubmit} noValidate className="card-glass p-6 space-y-4 animate-slide-up">
            <h2 className="text-base font-extrabold text-petwell-navy">💉 Registrar nueva vacuna</h2>

            {error && <Alert type="error" message={error} />}

            {/* Vaccine name — datalist for common options */}
            <div>
                <label htmlFor="vac-name" className={labelCls}>Vacuna *</label>
                <input
                    id="vac-name"
                    list="vaccine-list"
                    value={form.vaccine_name}
                    onChange={e => set('vaccine_name', e.target.value)}
                    placeholder="Ej: Rabia, Parvovirus…"
                    disabled={loading}
                    required
                    className={inputCls}
                />
                <datalist id="vaccine-list">
                    {COMMON_VACCINES.map(v => <option key={v} value={v} />)}
                </datalist>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="vac-date" className={labelCls}>Fecha de aplicación *</label>
                    <input
                        id="vac-date"
                        type="date"
                        value={form.application_date}
                        onChange={e => set('application_date', e.target.value)}
                        disabled={loading}
                        required
                        className={inputCls}
                    />
                </div>
                <div>
                    <label htmlFor="vac-next" className={labelCls}>Próxima dosis</label>
                    <input
                        id="vac-next"
                        type="date"
                        value={form.next_due_date}
                        onChange={e => set('next_due_date', e.target.value)}
                        disabled={loading}
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Batch */}
            <div>
                <label htmlFor="vac-batch" className={labelCls}>Número de lote</label>
                <input
                    id="vac-batch"
                    value={form.batch_number}
                    onChange={e => set('batch_number', e.target.value)}
                    placeholder="Ej: LOT-2024-001"
                    disabled={loading}
                    className={inputCls}
                />
            </div>

            {/* Notes */}
            <div>
                <label htmlFor="vac-notes" className={labelCls}>Observaciones</label>
                <textarea
                    id="vac-notes"
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    rows={2}
                    placeholder="Reacciones, observaciones, etc."
                    disabled={loading}
                    className={inputCls}
                />
            </div>

            <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" loading={loading} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar vacuna'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VaccinationsPage() {
    const params = useParams();
    const petId = params?.id as string;
    const { token } = useAuthContext();

    const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const { user } = useAuthContext();
    const canCreate = user?.role === 'CLINIC_ADMIN' || user?.role === 'VETERINARIO';
    useEffect(() => {
        if (!petId) return;
        const jwt = token ?? getToken();
        if (!jwt) return;

        getVaccinations(petId, jwt)
            .then(data => setVaccinations(data))
            .catch(err => setError(err.message ?? 'Error al cargar vacunas.'))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [petId]);

    const handleCreated = (v: Vaccination) => {
        setVaccinations(prev => [v, ...prev]);
        setShowForm(false);
        setSuccessMsg(`✅ Vacuna "${v.vaccine_name}" registrada correctamente.`);
        setTimeout(() => setSuccessMsg(null), 5000);
    };

    // Sort: overdue first, then by application_date desc
    const sorted = [...vaccinations].sort((a, b) => {
        if (isOverdue(a.next_due_date) && !isOverdue(b.next_due_date)) return -1;
        if (!isOverdue(a.next_due_date) && isOverdue(b.next_due_date)) return 1;
        return new Date(b.application_date).getTime() - new Date(a.application_date).getTime();
    });

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 px-4 py-10">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div className="animate-fade-in flex items-center justify-between">
                    <Link href={`/pets/${petId}`} className="text-sm font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">
                        ← Volver a la mascota
                    </Link>
                </div>

                <div className="card-glass p-6 animate-slide-up">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-xl font-extrabold text-petwell-navy">💉 Vacunas</h1>
                            <p className="text-sm text-gray-400 mt-0.5">Historial completo de inmunizaciones</p>
                        </div>
                        {canCreate && !showForm && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => { setShowForm(true); setSuccessMsg(null); }}
                            >
                                + Registrar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Success banner */}
                {successMsg && (
                    <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 animate-fade-in">
                        {successMsg}
                    </div>
                )}

                {/* New vaccination form */}
                {canCreate && showForm && (
                    <VaccinationForm
                        petId={petId}
                        token={token ?? getToken() ?? ''}
                        onCreated={handleCreated}
                        onCancel={() => setShowForm(false)}
                    />
                )}

                {/* Vaccination list */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <LoadingSpinner size={44} text="Cargando vacunas..." />
                    </div>
                ) : error ? (
                    <Alert type="error" message={error} />
                ) : sorted.length === 0 ? (
                    <div className="card-glass p-10 text-center animate-fade-in">
                        <p className="text-3xl mb-3">💉</p>
                        <p className="text-sm font-semibold text-petwell-navy">Sin vacunas registradas</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {canCreate
                                ? 'Haz clic en "Registrar" para agregar la primera vacuna.'
                                : 'Aún no se han registrado vacunas para esta mascota.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Summary cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                                <p className="text-2xl font-extrabold text-petwell-navy">{sorted.length}</p>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">Total</p>
                            </div>
                            <div className="bg-white rounded-2xl border border-amber-100 p-4 text-center shadow-sm">
                                <p className="text-2xl font-extrabold text-amber-600">
                                    {sorted.filter(v => isUpcoming(v.next_due_date) && !isOverdue(v.next_due_date)).length}
                                </p>
                                <p className="text-xs text-amber-600 font-medium mt-0.5">Próximas 30d</p>
                            </div>
                            <div className="bg-white rounded-2xl border border-red-100 p-4 text-center shadow-sm">
                                <p className="text-2xl font-extrabold text-red-500">
                                    {sorted.filter(v => isOverdue(v.next_due_date)).length}
                                </p>
                                <p className="text-xs text-red-500 font-medium mt-0.5">Vencidas</p>
                            </div>
                        </div>

                        {/* Cards */}
                        {sorted.map(v => (
                            <VaccinationCard key={v.id} v={v} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
