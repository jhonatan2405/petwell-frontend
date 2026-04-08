import type { EhrAuditAction } from '@/types';

// ─── Truncar campo sensible para mostrar en listas ────────────────────────────
// Reduce la exposición de datos clínicos en pantallas compartidas
export function maskSensitiveField(value?: string, maxLen = 30): string {
    if (!value) return '—';
    if (value.length <= maxLen) return value;
    return `${value.slice(0, maxLen)}…`;
}

// ─── Formatear fecha de visita ────────────────────────────────────────────────
export function formatVisitDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// ─── Badge de color por acción de auditoría ───────────────────────────────────
export function auditActionBadge(action: EhrAuditAction): {
    label: string;
    bgClass: string;
    textClass: string;
} {
    switch (action) {
        case 'VIEW':
            return { label: 'Vista', bgClass: 'bg-blue-100', textClass: 'text-blue-700' };
        case 'CREATE':
            return { label: 'Creación', bgClass: 'bg-green-100', textClass: 'text-green-700' };
        case 'UPDATE':
            return { label: 'Edición', bgClass: 'bg-amber-100', textClass: 'text-amber-700' };
        case 'DELETE':
            return { label: 'Eliminación', bgClass: 'bg-red-100', textClass: 'text-red-700' };
    }
}
