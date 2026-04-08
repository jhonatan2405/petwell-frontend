'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { getToken } from '@/utils/auth';
import { getClinicConsents, grantClinicAccess, revokeClinicAccess } from '@/services/ehrService';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import type { EhrConsentEntry } from '@/types';

export default function ClinicConsentPage() {
    const params = useParams();
    const router = useRouter();
    const petId = params?.id as string;
    const { token } = useAuthContext();

    const [consents, setConsents] = useState<EhrConsentEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showAddForm, setShowAddForm] = useState(false);
    const [clinicIdToGrant, setClinicIdToGrant] = useState('');
    const [granting, setGranting] = useState(false);
    const [grantError, setGrantError] = useState<string | null>(null);
    const [grantSuccess, setGrantSuccess] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const loadConsents = async () => {
        const jwt = token ?? getToken();
        if (!jwt) return;
        setLoading(true);
        try {
            const res = await getClinicConsents(petId, jwt);
            setConsents(res.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar consentimientos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (petId) loadConsents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [petId]);

    const handleGrant = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const trimmed = clinicIdToGrant.trim();
        if (!trimmed) {
            setGrantError('Por favor ingresa el ID de la clínica.');
            return;
        }

        const jwt = token ?? getToken();
        if (!jwt) return;

        setGranting(true);
        setGrantError(null);
        setGrantSuccess(null);

        try {
            await grantClinicAccess(petId, trimmed, jwt);
            setGrantSuccess('✅ Acceso concedido exitosamente.');
            setClinicIdToGrant('');
            setShowAddForm(false);
            await loadConsents();
        } catch (err) {
            setGrantError(err instanceof Error ? err.message : 'Error al conceder acceso.');
        } finally {
            setGranting(false);
        }
    };

    const handleRevoke = async (clinicId: string) => {
        const jwt = token ?? getToken();
        if (!jwt) return;

        setRevokingId(clinicId);
        try {
            await revokeClinicAccess(petId, clinicId, jwt);
            setConsents(prev => prev.filter(c => c.clinic_id !== clinicId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al revocar acceso.');
        } finally {
            setRevokingId(null);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 px-4 py-10">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm animate-fade-in">
                    <Link href={`/pets/${petId}/ehr`} className="font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">
                        ← Volver al historial
                    </Link>
                </div>

                {/* Header */}
                <div className="card-glass p-6 animate-slide-up">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-petwell-navy flex items-center gap-2">
                                🏥 Consentimientos
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Gestiona qué clínicas veterinarias pueden acceder al historial de tu mascota.</p>
                        </div>
                        {!showAddForm && (
                            <button
                                onClick={() => { setShowAddForm(true); setGrantSuccess(null); setGrantError(null); }}
                                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-petwell-blue text-white text-sm font-semibold hover:bg-petwell-teal transition-colors shadow-sm whitespace-nowrap"
                            >
                                + Conceder acceso
                            </button>
                        )}
                    </div>
                </div>

                {/* Formularios e información de éxito/error */}
                {grantSuccess && <Alert type="success" message={grantSuccess} onClose={() => setGrantSuccess(null)} />}
                {grantError && <Alert type="error" message={grantError} onClose={() => setGrantError(null)} />}
                {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

                {showAddForm && (
                    <div className="card-glass p-6 animate-slide-up border-2 border-petwell-teal/30">
                        <h2 className="text-lg font-bold text-petwell-navy mb-1">Añadir nueva clínica</h2>
                        <p className="text-xs text-gray-500 mb-4">La clínica podrá ver el historial y registrar nuevas consultas.</p>
                        
                        <form onSubmit={handleGrant} className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="ID de la clínica"
                                value={clinicIdToGrant}
                                onChange={e => { setClinicIdToGrant(e.target.value); setGrantError(null); }}
                                disabled={granting}
                                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm text-petwell-navy focus:border-petwell-teal focus:ring-2 focus:ring-petwell-teal/30 outline-none transition-all disabled:opacity-60"
                            />
                            <div className="flex gap-2">
                                <Button type="submit" variant="secondary" loading={granting} disabled={granting}>
                                    Añadir
                                </Button>
                                <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); setClinicIdToGrant(''); }}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lista de consentimientos */}
                {loading ? (
                    <div className="card-glass p-12 flex justify-center">
                        <LoadingSpinner size={40} text="Cargando clínicas autorizadas..." />
                    </div>
                ) : consents.length === 0 ? (
                    <div className="card-glass p-10 text-center animate-slide-up">
                        <div className="text-5xl mb-3">🛡️</div>
                        <h3 className="text-lg font-bold text-petwell-navy mb-1">Tu historial es privado</h3>
                        <p className="text-sm text-gray-500">Actualmente ninguna otra clínica tiene acceso. Concede permisos para que tu veterinario pueda revisar y agregar diagnósticos.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {consents.map(consent => (
                            <div key={consent.clinic_id} className="card-glass p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up hover:shadow-md transition-shadow">
                                <div>
                                    <h3 className="text-base font-bold text-petwell-navy">{consent.clinic_name ?? 'Clínica Veterinaria'}</h3>
                                    <p className="text-xs text-gray-400 mt-1">ID: {consent.clinic_id}</p>
                                    <p className="text-xs font-semibold text-emerald-600 mt-1 gap-1 flex items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                        Acceso activo desde {new Date(consent.granted_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleRevoke(consent.clinic_id)}
                                    disabled={revokingId === consent.clinic_id}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                                >
                                    {revokingId === consent.clinic_id ? 'Revocando...' : 'Revocar acceso'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
