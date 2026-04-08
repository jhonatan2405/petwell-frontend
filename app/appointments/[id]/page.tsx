'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getAppointmentById, changeAppointmentStatus } from '@/services/appointmentService';
import { downloadEhrPdf } from '@/services/ehrService';
import type { Appointment } from '@/types';
import StatusBadge from '@/components/appointments/StatusBadge';
import CancelModal from '@/components/appointments/CancelModal';
import { Toast, useToast, friendlyError } from '@/components/appointments/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Avatar } from '@/components/ui/Avatar';

function InfoRow({ label, value, avatarSrc }: { label: string; value?: string | null; avatarSrc?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex justify-between py-3 border-b border-gray-50 last:border-0 items-center">
            <span className="text-sm text-gray-500">{label}</span>
            <div className="flex items-center gap-2">
                {avatarSrc !== undefined && (
                    <Avatar src={avatarSrc} name={value} size="sm" />
                )}
                <span className="text-sm font-semibold text-petwell-navy text-right">
                    {value}
                </span>
            </div>
        </div>
    );
}

const REASON_CONFIG = {
    CONSULTA:   { label: '🟢 Consulta',   cls: 'bg-green-100 text-green-700' },
    VACUNACION: { label: '💉 Vacunación', cls: 'bg-blue-100 text-blue-700' },
    URGENCIA:   { label: '🔴 Urgencia',   cls: 'bg-red-100 text-red-600' },
} as const;

