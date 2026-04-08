'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { getToken } from '@/utils/auth';
import { getAudit } from '@/services/ehrService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import type { EhrAuditEntry } from '@/types';

// ─── Configuración de acciones de auditoría ───────────────────────────────────
const actionConfig: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
    CREATE: { label: 'Creación',    icon: '➕', bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200' },
    VIEW:   { label: 'Consulta',    icon: '👁️', bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200'  },
    UPDATE: { label: 'Actualización', icon: '✏️', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    DELETE: { label: 'Eliminación', icon: '🗑️', bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200'   },
};

function getActionConfig(action: string) {
    return actionConfig[action?.toUpperCase()] ?? {
        label: action, icon: '📄',
        bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200'
    };
}

function roleLabel(role: string): string {
    const map: Record<string, string> = {
        DUENO_MASCOTA:  'Dueño',
        VETERINARIO:    'Veterinario',
        RECEPCIONISTA:  'Recepcionista',
        CLINIC_ADMIN:   'Admin. Clínica',
    };
    return map[role] ?? role;
}

const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Sin fecha válida';
    return new Date(date).toLocaleString();
};

export default function AuditLogPage() {
    const params = useParams();
    const router = useRouter();
    const petId = params?.id as string;
    const { token } = useAuthContext();

    const [logs, setLogs] = useState<EhrAuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!petId) return;
        const jwt = token ?? getToken();
        if (!jwt) { router.replace('/login'); return; }
        getAudit(petId, jwt)
            .then(res => setLogs(res.data ?? []))
            .catch(err => setError(err.message ?? 'Error al cargar el registro de auditoría.'))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [petId]);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 px-4 py-10">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm animate-fade-in">
                    <Link href={`/pets/${petId}/ehr`} className="font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">
                        ← Historial clínico
                    </Link>
                </div>

                {/* Header */}
                <div className="card-glass p-6 animate-slide-up">
                    <h1 className="text-2xl font-extrabold text-petwell-navy flex items-center gap-2">
                        📋 Registro de Auditoría
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Supervisa quién accedió al historial clínico de tu mascota y qué acciones realizó.</p>

                    {/* Leyenda de acciones */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                        {Object.entries(actionConfig).map(([key, cfg]) => (
                            <span key={key} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                <span>{cfg.icon}</span> {cfg.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

                {/* Lista */}
                {loading ? (
                    <div className="card-glass p-12 flex justify-center">
                        <LoadingSpinner size={40} text="Cargando registros de auditoría..." />
                    </div>
                ) : logs.length === 0 && !error ? (
                    <div className="card-glass p-10 text-center animate-slide-up">
                        <div className="text-5xl mb-3">🔍</div>
                        <h3 className="text-lg font-bold text-petwell-navy mb-1">Sin registros</h3>
                        <p className="text-sm text-gray-500">No hay eventos de auditoría registrados para esta mascota.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map(log => {
                            const cfg = getActionConfig(log.action);
                            const displayUser = log.actor_name || `Usuario ID: ${log.actor_id}` || 'Usuario desconocido';

                            return (
                                <div key={log.id} className={`card-glass p-5 animate-slide-up hover:shadow-md transition-shadow border-l-4 ${cfg.border}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

                                        {/* Icono + detalles limpios */}
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-2xl ${cfg.bg} border ${cfg.border}`}>
                                                {cfg.icon}
                                            </div>
                                            <div className="min-w-0 space-y-1.5 mt-0.5">
                                                <p className="text-sm text-petwell-navy">
                                                    <span className="font-bold mr-1">🧾 Acción:</span> {log.action}
                                                </p>
                                                <p className="text-sm text-petwell-navy">
                                                    <span className="font-bold mr-1">👤 Usuario:</span> {displayUser}
                                                    {log.actor_role && (
                                                        <span className="text-xs text-gray-400 ml-1">
                                                            ({roleLabel(log.actor_role)})
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-petwell-navy">
                                                    <span className="font-bold mr-1">📅 Fecha:</span> {formatDate(log.timestamp)}
                                                </p>
                                                
                                                {/* Clínica vinculada si existe */}
                                                {log.clinic_name && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        🏥 Clínica: {log.clinic_name}
                                                    </p>
                                                )}

                                                {/* Detalle de la acción */}
                                                {log.detail && (
                                                    <p className="text-xs text-gray-600 bg-gray-50 rounded px-2.5 py-1.5 mt-2 border border-gray-100 italic">
                                                        {log.detail}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* ID en esquina inferior (opcional para mantener rastro) */}
                                        <div className="text-right flex-shrink-0 self-end">
                                            <p className="text-[10px] text-gray-300">ID: {log.ehr_id?.slice(0, 8) || log.id.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
