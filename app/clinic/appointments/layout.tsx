import RoleGuard from '@/components/auth/RoleGuard';

export default function ClinicAppointmentsLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard
            allowedRoles={['CLINIC_ADMIN', 'RECEPCIONISTA', 'VETERINARIO']}
            redirectTo="/dashboard"
        >
            {children}
        </RoleGuard>
    );
}
