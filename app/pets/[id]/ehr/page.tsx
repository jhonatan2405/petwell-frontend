'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { getToken } from '@/utils/auth';
import { getEhrByPet, getPermissions, grantPermission, revokePermission } from '@/services/ehrService';
import { getClinics } from '@/services/clinicService';
import { formatVisitDate, maskSensitiveField } from '@/utils/ehr';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import type { EhrRecord, EhrConsentEntry, Clinic } from '@/types';

export default function EhrListPage() {
    const params = useParams();
    const router = useRouter();
    const petId = params?.id as string;
    const { token, user } = useAuthContext();

    // ─── Permisos por rol ─────────
    const role = user?.role ?? '';
    const isOwner      = role === 'DUENO_MASCOTA';
    const isVet        = role === 'VETERINARIO';
    const isClinic     = ['CLINIC_ADMIN', 'VETERINARIO', 'RECEPCIONISTA'].includes(role);
    const isReceptionist = role === 'RECEPCIONISTA';
    const canCreate    = isVet;   // solo veterinarios pueden crear consultas

    // ─── Estado: registros EHR ────────────────────────────────────────────────
    const [records, setRecords] = useState<EhrRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [noAccess, setNoAccess] = useState(false);

    // ─── Estado: permisos / consentimiento ───────────────────────────────────
    const [consents, setConsents] = useState<EhrConsentEntry[]>([]);
    const [consentsLoading, setConsentsLoading] = useState(false);
    const [showConsentSection, setShowConsentSection] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [clinicIdInput, setClinicIdInput] = useState('');
    const [granting, setGranting] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [consentMsg, setConsentMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ─── Estado: clínicas disponibles para el selector de consentimiento ───────────
    const [clinicsList, setClinicsList] = useState<Clinic[]>([]);
    const [clinicsLoading, setClinicsLoading] = useState(false);

    // ─── Carga de registros clínicos ──────────────────────────────────────────
    useEffect(() => {
        if (!petId) return;
        const jwt = token ?? getToken();
        if (!jwt) { router.replace('/login'); return; }
        getEhrByPet(petId, jwt)
            .then(setRecords)
            .catch(err => {
                const msg: string = err?.message ?? '';
                const is403 = msg.includes('403') || msg.toLowerCase().includes('forbidden');
                if (is403) {
                    if (isOwner) {
                        setRecords([]);
                    } else {
                        setNoAccess(true);
                        setRecords([]);
                        setError(null);
                    }
                } else {
                    setError(msg || 'Error al cargar el historial clínico.');
                }
            })
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [petId]);

    // ─── Carga de permisos (solo para OWNER cuando despliega la sección) ──────
    const loadConsents = async () => {
        const jwt = token ?? getToken();
        if (!jwt) return;
        setConsentsLoading(true);
        setConsentMsg(null);
        try {
            const res = await getPermissions(petId, jwt);
            setConsents(res.data ?? []);
        } catch (err) {
            setConsentMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error al cargar permisos.' });
        } finally {
            setConsentsLoading(false);
        }
    };

    const handleToggleConsent = () => {
        if (!showConsentSection) {
            loadConsents();
            // Cargar lista de clínicas solo cuando se abre el panel por primera vez
            if (clinicsList.length === 0) {
                setClinicsLoading(true);
                const jwt = token ?? getToken();
                getClinics(jwt ?? undefined)
                    .then(setClinicsList)
                    .catch(() => {/* silencioso */})
                    .finally(() => setClinicsLoading(false));
            }
        }
        setShowConsentSection(v => !v);
    };

    const handleGrant = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const trimmed = clinicIdInput.trim();
        if (!trimmed) { setConsentMsg({ type: 'error', text: 'Ingresa un ID de clínica.' }); return; }
        const jwt = token ?? getToken();
        if (!jwt) return;
        setGranting(true);
        setConsentMsg(null);
        try {
            await grantPermission(petId, trimmed, jwt);
            setConsentMsg({ type: 'success', text: '✅ Acceso concedido exitosamente.' });
            setClinicIdInput('');
            setShowAddForm(false);
            await loadConsents();
        } catch (err) {
            setConsentMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error al conceder acceso.' });
        } finally {
            setGranting(false);
        }
    };

    const handleRevoke = async (clinicId: string) => {
        const jwt = token ?? getToken();
        if (!jwt) return;
        setRevokingId(clinicId);
        setConsentMsg(null);
        try {
            await revokePermission(petId, clinicId, jwt);
            setConsents(prev => prev.filter(c => c.clinic_id !== clinicId));
            setConsentMsg({ type: 'success', text: '✅ Acceso revocado.' });
        } catch (err) {
            setConsentMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error al revocar acceso.' });
        } finally {
            setRevokingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingSpinner size={52} text="Cargando historial clínico..." />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 px-4 py-10">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* ─── Breadcrumb ─────────────────────────────────────── */}
                <div className="flex items-center gap-2 text-sm animate-fade-in">
                    <Link href="/pets" className="font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">Mis mascotas</Link>
                    <span className="text-gray-400">/</span>
                    <Link href={`/pets/${petId}`} className="font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">Detalle</Link>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-500">Historial clínico</span>
                </div>

                {/* ─── Header ──────────────────────────────────────────── */}
                <div className="card-glass p-6 animate-slide-up">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-petwell-navy">📋 Historial Clínico</h1>
                            <p className="text-sm text-gray-400 mt-1">Consultas y tratamientos registrados de tu mascota</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                            {/* 🏥 Consentimientos: solo visible para OWNER */}
                            {isOwner && (
                                <button
                                    onClick={handleToggleConsent}
                                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${showConsentSection ? 'border-petwell-blue bg-petwell-blue text-white' : 'border-petwell-blue/30 text-petwell-blue hover:bg-petwell-blue hover:text-white'}`}
                                >
                                    🏥 Consentimientos
                                </button>
                            )}
                            <Link
                                href={`/pets/${petId}/ehr/audit`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition-all"
                            >
                                🔍 Auditoría
                            </Link>
                            {/* Nueva consulta: solo VETERINARIO */}
                            {canCreate && (
                                <Link
                                    href={`/pets/${petId}/ehr/add`}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-petwell-teal text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
                                >
                                    + Nueva consulta
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Banner seguridad ────────────────────────────────── */}
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 animate-fade-in">
                    <span className="text-xl">🔒</span>
                    <span>Los registros están <strong>cifrados y protegidos</strong>. Solo tú y las clínicas autorizadas pueden acceder.</span>
                </div>

                {/* ─── Banner: owner (informativo, no de error) */}
                {isOwner && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-petwell-blue/5 border border-petwell-blue/20 rounded-xl text-sm text-petwell-navy animate-fade-in">
                        <span className="text-xl">📌</span>
                        <span>El historial clínico solo puede ser <strong>creado y gestionado por profesionales veterinarios</strong>.</span>
                    </div>
                )}

                {/* ─── Banner: personal clínica sin permiso de escritura */}
                {isClinic && !isVet && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 animate-fade-in">
                        <span className="text-xl">⚠️</span>
                        <span>
                            {isReceptionist
                                ? <><strong>Modo solo lectura</strong>: no tienes permisos para modificar registros clínicos.</>
                                : <>Solo el <strong>personal autorizado</strong> puede modificar registros clínicos.</>
                            }
                        </span>
                    </div>
                )}

                {/* ─── SECCIÓN CONSENTIMIENTO (solo OWNER) ─────────────── */}
                {isOwner && showConsentSection && (
                    <div className="card-glass p-6 animate-slide-up border-2 border-petwell-blue/20">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-extrabold text-petwell-navy">🏥 Clínicas con acceso</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Gestiona qué clínicas pueden ver y registrar consultas.</p>
                            </div>
                            {!showAddForm && (
                                <button
                                    onClick={() => { setShowAddForm(true); setConsentMsg(null); }}
                                    className="text-sm font-semibold text-petwell-blue hover:text-petwell-teal transition-colors flex items-center gap-1"
                                >
                                    <span className="text-lg leading-none">+</span> Añadir
                                </button>
                            )}
                        </div>

                        {/* Mensajes de éxito/error del consentimiento */}
                        {consentMsg && (
                            <div className={`mb-3 text-sm rounded-xl px-4 py-2.5 border ${consentMsg.type === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
                                {consentMsg.text}
                            </div>
                        )}

                        {/* Formulario: añadir clínica */}
                        {showAddForm && (
                            <form onSubmit={handleGrant} className="flex flex-col gap-3 mb-4 pt-3 border-t border-gray-100">
                                {clinicsLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <LoadingSpinner size={16} />
                                        <span>Cargando clínicas...</span>
                                    </div>
                                ) : (
                                    <select
                                        value={clinicIdInput}
                                        onChange={e => { setClinicIdInput(e.target.value); setConsentMsg(null); }}
                                        disabled={granting}
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm text-petwell-navy bg-white focus:border-petwell-teal focus:ring-2 focus:ring-petwell-teal/30 outline-none transition-all disabled:opacity-60"
                                    >
                                        <option value="">-- Selecciona una clínica --</option>
                                        {clinicsList
                                            .filter(c => !consents.some(p => p.clinic_id === c.id))
                                            .length === 0 ? (
                                                <option disabled value="">No hay clínicas disponibles</option>
                                            ) : clinicsList
                                            .filter(c => !consents.some(p => p.clinic_id === c.id))
                                            .map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.clinic_name ?? (c as any).name ?? c.id}
                                                </option>
                                            ))
                                        }
                                    </select>
                                )}
                                <div className="flex gap-2">
                                    <Button type="submit" variant="secondary" loading={granting} disabled={granting || !clinicIdInput}>Añadir</Button>
                                    <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); setClinicIdInput(''); }}>Cancelar</Button>
                                </div>
                            </form>
                        )}

                        {/* Lista de clínicas con acceso */}
                        {consentsLoading ? (
                            <div className="py-6 flex justify-center">
                                <LoadingSpinner size={32} text="Cargando permisos..." />
                            </div>
                        ) : consents.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-4xl mb-2">🛡️</p>
                                <p className="text-sm font-semibold text-petwell-navy">Tu historial es privado</p>
                                <p className="text-xs text-gray-500 mt-1">Ninguna clínica tiene acceso actualmente.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {consents.map(consent => (
                                    <li key={consent.clinic_id} className="flex items-center justify-between py-3 gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-petwell-navy truncate">
                                                {consent.clinic_name ?? 'Clínica veterinaria'}
                                            </p>
                                            <p className="text-xs text-gray-400">ID: {consent.clinic_id}</p>
                                            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                                Desde {new Date(consent.granted_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRevoke(consent.clinic_id)}
                                            disabled={revokingId === consent.clinic_id}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                                        >
                                            {revokingId === consent.clinic_id ? 'Revocando...' : 'Revocar'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* ─── Pantalla de Sin Acceso (403 Consentimiento Requerido) ──────── */}
                {noAccess && !isOwner && (
                    <div className="card-glass p-12 text-center animate-slide-up border-2 border-amber-200 bg-amber-50/50 mt-6">
                        <div className="text-6xl mb-4">🔐</div>
                        <h2 className="text-xl font-bold text-amber-900 mb-2">Acceso Restringido</h2>
                        <p className="text-amber-800 text-sm mb-6 max-w-md mx-auto">
                            Esta clínica aún no tiene permisos para acceder al historial clínico de esta mascota.
                        </p>
                        <p className="text-amber-700/80 text-xs font-medium bg-amber-100/50 inline-block px-4 py-2 rounded-lg">
                            💡 El dueño debe autorizar el acceso desde su panel de mascotas.
                        </p>
                    </div>
                )}

                {/* ─── Error principal: solo para personal clínico, nunca para el dueño */}
                {error && !isOwner && <Alert type="error" message={error} onClose={() => setError(null)} />}

                {/* ─── Lista de registros ──────────────────────────────── */}
                {!noAccess && records.length === 0 && !error && !isOwner ? (
                    <div className="card-glass p-12 text-center animate-slide-up">
                        <div className="text-6xl mb-4">{isOwner ? '🧾' : '🩺'}</div>
                        <h2 className="text-xl font-bold text-petwell-navy mb-2">No hay registros clínicos aún</h2>
                        {isOwner ? (
                            <p className="text-gray-400 text-sm">
                                💡 Cuando un veterinario registre una consulta para tu mascota, aparecerá aquí.
                            </p>
                        ) : (
                            <>
                                <p className="text-gray-400 text-sm mb-6">Aún no hay consultas registradas para esta mascota.</p>
                                {canCreate && (
                                    <Link
                                        href={`/pets/${petId}/ehr/add`}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-petwell-teal text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-sm"
                                    >
                                        + Registrar primera consulta
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {records.map(record => (
                            <div key={record.id} className="card-glass p-5 animate-slide-up hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold text-petwell-blue bg-petwell-blue/10 px-2.5 py-1 rounded-full">
                                                📅 {formatVisitDate(record.visit_date)}
                                            </span>
                                        </div>
                                        {record.reason && (
                                            <p className="text-sm font-semibold text-petwell-navy mb-1 truncate">
                                                🔖 {record.reason}
                                            </p>
                                        )}
                                        {record.diagnosis && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                <span className="text-petwell-teal">🔒</span>
                                                <span className="font-medium text-gray-600">Diagnóstico:</span>
                                                {maskSensitiveField(record.diagnosis)}
                                            </p>
                                        )}
                                    </div>
                                    <Link
                                        href={`/pets/${petId}/ehr/${record.id}`}
                                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-petwell-blue text-white text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
                                    >
                                        Ver detalle →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
