'use client';

import type { AppointmentStatus } from '@/types';

const STATUS_CONFIG: Record<
    AppointmentStatus,
    { label: string; className: string }
> = {
    PENDING: {
        label: 'Pendiente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    PENDING_PAYMENT: {
        label: '⏳ Pendiente de pago',
        className: 'bg-orange-100 text-orange-800 border-orange-300',
    },
    PROCESSING_PAYMENT: {
        label: '🔄 Procesando',
        className: 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse',
    },
    CONFIRMED: {
        label: 'Confirmada',
        className: 'bg-green-100 text-green-800 border-green-200',
    },
    CANCELLED: {
        label: 'Cancelada',
        className: 'bg-red-100 text-red-800 border-red-200',
    },
    COMPLETED: {
        label: 'Completada',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
    },
    NO_SHOW: {
        label: 'No asistió',
        className: 'bg-orange-100 text-orange-800 border-orange-200',
    },
};

interface StatusBadgeProps {
    status: AppointmentStatus;
    size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] ?? {
        label: status,
        className: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    return (
        <span
            className={`inline-flex items-center border font-semibold rounded-full ${config.className} ${
                size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1'
            }`}
        >
            {config.label}
        </span>
    );
}
