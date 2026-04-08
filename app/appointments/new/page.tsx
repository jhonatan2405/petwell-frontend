'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getPets } from '@/services/petService';
import { getClinics } from '@/services/clinicService';
import { getAvailability, createAppointment } from '@/services/appointmentService';
import type { Pet, Clinic, AvailabilitySlot, AppointmentType, AppointmentReasonType } from '@/types';
import SlotPicker from '@/components/appointments/SlotPicker';
import { Toast, useToast, friendlyError } from '@/components/appointments/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

// ─── Step labels (4 steps) ───────────────────────────────────────────────────
const STEP_LABELS = ['Mascota', 'Clínica', 'Fecha y Slot', 'Confirmar'];

export default function NewAppointmentPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const { toasts, dismiss, error: toastError } = useToast();

    // Redirect clinic staff away from the owner-only booking flow
    useEffect(() => {
        if (user && user.role !== 'DUENO_MASCOTA') {
            router.replace('/clinic/appointments');
        }
    }, [user, router]);

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Step 1 — Pet
    const [pets, setPets] = useState<Pet[]>([]);
    const [petsLoading, setPetsLoading] = useState(true);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

    // Step 2 — Clinic
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [clinicsLoading, setClinicsLoading] = useState(false);
    const [clinicFilter, setClinicFilter] = useState('');
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

    // Step 3 — Date + Slots (backend assigns vet)
    const [selectedDate, setSelectedDate] = useState('');
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

    // Step 4 — Confirm
    const [appointmentType, setAppointmentType] = useState<AppointmentType>('PRESENCIAL');
    const [reasonType, setReasonType] = useState<AppointmentReasonType>('CONSULTA');
    const [reason, setReason] = useState('');

    // Validation
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ─── Load pets on mount ───────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        setPetsLoading(true);
        getPets(token)
            .then((data) => setPets(data))
            .catch(() => toastError('Error cargando tus mascotas.'))
            .finally(() => setPetsLoading(false));
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Load clinics when entering step 2 ───────────────────────────────────
    useEffect(() => {
        if (step !== 2 || clinics.length > 0) return;
        setClinicsLoading(true);
        getClinics(token ?? undefined)
            .then((data) => setClinics(data))
            .catch(() => toastError('Error cargando clínicas.'))
            .finally(() => setClinicsLoading(false));
    }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Load slots when clinic + date are ready (step 3) ────────────────────
    // Only fetch when both are set — no vetblocks call needed
    const loadSlots = useCallback(async () => {
        if (!selectedClinic || !selectedDate) return;
        setSlotsLoading(true);
        setSelectedSlot(null);
        try {
            // veterinarianId is omitted → backend calculates all available slots
            const data = await getAvailability(
                selectedClinic.id,
                selectedDate,
                undefined,
                token ?? undefined
            );
            setSlots(data);
        } catch {
            toastError('Error cargando horarios disponibles.');
            setSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    }, [selectedClinic, selectedDate, token]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (step === 3 && selectedClinic && selectedDate) {
            loadSlots();
        }
    }, [step, selectedDate, loadSlots]);

    // ─── Reset slots when date changes ────────────────────────────────────────
    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        setSlots([]);
        setSelectedSlot(null);
        setErrors((prev) => ({ ...prev, date: '', slot: '' }));
    };

    // ─── Validation per step ─────────────────────────────────────────────────
    function validate(): boolean {
        const e: Record<string, string> = {};
        if (step === 1 && !selectedPet) e.pet = 'Selecciona una mascota';
        if (step === 2 && !selectedClinic) e.clinic = 'Selecciona una clínica';
        if (step === 3) {
            if (!selectedDate) e.date = 'La fecha es obligatoria';
            if (!selectedSlot) e.slot = 'Selecciona un horario disponible';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    const nextStep = () => { if (validate()) setStep((s) => s + 1); };
    const prevStep = () => { setErrors({}); setStep((s) => s - 1); };

    // ─── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!selectedPet || !selectedClinic || !selectedDate || !selectedSlot) return;
        setSubmitting(true);
        try {
            await createAppointment(
                {
                    pet_id: selectedPet.id,
                    clinic_id: selectedClinic.id,
                    veterinarian_id: selectedSlot.veterinarian_id ?? '',
                    appointment_date: selectedDate,
                    start_time: selectedSlot.start_time,
                    end_time: selectedSlot.end_time,
                    type: appointmentType,
                    reason_type: reasonType,
                    reason: reason || undefined,
                },
                token ?? undefined
            );
            router.push('/appointments?success=1');
        } catch (err) {
            toastError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredClinics = clinics.filter(
        (c) =>
            c.clinic_name.toLowerCase().includes(clinicFilter.toLowerCase()) ||
            (c.specialties ?? '').toLowerCase().includes(clinicFilter.toLowerCase())
    );

    const progress = ((step - 1) / (STEP_LABELS.length - 1)) * 100;

    return (
        <main className="min-h-screen bg-gradient-to-br from-petwell-light via-white to-blue-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-sm text-petwell-blue hover:text-petwell-navy mb-4 flex items-center gap-1"
                    >
                        ← Volver
                    </button>
                    <h1 className="text-2xl font-bold text-petwell-navy">🗓️ Agendar Nueva Cita</h1>

                    {/* Progress */}
                    <div className="mt-5">
                        <div className="flex justify-between mb-1">
                            {STEP_LABELS.map((label, i) => (
                                <span
                                    key={label}
                                    className={`text-xs font-semibold ${
                                        i + 1 === step
                                            ? 'text-petwell-blue'
                                            : i + 1 < step
                                            ? 'text-petwell-teal'
                                            : 'text-gray-300'
                                    }`}
                                >
                                    {i + 1 < step ? '✓ ' : ''}{label}
                                </span>
                            ))}
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-petwell-blue to-petwell-teal rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Card */}
                <div className="card-glass p-6 rounded-2xl animate-fade-in">

                    {/* ── Paso 1: Mascota ── */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-lg font-bold text-petwell-navy mb-4">
                                🐾 Paso 1 — Selecciona tu mascota
                            </h2>
                            {petsLoading ? (
                                <LoadingSpinner size={40} text="Cargando mascotas..." />
                            ) : pets.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-4xl mb-2">🐾</p>
                                    <p className="text-gray-500 text-sm">No tienes mascotas registradas.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {pets.map((pet) => (
                                        <button
                                            key={pet.id}
                                            onClick={() => { setSelectedPet(pet); setErrors({}); }}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                                                selectedPet?.id === pet.id
                                                    ? 'border-petwell-blue bg-petwell-light'
                                                    : 'border-gray-100 hover:border-petwell-blue/40'
                                            }`}
                                        >
                                            <p className="text-2xl mb-1">
                                                {pet.species === 'DOG' ? '🐶' : pet.species === 'CAT' ? '🐱' : '🐾'}
                                            </p>
                                            <p className="font-semibold text-petwell-navy text-sm">{pet.name}</p>
                                            <p className="text-xs text-gray-500">{pet.breed ?? pet.species}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {errors.pet && <p className="text-red-500 text-xs mt-2">{errors.pet}</p>}
                        </div>
                    )}

                    {/* ── Paso 2: Clínica ── */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-lg font-bold text-petwell-navy mb-4">
                                🏥 Paso 2 — Selecciona una clínica
                            </h2>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o especialidad..."
                                value={clinicFilter}
                                onChange={(e) => setClinicFilter(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                            />
                            {clinicsLoading ? (
                                <LoadingSpinner size={40} text="Cargando clínicas..." />
                            ) : filteredClinics.length === 0 ? (
                                <p className="text-center text-gray-500 text-sm py-6">
                                    No se encontraron clínicas.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                                    {filteredClinics.map((clinic) => (
                                        <button
                                            key={clinic.id}
                                            onClick={() => { setSelectedClinic(clinic); setErrors({}); }}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                                                selectedClinic?.id === clinic.id
                                                    ? 'border-petwell-blue bg-petwell-light'
                                                    : 'border-gray-100 hover:border-petwell-blue/40'
                                            }`}
                                        >
                                            <p className="font-semibold text-petwell-navy text-sm">{clinic.clinic_name}</p>
                                            <p className="text-xs text-gray-500">
                                                {clinic.address ?? ''}{clinic.city ? `, ${clinic.city}` : ''}
                                            </p>
                                            {clinic.specialties && (
                                                <p className="text-xs text-petwell-teal mt-1">{clinic.specialties}</p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {errors.clinic && <p className="text-red-500 text-xs mt-2">{errors.clinic}</p>}
                        </div>
                    )}

                    {/* ── Paso 3: Fecha + Slots ── */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-lg font-bold text-petwell-navy mb-4">
                                🕐 Paso 3 — Selecciona fecha y horario
                            </h2>

                            {/* Date picker */}
                            <div className="mb-5">
                                <label className="block text-sm font-semibold text-petwell-navy mb-1">
                                    Fecha <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    min={todayISO()}
                                    value={selectedDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                                />
                                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                            </div>

                            {/* Slots */}
                            {selectedDate && (
                                <div>
                                    <label className="block text-sm font-semibold text-petwell-navy mb-2">
                                        Horario disponible <span className="text-red-500">*</span>
                                    </label>
                                    <SlotPicker
                                        slots={slots}
                                        selected={selectedSlot?.start_time ?? null}
                                        onSelect={(slot) => {
                                            setSelectedSlot(slot);
                                            setErrors((prev) => ({ ...prev, slot: '' }));
                                        }}
                                        loading={slotsLoading}
                                    />
                                    {errors.slot && (
                                        <p className="text-red-500 text-xs mt-2">{errors.slot}</p>
                                    )}
                                    {/* Vet name shown if backend returns it */}
                                    {selectedSlot?.veterinarian_name && (
                                        <p className="text-xs text-petwell-teal mt-3">
                                            👨‍⚕️ Dr. {selectedSlot.veterinarian_name}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Paso 4: Confirmar ── */}
                    {step === 4 && (
                        <div>
                            <h2 className="text-lg font-bold text-petwell-navy mb-4">
                                ✅ Paso 4 — Confirmar cita
                            </h2>

                            <div className="bg-petwell-light rounded-xl p-4 mb-5 space-y-2 text-sm">
                                <Row icon="🐾" label="Mascota" value={selectedPet?.name ?? '—'} />
                                <Row icon="🏥" label="Clínica" value={selectedClinic?.clinic_name ?? '—'} />
                                {selectedSlot?.veterinarian_name && (
                                    <Row icon="👨‍⚕️" label="Veterinario" value={`Dr. ${selectedSlot.veterinarian_name}`} />
                                )}
                                <Row icon="📅" label="Fecha" value={selectedDate} />
                                <Row icon="🕐" label="Hora" value={selectedSlot ? `${selectedSlot.start_time} - ${selectedSlot.end_time}` : '—'} />
                            </div>

                            {/* Tipo de motivo */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-petwell-navy mb-2">
                                    Motivo de la cita
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {([
                                        { value: 'CONSULTA',   label: '🟢 Consulta',   cls: 'border-green-400 bg-green-50 text-green-800' },
                                        { value: 'VACUNACION', label: '💉 Vacunación',  cls: 'border-blue-400 bg-blue-50 text-blue-800' },
                                        { value: 'URGENCIA',   label: '🔴 Urgencia',   cls: 'border-red-400 bg-red-50 text-red-800' },
                                    ] as { value: AppointmentReasonType; label: string; cls: string }[]).map(({ value, label, cls }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setReasonType(value)}
                                            className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                                reasonType === value
                                                    ? cls
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tipo de consulta */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-petwell-navy mb-1">
                                    Modalidad
                                </label>
                                <div className="flex gap-3">
                                    {(['PRESENCIAL', 'TELEMEDICINA'] as AppointmentType[]).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setAppointmentType(t)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                                                appointmentType === t
                                                    ? 'border-petwell-blue bg-petwell-blue text-white'
                                                    : 'border-gray-200 text-gray-600 hover:border-petwell-blue/40'
                                            }`}
                                        >
                                            {t === 'PRESENCIAL' ? '🏥 Presencial' : '💻 Telemedicina'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-semibold text-petwell-navy mb-1">
                                    Notas adicionales (opcional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe el motivo de la consulta..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-petwell-blue"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full bg-petwell-blue text-white py-3 rounded-xl font-bold text-sm hover:bg-petwell-navy transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Agendando...
                                    </>
                                ) : (
                                    '🗓️ Confirmar cita'
                                )}
                            </button>
                        </div>
                    )}

                    {/* Navigation */}
                    {step < 4 && (
                        <div className="flex gap-3 mt-6 border-t border-gray-100 pt-4">
                            {step > 1 && (
                                <button
                                    onClick={prevStep}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-petwell-navy text-sm font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    ← Anterior
                                </button>
                            )}
                            <button
                                onClick={nextStep}
                                className="flex-1 py-2.5 rounded-xl bg-petwell-blue text-white text-sm font-semibold hover:bg-petwell-navy transition-colors"
                            >
                                {step === 3 ? 'Revisar →' : 'Siguiente →'}
                            </button>
                        </div>
                    )}

                    {step === 4 && (
                        <button
                            onClick={prevStep}
                            className="w-full mt-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
                        >
                            ← Modificar selección
                        </button>
                    )}
                </div>
            </div>

            <Toast toasts={toasts} onDismiss={dismiss} />
        </main>
    );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1.5">
                <span>{icon}</span> {label}
            </span>
            <span className="font-semibold text-petwell-navy">{value}</span>
        </div>
    );
}
