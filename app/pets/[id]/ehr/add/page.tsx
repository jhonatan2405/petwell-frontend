'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { getToken } from '@/utils/auth';
import { createEhr, BASE_URL } from '@/services/ehrService';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import type { EhrRequest, FormState } from '@/types';

// ─── Secure textarea component ────────────────────────────────────────────────
function SecureTextarea({
    id, label, placeholder, value, onChange, rows = 3,
}: {
    id: string;
    label: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    rows?: number;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={id} className="text-sm font-semibold text-petwell-navy">{label}</label>
                <span className="flex items-center gap-1 text-xs text-petwell-teal font-medium">
                    🔒 Cifrado
                </span>
            </div>
            <textarea
                id={id}
                rows={rows}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm text-petwell-navy placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-petwell-blue/30 focus:border-petwell-blue transition-all hover:border-petwell-blue/50"
            />
        </div>
    );
}

export default function AddEhrPage() {
    const params = useParams();
    const router = useRouter();
    const petId = params?.id as string;
    const { token, user } = useAuthContext();

    const [visitDate, setVisitDate]   = useState('');
    const [visitTime, setVisitTime]   = useState('');
    const [vetId, setVetId]           = useState('');
    const [vets, setVets]             = useState<Array<{ id: string; name: string }>>([]);
    const [reason, setReason]         = useState('');
    const [diagnosis, setDiagnosis]   = useState('');
    const [treatment, setTreatment]   = useState('');
    const [notes, setNotes]           = useState('');
    const [form, setForm]             = useState<FormState>({ loading: false, error: null, success: null });
    const [errors, setErrors]         = useState<Record<string, string>>({});

    // Load clinic staff (vets) for the selector
    useEffect(() => {
        if (!user?.clinic_id) return;
        const jwt = token ?? getToken();
        if (!jwt) return;

        fetch(`${BASE_URL}/clinics/${user.clinic_id}/staff`, {
            headers: { Authorization: `Bearer ${jwt}` },
        })
            .then(r => r.json())
            .then((body: any) => {
                console.log('[FRONTEND-EHR] Fetched staff body:', body);
                const staff: any[] = body?.data?.staff || body?.staff || (Array.isArray(body?.data) ? body.data : []);
                const vetList = staff
                    .filter((s: any) => s.role === 'VETERINARIO')
                    .map((s: any) => ({ id: s.id, name: s.name }));
                setVets(vetList);
                
                // Si la lista tiene al menos un veterinario y no se ha seleccionado nada, pre-seleccionar el primero
                if (vetList.length > 0) {
                    setVetId(user?.role === 'VETERINARIO' && user?.id ? user.id : vetList[0].id);
                }
            })
            .catch((err) => {
                console.error('[FRONTEND-EHR] Error fetching staff:', err);
            });
    }, [user, token]);

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!visitDate) e.visitDate = 'La fecha de visita es obligatoria.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;
        const jwt = token ?? getToken();
        if (!jwt) { router.replace('/login'); return; }

        const payload: EhrRequest & { clinic_id?: string } = {
            visit_date:      visitDate,
            visit_time:      visitTime.trim() || undefined,
            veterinarian_id: vetId.trim() || undefined,
            reason:          reason.trim() || undefined,
            diagnosis:       diagnosis.trim() || undefined,
            treatment:       treatment.trim() || undefined,
            notes:           notes.trim() || undefined,
            clinic_id:       user?.clinic_id,
        };

        console.log('[FRONTEND-EHR] Payload to send:', { veterinarian_id: payload.veterinarian_id, full: payload });

        setForm({ loading: true, error: null, success: null });
        try {
            const res = await createEhr(petId, payload, jwt);
            if (res.success) {
                setForm({ loading: false, error: null, success: '¡Consulta registrada correctamente!' });
                setTimeout(() => router.push(`/pets/${petId}/ehr`), 1200);
            } else {
                setForm({ loading: false, error: res.message ?? 'Error al registrar la consulta.', success: null });
            }
        } catch (err: unknown) {
            setForm({
                loading: false,
                error: err instanceof Error ? err.message : 'Error al conectar con el servidor.',
                success: null,
            });
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 px-4 py-10">
            <div className="max-w-xl mx-auto space-y-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm animate-fade-in">
                    <Link href={`/pets/${petId}/ehr`} className="font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">
                        ← Historial clínico
                    </Link>
                </div>

                {/* Header */}
                <div className="text-center animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-petwell-teal rounded-2xl shadow-lg mb-5 text-3xl">
                        🩺
                    </div>
                    <h1 className="text-3xl font-extrabold text-petwell-navy">Nueva consulta</h1>
                    <p className="text-gray-500 mt-2 text-sm">Registra los detalles de la visita veterinaria.</p>
                </div>

                {/* Privacy banner */}
                <div className="flex items-start gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 animate-fade-in">
                    <span className="text-xl mt-0.5">🔒</span>
                    <div>
                        <p className="font-semibold">Tus datos están protegidos</p>
                        <p className="text-xs text-emerald-600 mt-0.5">Los datos clínicos se almacenan de forma <strong>segura y cifrada</strong>. Solo tú y las clínicas con tu consentimiento pueden verlos.</p>
                    </div>
                </div>

                {/* Form */}
                <div className="card-glass p-8 animate-slide-up">
                    {form.error   && <div className="mb-5"><Alert type="error"   message={form.error}   onClose={() => setForm(f => ({ ...f, error: null }))} /></div>}
                    {form.success && <div className="mb-5"><Alert type="success" message={form.success} /></div>}

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">

                        {/* ── Fecha + Hora en misma fila ── */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="visit-date" className="block text-sm font-semibold text-petwell-navy mb-1.5">
                                    Fecha de visita <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="visit-date"
                                    type="date"
                                    value={visitDate}
                                    onChange={e => { setVisitDate(e.target.value); setErrors(p => ({ ...p, visitDate: '' })); }}
                                    className={`w-full px-4 py-2.5 rounded-xl border-2 bg-white text-sm text-petwell-navy focus:outline-none focus:ring-2 focus:ring-petwell-blue/30 focus:border-petwell-blue transition-all ${errors.visitDate ? 'border-red-400' : 'border-gray-200 hover:border-petwell-blue/50'}`}
                                />
                                {errors.visitDate && <p className="mt-1 text-xs text-red-500">{errors.visitDate}</p>}
                            </div>

                            <div>
                                <label htmlFor="visit-time" className="block text-sm font-semibold text-petwell-navy mb-1.5">
                                    Hora
                                </label>
                                <input
                                    id="visit-time"
                                    type="time"
                                    value={visitTime}
                                    onChange={e => setVisitTime(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm text-petwell-navy focus:outline-none focus:ring-2 focus:ring-petwell-blue/30 focus:border-petwell-blue transition-all hover:border-petwell-blue/50"
                                />
                            </div>
                        </div>

                        {/* ── Veterinario ── */}
                        {vets.length > 0 && (
                            <div>
                                <label htmlFor="vet-select" className="block text-sm font-semibold text-petwell-navy mb-1.5">
                                    Veterinario que atendió
                                </label>
                                <select
                                    id="vet-select"
                                    value={vetId}
                                    onChange={e => setVetId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm text-petwell-navy focus:outline-none focus:ring-2 focus:ring-petwell-blue/30 focus:border-petwell-blue transition-all hover:border-petwell-blue/50"
                                >
                                    <option value="">– Sin asignar –</option>
                                    {vets.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* ── Motivo ── */}
                        <div>
                            <label htmlFor="reason" className="block text-sm font-semibold text-petwell-navy mb-1.5">
                                Motivo de consulta
                            </label>
                            <input
                                id="reason"
                                type="text"
                                placeholder="Ej: Revisión anual, vacunación, herida..."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm text-petwell-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-petwell-blue/30 focus:border-petwell-blue transition-all hover:border-petwell-blue/50"
                            />
                        </div>

                        <SecureTextarea
                            id="diagnosis"
                            label="Diagnóstico"
                            placeholder="Describe el diagnóstico veterinario..."
                            value={diagnosis}
                            onChange={setDiagnosis}
                        />
                        <SecureTextarea
                            id="treatment"
                            label="Tratamiento"
                            placeholder="Medicamentos, procedimientos, dosis..."
                            value={treatment}
                            onChange={setTreatment}
                        />
                        <SecureTextarea
                            id="notes"
                            label="Notas adicionales"
                            placeholder="Observaciones, recomendaciones, seguimiento..."
                            value={notes}
                            onChange={setNotes}
                        />

                        <Button type="submit" variant="secondary" fullWidth size="lg" loading={form.loading} disabled={form.loading}>
                            {form.loading ? 'Guardando...' : '💾 Guardar consulta'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
