'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { getToken } from '@/utils/auth';
import { getEhrById, deleteEhr } from '@/services/ehrService';
import { formatVisitDate } from '@/utils/ehr';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import type { EhrRecord } from '@/types';

// ─── Componente para mostrar campos sensibles ────────────────────────────────
function SecureField({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
        <div className="bg-petwell-light/30 rounded-xl p-4 border border-petwell-blue/10">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-petwell-navy">{label}</span>
                <span className="flex items-center gap-1 text-xs text-petwell-teal font-medium bg-white px-2 py-0.5 rounded-full shadow-sm border border-petwell-teal/20">
                    🔒 Cifrado
                </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
        </div>
    );
}

export default function EhrDetailPage() {
    const params = useParams();
    const router = useRouter();
    const petId = params?.id as string;
    const ehrId = params?.ehrId as string;
    const { token, user } = useAuthContext();

    // Puede eliminar solo el veterinario
    const role = user?.role ?? '';
    const canDelete = role === 'VETERINARIO';

    const [record, setRecord] = useState<EhrRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (!ehrId) return;
        const jwt = token ?? getToken();
        if (!jwt) { router.replace('/login'); return; }
        getEhrById(ehrId, jwt)
            .then(data => {
                if (!data) { setError('Registro no encontrado.'); return; }
                setRecord(data);
            })
            .catch(err => setError(err.message ?? 'Error al cargar el registro.'))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ehrId]);

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        const jwt = token ?? getToken();
        if (!jwt || !record) return;

        setDeleting(true);
        try {
            await deleteEhr(record.id, jwt);
            router.push(`/pets/${petId}/ehr`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar el registro.');
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingSpinner size={52} text="Cargando detalle..." />
            </div>
        );
    }

    if (error || !record) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <Alert type="error" message={error ?? 'Registro no encontrado.'} />
                    <Link href={`/pets/${petId}/ehr`} className="mt-4 inline-block text-sm font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">
                        ← Volver al historial
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 px-4 py-10">
            <div className="max-w-xl mx-auto space-y-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm animate-fade-in">
                    <Link href={`/pets/${petId}/ehr`} className="font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">
                        ← Volver al historial
                    </Link>
                </div>

                <div className="card-glass p-8 animate-slide-up">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-petwell-blue/10 text-petwell-blue text-sm font-bold mb-3">
                                📅 {formatVisitDate(record.visit_date)}
                            </div>
                            <h1 className="text-2xl font-extrabold text-petwell-navy">Detaile de Consulta</h1>
                            {record.reason && (
                                <p className="text-lg text-gray-500 font-medium mt-1">🔖 {record.reason}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SecureField label="Diagnóstico" value={record.diagnosis} />
                        <SecureField label="Tratamiento" value={record.treatment} />
                        <SecureField label="Notas adicionales" value={record.notes} />
                        
                        {!record.diagnosis && !record.treatment && !record.notes && (
                            <p className="text-sm text-gray-400 text-center py-4">No hay datos clínicos adicionales registrados en esta consulta.</p>
                        )}
                    </div>

                    {/* Acciones */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center">
                        {canDelete ? (
                            <>
                                <Button
                                    variant="danger"
                                    loading={deleting}
                                    disabled={deleting}
                                    onClick={handleDelete}
                                    className="w-full sm:w-auto"
                                >
                                    {confirmDelete ? '¿Seguro? Esta acción es irreversible' : '🗑 Eliminar registro'}
                                </Button>
                                {confirmDelete && !deleting && (
                                    <button onClick={() => setConfirmDelete(false)} className="mt-3 text-xs font-medium text-gray-500 hover:text-gray-700">
                                        Cancelar eliminación
                                    </button>
                                )}
                            </>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Vista de solo lectura — sin permisos para eliminar</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
