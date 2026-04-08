'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { removeToken, getToken } from '@/utils/auth';
import { getClinicStaff, getClinic } from '@/services/clinicService';
import { useAuthContext } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ImageUploadBox } from '@/components/ui/ImageUploadBox';
import { uploadClinicLogo } from '@/services/clinicService';
import type { StaffMember, ClinicDetail } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRolLabel(role: string): string {
    const map: Record<string, string> = {
        VETERINARIO: 'Veterinario',
        RECEPCIONISTA: 'Recepcionista',
        CLINIC_ADMIN: 'Admin. Clínica',
        ADMIN: 'Administrador',
        DUENO_MASCOTA: 'Dueño Mascota',
    };
    return map[role] || role;
}

function getRolBadge(role: string): string {
    const map: Record<string, string> = {
        VETERINARIO: 'bg-petwell-teal/10 text-teal-700 border-petwell-teal/30',
        RECEPCIONISTA: 'bg-amber-50 text-amber-700 border-amber-200',
        CLINIC_ADMIN: 'bg-petwell-blue/10 text-petwell-blue border-petwell-blue/20',
        ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return map[role] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }: {
    label: string; value: string | number; icon: React.ReactNode; accent: string;
}) {
    return (
        <div className="card-glass p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${accent}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-extrabold text-petwell-navy">{value}</p>
            </div>
        </div>
    );
}

