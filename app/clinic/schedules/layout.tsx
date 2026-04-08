import RoleGuard from '@/components/auth/RoleGuard';

export default function ClinicSchedulesLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['CLINIC_ADMIN']} redirectTo="/dashboard">
            {children}
        </RoleGuard>
    );
}
