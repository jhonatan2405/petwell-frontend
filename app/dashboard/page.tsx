'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Avatar } from '@/components/ui/Avatar';
import OwnerDashboard from '@/components/dashboard/OwnerDashboard';
import ClinicAdminDashboard from '@/components/dashboard/ClinicAdminDashboard';
import VeterinarianDashboard from '@/components/dashboard/VeterinarianDashboard';
import ReceptionistDashboard from '@/components/dashboard/ReceptionistDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRolLabel(role: string): string {
    const roles: Record<string, string> = {
        ADMIN: 'Administrador',
        CLINIC_ADMIN: 'Admin. de Clínica',
        VETERINARIO: 'Veterinario',
        RECEPCIONISTA: 'Recepcionista',
        DUENO_MASCOTA: 'Dueño de Mascota',
    };
    return roles[role] || role;
}

function getRolColor(role: string): string {
    const colors: Record<string, string> = {
        ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
        CLINIC_ADMIN: 'bg-petwell-blue/10 text-petwell-blue border-petwell-blue/20',
        VETERINARIO: 'bg-petwell-teal/10 text-teal-700 border-petwell-teal/30',
        RECEPCIONISTA: 'bg-amber-50 text-amber-700 border-amber-200',
        DUENO_MASCOTA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
}

// ─── Render de Dashboard por Rol (SWITCH OBLIGATORIO) ─────────────────────────
function RoleDashboard({ role }: { role: string }) {
    switch (role) {
        case 'ADMIN':
            return <AdminDashboard />;
        case 'DUENO_MASCOTA':
            return <OwnerDashboard />;
        case 'CLINIC_ADMIN':
            return <ClinicAdminDashboard />;
        case 'VETERINARIO':
            return <VeterinarianDashboard />;
        case 'RECEPCIONISTA':
            return <ReceptionistDashboard />;
        default:
            return (
                <div className="card-glass p-8 text-center animate-slide-up">
                    <div className="text-5xl mb-3">⚠️</div>
                    <h2 className="text-lg font-bold text-petwell-navy mb-1">Rol no reconocido</h2>
                    <p className="text-sm text-gray-500">
                        Tu rol &quot;{role}&quot; no tiene un panel asignado. Contacta al administrador.
                    </p>
                </div>
            );
    }
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DashboardPage() {
    const router = useRouter();
    const { user, loading, logout } = useAuthContext();

    // ─── Normalización de rol ──────────────────────────────────────────────────
    const role = user ? String(user.role ?? '').trim().toUpperCase() : '';

    // ─── Debug logs (eliminar después de validación) ───────────────────────────
    useEffect(() => {
        if (!loading && user) {
            console.log('[PetWell Dashboard] USER:', user);
            console.log('[PetWell Dashboard] ROLE DETECTADO:', role);
        }
    }, [loading, user, role]);

    // ─── Redirigir si no hay token ─────────────────────────────────────────────
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    // ─── BLOQUEO: No renderizar NADA hasta que auth esté lista ─────────────────
    if (loading) return <LoadingSpinner />;

    if (!user) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingSpinner size={56} text="Redirigiendo al login..." />
            </div>
        );
    }

    // ─── Datos derivados (SOLO después de tener user) ──────────────────────────
    const initials = user.name
        .split(' ')
        .slice(0, 2)
        .map(n => n[0]?.toUpperCase() || '')
        .join('');

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="page-wrapper">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* ── Bienvenida ─────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
                    <div>
                        <p className="text-sm font-medium text-petwell-teal mb-0.5">{getGreeting()} 👋</p>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-petwell-navy">
                            <span className="text-gradient-petwell">{user.name.split(' ')[0]}</span>, bienvenido
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Esto es lo que está pasando en tu cuenta hoy.</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors font-medium border border-gray-200 hover:border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar sesión
                    </button>
                </div>

                {/* ── Tarjeta de perfil principal ────────────────────────────────── */}
                <div className="card-glass p-8 animate-slide-up">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <Avatar src={user.photo_url || user.clinic_logo_url} name={user.name} size="xl" className="shadow-lg border-2 border-white/40" />
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-2xl font-extrabold text-petwell-navy">{user.name}</h2>
                            <p className="text-gray-500 text-sm mt-1">{user.email}</p>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getRolColor(role)}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {getRolLabel(role)}
                                </span>
                                {user.is_active !== false && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Activo
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Miembro desde {formatDate(user.created_at)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Dashboard por rol (SWITCH — usa role normalizado) ───────────── */}
                <RoleDashboard role={role} />

                {/* ── ID de usuario ───────────────────────────────────────────────── */}
                <div className="card-glass p-5 animate-slide-up">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">ID de usuario</p>
                            <p className="font-mono text-sm text-gray-600 break-all">{user.id}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
