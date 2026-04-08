'use client';

import Link from 'next/link';
import type { Appointment } from '@/types';
import StatusBadge from './StatusBadge';
import { Avatar } from '@/components/ui/Avatar';

interface AppointmentCardProps {
    appointment: Appointment;
    onCancel?: (id: string) => void;
    showCancelButton?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
    PRESENCIAL: '🏥 Presencial',
    TELEMEDICINA: '💻 Telemedicina',
};

function formatDate(dateStr?: string) {
    if (!dateStr) return 'Fecha no disponible';

    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

export default function AppointmentCard({
    appointment,
    onCancel,
    showCancelButton = false,
}: AppointmentCardProps) {
    console.log("APPOINTMENT DATA:", appointment);
    const canCancel =
        showCancelButton &&
        onCancel &&
        (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED');

    return (
        <div className="card-glass p-4 rounded-2xl flex flex-col gap-3 hover:shadow-lg transition-shadow duration-200 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    <Avatar src={appointment.clinic_logo_url} name={appointment.clinic_name || 'Clinica'} size="md" className="shadow-sm border border-gray-100" />
                    <div>
                        <p className="font-bold text-petwell-navy text-sm">
                            {appointment.clinic_name ?? `Clínica ${appointment.clinic_id.slice(0, 8)}`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                             <Avatar src={appointment.veterinarian_photo_url} name={appointment.veterinarian_name || 'Vet'} size="sm" />
                             <p className="text-xs text-gray-500 font-medium">
                                Dr. {appointment.veterinarian_name ?? appointment.veterinarian_id.slice(0, 8)}
                            </p>
                        </div>
                    </div>
                </div>
                <StatusBadge status={appointment.status} size="sm" />
            </div>

            {/* Info row */}
            <div className="grid grid-cols-2 gap-3 mt-1 text-xs">
                <div className="flex items-center gap-2 text-gray-600 font-medium">
                    <Avatar src={appointment.pet_photo_url} name={appointment.pet_name || 'Mascota'} size="sm" />
                    <span>{appointment.pet_name ?? 'Mascota'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                    <span>📅</span>
                    <span>
                        {appointment.appointment_date 
                            ? formatDate(appointment.appointment_date)
                            : 'Fecha no disponible'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                    <span>🕐</span>
                    <span>{appointment.start_time}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                    <span>{TYPE_LABELS[appointment.type] ?? appointment.type}</span>
                </div>
            </div>

            {appointment.reason && (
                <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">
                    &ldquo;{appointment.reason}&rdquo;
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 border-t border-gray-100 pt-2">
                <Link
                    href={`/appointments/${appointment.id}`}
                    className="flex-1 text-center text-xs font-semibold text-petwell-blue hover:text-petwell-navy transition-colors py-1.5 rounded-lg hover:bg-petwell-light"
                >
                    Ver detalle
                </Link>
                {canCancel && (
                    <button
                        onClick={() => onCancel!(appointment.id)}
                        className="flex-1 text-center text-xs font-semibold text-red-500 hover:text-red-700 transition-colors py-1.5 rounded-lg hover:bg-red-50"
                    >
                        Cancelar
                    </button>
                )}
            </div>
        </div>
    );
}