function ReasonBadge({ reasonType }: { reasonType?: string | null }) {
    if (!reasonType) return null;
    const cfg = REASON_CONFIG[reasonType as keyof typeof REASON_CONFIG];
    if (!cfg) return <span className="text-xs text-gray-400">{reasonType}</span>;
    return (
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

export default function AppointmentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token, user } = useAuth();
    const router = useRouter();
    const { toasts, dismiss, success, error: toastError } = useToast();

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    useEffect(() => {
        if (!token || !id) return;
        setLoading(true);
        getAppointmentById(id, token)
            .then((data) => {
                if (!data) setNotFound(true);
                else setAppointment(data);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [token, id]);

    const handleCancel = async (apptId: string, reason: string) => {
        await changeAppointmentStatus(apptId, 'CANCELLED', reason, token ?? undefined);
        setAppointment((prev) => prev ? { ...prev, status: 'CANCELLED', cancelled_reason: reason } : prev);
        setShowCancelModal(false);
        success('Cita cancelada correctamente.');
    };

    const role = user?.role;
    const isVet = role === 'VETERINARIO';
    const isClinicStaff = role === 'VETERINARIO' || role === 'CLINIC_ADMIN' || role === 'RECEPCIONISTA';

    // PDF download
    const [pdfLoading, setPdfLoading] = useState(false);
    const handleDownloadPdf = async () => {
        if (!appointment?.pet_id || !token) return;
        setPdfLoading(true);
        try {
            await downloadEhrPdf(appointment.pet_id, token);
        } catch (err) {
            toastError(friendlyError(err));
        } finally {
            setPdfLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size={48} text="Cargando cita..." />
            </div>
        );
    }

    if (notFound || !appointment) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-5xl mb-4">🔍</p>
                    <h2 className="text-xl font-bold text-petwell-navy mb-2">Cita no encontrada</h2>
                    <Link href="/appointments" className="text-petwell-blue text-sm hover:underline">
                        ← Volver a mis citas
                    </Link>
                </div>
            </div>
        );
    }

    const canCancel =
        role === 'DUENO_MASCOTA' &&
        (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED');

    return (
        <main className="min-h-screen bg-gradient-to-br from-petwell-light via-white to-blue-50 py-8 px-4">
            <div className="max-w-lg mx-auto">
                <button
                    onClick={() => router.back()}
                    className="text-sm text-petwell-blue hover:text-petwell-navy mb-6 flex items-center gap-1"
                >
                    ← Volver
                </button>

                <div className="card-glass p-6 rounded-2xl animate-fade-in">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h1 className="text-xl font-bold text-petwell-navy">Detalle de Cita</h1>
                            <p className="text-xs text-gray-400 mt-1">ID: {appointment.id.slice(0, 8)}...</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            <StatusBadge status={appointment.status} />
                            <ReasonBadge reasonType={appointment.reason_type} />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mb-5">
                        <InfoRow label="🐾 Mascota" value={appointment.pet_name} avatarSrc={appointment.pet_photo_url} />
                        <InfoRow label="👤 Dueño" value={appointment.owner_name} avatarSrc={appointment.owner_photo_url} />
                        <InfoRow label="🏥 Clínica" value={appointment.clinic_name} avatarSrc={appointment.clinic_logo_url} />
                        <InfoRow label="👨‍⚕️ Veterinario" value={appointment.veterinarian_name ? `Dr. ${appointment.veterinarian_name}` : undefined} avatarSrc={appointment.veterinarian_photo_url} />
                        <InfoRow label="📅 Fecha" value={appointment.appointment_date || 'Fecha no disponible'} />
                        <InfoRow label="🕐 Hora" value={appointment.start_time} />
                        <InfoRow label="🏷️ Tipo" value={appointment.type === 'PRESENCIAL' ? '🏥 Presencial' : '💻 Telemedicina'} />
                        <InfoRow label="📝 Motivo" value={appointment.reason} />
                        <InfoRow label="🗒️ Notas" value={appointment.notes} />
                        {appointment.status === 'CANCELLED' && (
                            <InfoRow label="❌ Razón de cancelación" value={appointment.cancelled_reason} />
                        )}
                    </div>

                    {/* Vet: Ver historial clínico */}
                    {isVet && (
                        <Link
                            href={`/pets/${appointment.pet_id}/ehr`}
                            className="block w-full text-center bg-petwell-teal/10 text-petwell-teal border border-petwell-teal/20 font-semibold text-sm py-2.5 rounded-xl hover:bg-petwell-teal/20 transition-colors mb-3"
                        >
                            🩺 Ver historial clínico
                        </Link>
                    )}

                    {/* Clinic staff: Register vaccination if reason_type = VACUNACION */}
                    {isVet && appointment.reason_type === 'VACUNACION' && (
                        <Link
                            href={`/pets/${appointment.pet_id}/vaccinations`}
                            className="block w-full text-center bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-sm py-2.5 rounded-xl hover:bg-blue-100 transition-colors mb-3"
                        >
                            💉 Registrar vacuna de esta cita
                        </Link>
                    )}

                    {/* Clinic staff: Download PDF */}
                    {isClinicStaff && (
                        <button
                            onClick={handleDownloadPdf}
                            disabled={pdfLoading}
                            className="block w-full text-center bg-gray-50 text-gray-700 border border-gray-200 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-100 transition-colors mb-3 disabled:opacity-50"
                        >
                            {pdfLoading ? 'Generando...' : '🧧 Descargar historial PDF'}
                        </button>
                    )}

                    {/* Vet: Status change */}
                    {isVet && (appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
                        <div className="flex gap-2 mt-3">
                            <MarkButton
                                label="✅ Completada"
                                onClick={async () => {
                                    try {
                                        await changeAppointmentStatus(appointment.id, 'COMPLETED', undefined, token ?? undefined);
                                        setAppointment((p) => p ? { ...p, status: 'COMPLETED' } : p);
                                        success('Estado actualizado.');
                                    } catch (err) { toastError(friendlyError(err)); }
                                }}
                                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            />
                            <MarkButton
                                label="⚠️ No asistió"
                                onClick={async () => {
                                    try {
                                        await changeAppointmentStatus(appointment.id, 'NO_SHOW', undefined, token ?? undefined);
                                        setAppointment((p) => p ? { ...p, status: 'NO_SHOW' } : p);
                                        success('Estado actualizado.');
                                    } catch (err) { toastError(friendlyError(err)); }
                                }}
                                className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                            />
                        </div>
                    )}

                    {/* Owner: Cancel button */}
                    {canCancel && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="w-full mt-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
                        >
                            Cancelar esta cita
                        </button>
                    )}
                </div>
            </div>

            {showCancelModal && (
                <CancelModal
                    appointmentId={appointment.id}
                    onConfirm={handleCancel}
                    onClose={() => setShowCancelModal(false)}
                />
            )}

            <Toast toasts={toasts} onDismiss={dismiss} />
        </main>
    );
}

function MarkButton({ label, onClick, className }: {
    label: string; onClick: () => void; className: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${className}`}
        >
            {label}
        </button>
    );
}
