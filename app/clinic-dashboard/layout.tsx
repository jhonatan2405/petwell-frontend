import RoleGuard from '@/components/auth/RoleGuard';

/**
 * Layout protegido para /clinic-dashboard y sus subrutas.
 * CLINIC_ADMIN: acceso completo a todo el panel.
 * VETERINARIO: acceso solo a /clinic-dashboard/pets y EHR.
 * RECEPCIONISTA: acceso solo a /clinic-dashboard/pets (lectura).
 * Cualquier otro rol autenticado es redirigido a /dashboard.
 */
export default function ClinicDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={['CLINIC_ADMIN', 'VETERINARIO', 'RECEPCIONISTA']} redirectTo="/dashboard">
            {children}
        </RoleGuard>
    );
}
