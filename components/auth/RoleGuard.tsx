'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoleGuardProps {
    /** Lista de roles que tienen acceso a esta ruta */
    allowedRoles: (UserRole | string)[];
    /** Ruta a la que se redirige si el rol no coincide (default: /dashboard) */
    redirectTo?: string;
    /** Contenido protegido */
    children: React.ReactNode;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * RoleGuard protege rutas basándose en el rol del usuario autenticado.
 *
 * Flujo:
 *  1. Mientras AuthContext está cargando → muestra spinner.
 *  2. Sin token  → redirige a /login.
 *  3. Con token pero sin rol permitido → redirige a `redirectTo` (/dashboard).
 *  4. Rol correcto → renderiza children.
 */
export default function RoleGuard({
    allowedRoles,
    redirectTo = '/dashboard',
    children,
}: RoleGuardProps) {
    const { user, isAuthenticated, loading } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // Esperar a que AuthContext termine de hidratarse

        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        if (user && !allowedRoles.includes(user.role)) {
            // Se elimina el redireccionamiento para en su lugar mostrar la UI "No Autorizado" abajo.
        }
    }, [loading, isAuthenticated, user, allowedRoles]);

    // Mientras carga o si no hay usuario todavía, mostrar spinner
    if (loading || !isAuthenticated || !user) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingSpinner size={56} text="Verificando acceso..." />
            </div>
        );
    }

    if (user && allowedRoles.includes(user.role)) {
        return <>{children}</>;
    }

    // Usuario autenticado pero sin rol permitido → Mostrar pantalla No autorizado
    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
                <div className="card-glass max-w-md w-full p-8 text-center animate-fade-in shadow-xl">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-extrabold text-petwell-navy mb-2">Acceso No Autorizado</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        No tienes los permisos necesarios para acceder a esta página. Si crees que esto es un error, contacta al administrador de tu clínica.
                    </p>
                    <button
                        onClick={() => router.push(redirectTo)}
                        className="bg-petwell-blue text-white w-full py-3 rounded-xl font-bold hover:bg-petwell-navy transition-colors focus:ring-4 focus:ring-petwell-blue/30"
                    >
                        Volver a Inicio
                    </button>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-mono text-gray-400 bg-gray-50 py-1.5 px-3 rounded-lg inline-block">
                            Tu rol actual: <span className="font-bold text-gray-600">{user.role}</span>
                        </p>
                    </div>
                </div>
            </div>
        );
}