// ─── Fila de tabla vacía ──────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-petwell-light flex items-center justify-center mb-1">
                <svg className="w-8 h-8 text-petwell-blue/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
            <p className="text-petwell-navy font-semibold">Aún no hay personal registrado</p>
            <p className="text-sm text-gray-400 max-w-xs">Agrega veterinarios y recepcionistas a tu clínica para verlos aquí.</p>
            <Button variant="primary" size="sm" onClick={onAdd} className="mt-2">
                Agregar primer veterinario
            </Button>
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ClinicDashboardPage() {
    const router = useRouter();
    const { user, token } = useAuthContext();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [staffLoading, setStaffLoading] = useState(true);
    const [staffError, setStaffError] = useState<string | null>(null);
    const [clinic, setClinic] = useState<ClinicDetail | null>(null);
    const [clinicError, setClinicError] = useState<boolean>(false);

    // ─── Normalización de rol ──────────────────────────────────────────
    const role = String(user?.role ?? '').trim().toUpperCase();
    const isAdmin = role === 'CLINIC_ADMIN';

    useEffect(() => {
        if (!user?.clinic_id) {
            setStaffLoading(false);
            return;
        }

        // Clínica: cargar para todos los roles (info complementaria)
        loadClinic();

        // Staff: SOLO para CLINIC_ADMIN (VET y RECEPCIONISTA no tienen permiso)
        if (isAdmin) {
            loadStaff();
        } else {
            setStaffLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isAdmin]);

    const loadClinic = async () => {
        if (!user?.clinic_id) return;
        setClinicError(false);
        try {
            const jwt = token ?? getToken();
            const res = await getClinic(user.clinic_id, jwt ?? undefined);
            if (res.success && res.data) {
                setClinic(res.data);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : '';
            if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
                setClinicError(true);
            } else {
                setClinicError(true);
            }
        }
    };

    const loadStaff = async () => {
        // ─── Protección por rol: solo CLINIC_ADMIN puede cargar staff ────────
        if (!isAdmin) {
            console.warn('[PetWell] loadStaff bloqueado: rol', role, 'no tiene permiso');
            return;
        }
        if (!user?.clinic_id) {
            console.warn('[PetWell] loadStaff abortado: clinic_id es undefined');
            return;
        }

        setStaffLoading(true);
        setStaffError(null);
        try {
            const jwt = token ?? getToken();
            const staffList = await getClinicStaff(user.clinic_id, jwt ?? undefined);
            setStaff(staffList);
        } catch (err) {
            // ─── Silenciar 403 para evitar errores rojos innecesarios ──────
            const msg = err instanceof Error ? err.message : '';
            if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
                console.warn('[PetWell] 403 al cargar staff — permisos insuficientes');
                setStaffError(null);
            } else {
                console.error('[PetWell] Error cargando personal:', err);
                setStaffError('No se pudo cargar el personal. Intenta de nuevo.');
            }
        } finally {
            setStaffLoading(false);
        }
    };

    const handleLogout = () => {
        removeToken();
        router.push('/login');
    };

    const handleAddVet = () => router.push('/clinic-dashboard/add-veterinarian');

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 px-4 py-10">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── Encabezado ──────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-petwell-navy">
                            Panel de <span className="text-gradient-petwell">Clínica</span>
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Administra tu clínica veterinaria en PetWell.</p>
                        {user?.clinic_id && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 border border-petwell-light rounded-xl shadow-sm">
                                <span className="text-base leading-none">🏥</span>
                                <span className="text-sm font-semibold text-petwell-navy">
                                    Clínica: {clinicError ? 'No se pudo cargar la información de la clínica' : (clinic ? (clinic.clinic_name || (clinic as any).name || 'No disponible') : 'Cargando...')}
                                </span>
                            </div>
                        )}
                    </div>
                    {isAdmin && (
                        <div className="flex items-center gap-3">
                            <Link href="/clinic-dashboard/add-veterinarian">
                                <Button variant="primary" size="sm">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Agregar veterinario
                                </Button>
                            </Link>
                            <Link href="/clinic-dashboard/add-receptionist">
                                <Button variant="secondary" size="sm">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Agregar Recepcionista
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* ── Banner ───────────────────────────────────────────────────── */}
                <div className="gradient-petwell rounded-2xl p-7 text-white shadow-lg animate-slide-up">
                    <div className="flex items-center gap-4">
                        <ImageUploadBox
                            currentImageUrl={clinic?.logo_url}
                            name={clinic?.clinic_name || clinic?.admin_name || 'Clinica'}
                            disabled={!isAdmin}
                            onUpload={async (file) => {
                                const jwt = token ?? getToken();
                                if (!jwt || !user?.clinic_id) return;
                                try {
                                    await uploadClinicLogo(user.clinic_id, jwt, file);
                                    await loadClinic();
                                } catch (error: any) {
                                    alert(error.message || 'Error al subir el logo');
                                }
                            }}
                        />
                        <div>
                            <h2 className="text-xl font-extrabold mb-1">¡Bienvenido al Panel de tu Clínica!</h2>
                            <p className="text-white/80 text-sm">Desde aquí puedes gestionar tu equipo de veterinarios y los servicios de tu clínica.</p>
                        </div>
                    </div>
                </div>

                {/* ── Info de la Clínica (horarios / especialidades) ────────────────── */}
                {(clinic?.opening_hours || clinic?.specialties) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
                        {clinic.opening_hours && (
                            <div className="card-glass p-5 flex items-start gap-4">
                                <div className="w-11 h-11 bg-petwell-teal/10 text-petwell-teal rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Horarios de atención</p>
                                    <p className="text-sm font-medium text-petwell-navy whitespace-pre-line">{clinic.opening_hours}</p>
                                </div>
                            </div>
                        )}
                        {clinic.specialties && (
                            <div className="card-glass p-5 flex items-start gap-4">
                                <div className="w-11 h-11 bg-petwell-blue/10 text-petwell-blue rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Especialidades</p>
                                    <p className="text-sm font-medium text-petwell-navy">{clinic.specialties}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Stats (solo CLINIC_ADMIN) ──────────────────────────────── */}
                {isAdmin && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
                        <StatCard
                            label="Total personal"
                            value={staffLoading ? '—' : staff.length}
                            accent="bg-petwell-blue/10 text-petwell-blue"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Veterinarios"
                            value={staffLoading ? '—' : staff.filter(s => s.role === 'VETERINARIO').length}
                            accent="bg-petwell-teal/10 text-teal-600"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Recepcionistas"
                            value={staffLoading ? '—' : staff.filter(s => s.role === 'RECEPCIONISTA').length}
                            accent="bg-amber-50 text-amber-600"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            }
                        />
                    </div>
                )}

                {/* ── Sección: Personal veterinario (solo CLINIC_ADMIN) ───────── */}
                {isAdmin && <section className="animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-petwell-navy">Equipo de la Clínica</h2>
                        <Button variant="outline" size="sm" onClick={loadStaff}
                            className="text-petwell-blue border-petwell-blue/30 hover:bg-petwell-blue hover:text-white">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Actualizar
                        </Button>
                    </div>

                    <div className="card-glass overflow-hidden">
                        {!user?.clinic_id && !staffLoading ? (
                            <div className="p-6">
                                <Alert type="error" message="No se encontró el ID de clínica en tu perfil. Intenta cerrar sesión e ingresar de nuevo." />
                            </div>
                        ) : staffLoading ? (
                            <div className="flex items-center justify-center py-14">
                                <LoadingSpinner size={40} text="Cargando personal..." />
                            </div>
                        ) : staffError ? (
                            <div className="p-6">
                                <Alert type="error" message={staffError} />
                                <div className="mt-4 flex justify-center">
                                    <Button variant="outline" size="sm" onClick={loadStaff}>Reintentar</Button>
                                </div>
                            </div>
                        ) : staff.length === 0 ? (
                            // Fallback visual cuando no hay personal registrado
                            <EmptyState onAdd={handleAddVet} />
                        ) : (
                            <>
                                {/* Tabla escritorio */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-petwell-light/50">
                                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
                                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Teléfono</th>
                                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
                                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Licencia</th>
                                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Registro</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {staff.map((member) => (
                                                <tr key={member.id} className="hover:bg-petwell-light/40 transition-colors duration-150">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 gradient-petwell rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <span className="text-white text-xs font-bold">
                                                                    {member.name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('')}
                                                                </span>
                                                            </div>
                                                            <span className="font-semibold text-petwell-navy">{member.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">{member.email}</td>
                                                    <td className="px-6 py-4 text-gray-500">{member.phone || '—'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRolBadge(member.role)}`}>
                                                            {getRolLabel(member.role)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {member.role === 'VETERINARIO' && member.license_number ? (
                                                            <span className="font-mono text-xs bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-600">
                                                                {member.license_number}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300 text-xs">—</span>
                                                        )}
                                                    </td>
                                                <td className="px-6 py-4 text-gray-400 text-xs">
                                                    {member.created_at ? formatDate(member.created_at) : '—'}
                                                </td>
                                            </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Lista móvil */}
                                <div className="sm:hidden divide-y divide-gray-50">
                                    {staff.map((member) => (
                                        <div key={member.id} className="p-4 flex items-start gap-3">
                                            <div className="w-10 h-10 gradient-petwell rounded-xl flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-xs font-bold">
                                                    {member.name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('')}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-petwell-navy text-sm">{member.name}</p>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getRolBadge(member.role)}`}>
                                                        {getRolLabel(member.role)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5 truncate">{member.email}</p>
                                                {member.phone && <p className="text-xs text-gray-400 mt-0.5">Tel: {member.phone}</p>}
                                                {member.role === 'VETERINARIO' && member.license_number && (
                                                    <p className="text-xs text-gray-400 mt-0.5">Lic: <span className="font-mono">{member.license_number}</span></p>
                                                )}
                                            {member.created_at && (
                                                <p className="text-xs text-gray-300 mt-0.5">{formatDate(member.created_at)}</p>
                                            )}
                                        </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer tabla */}
                                <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-petwell-light/30">
                                    <p className="text-xs text-gray-400">{staff.length} {staff.length === 1 ? 'miembro' : 'miembros'} registrados</p>
                                </div>
                            </>
                        )}
                    </div>
                </section>}

                {/* ── Acciones rápidas ─────────────────────────────────────────── */}
                <section className="animate-slide-up">
                    <h2 className="text-lg font-bold text-petwell-navy mb-4">Acciones rápidas</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link href="/clinic-dashboard/pets"
                            className="card-glass p-5 flex items-center gap-4 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                            <div className="w-11 h-11 bg-petwell-teal/10 text-petwell-teal rounded-xl flex items-center justify-center group-hover:bg-petwell-teal group-hover:text-white transition-all duration-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M4.5 11.5A2.5 2.5 0 017 9V7a2.5 2.5 0 00-5 0v2a2.5 2.5 0 002.5 2.5zm15 0A2.5 2.5 0 0022 9V7a2.5 2.5 0 00-5 0v2a2.5 2.5 0 002.5 2.5zM12 14a4 4 0 100-8 4 4 0 000 8zm-6.5 5.5a6.5 6.5 0 0113 0" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-petwell-navy text-sm">🐾 Ver mascotas</p>
                                <p className="text-xs text-gray-400">Mascotas de tu clínica</p>
                            </div>
                        </Link>
                        {isAdmin && (
                            <Link href="/clinic-dashboard/add-veterinarian"
                                className="card-glass p-5 flex items-center gap-4 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                                <div className="w-11 h-11 bg-petwell-blue/10 text-petwell-blue rounded-xl flex items-center justify-center group-hover:bg-petwell-blue group-hover:text-white transition-all duration-200">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-petwell-navy text-sm">Agregar veterinario</p>
                                    <p className="text-xs text-gray-400">Registrar nuevo staff</p>
                                </div>
                            </Link>
                        )}
                        {isAdmin && (
                            <Link href="/clinic-dashboard/add-receptionist"
                                className="card-glass p-5 flex items-center gap-4 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                                <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-petwell-navy text-sm">Agregar Recepcionista</p>
                                    <p className="text-xs text-gray-400">Registrar recepcionista</p>
                                </div>
                            </Link>
                        )}
                        <Link href="/profile"
                            className="card-glass p-5 flex items-center gap-4 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                            <div className="w-11 h-11 bg-petwell-teal/10 text-petwell-teal rounded-xl flex items-center justify-center group-hover:bg-petwell-teal group-hover:text-white transition-all duration-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-petwell-navy text-sm">Mi Perfil</p>
                                <p className="text-xs text-gray-400">Ver mi cuenta</p>
                            </div>
                        </Link>
                        <Link href="/change-password"
                            className="card-glass p-5 flex items-center gap-4 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                            <div className="w-11 h-11 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-petwell-navy text-sm">Cambiar Contraseña</p>
                                <p className="text-xs text-gray-400">Actualizar acceso</p>
                            </div>
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
