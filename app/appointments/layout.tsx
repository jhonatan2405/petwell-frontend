import RoleGuard from '@/components/auth/RoleGuard';

export default function AppointmentsLayout({ children }: { children: React.ReactNode }) {
    return (
        // Allow all roles that can view appointment details.
        // CLINIC_ADMIN / RECEPCIONISTA / VETERINARIO access /appointments/:id via the clinic panel.
        // DUENO_MASCOTA accesses /appointments (list) and /appointments/:id.
        <RoleGuard
            allowedRoles={['DUENO_MASCOTA', 'CLINIC_ADMIN', 'RECEPCIONISTA', 'VETERINARIO']}
            redirectTo="/dashboard"
        >
            {children}
        </RoleGuard>
    );
}
