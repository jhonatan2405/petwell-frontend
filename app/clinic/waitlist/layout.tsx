import RoleGuard from '@/components/auth/RoleGuard';

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard
            allowedRoles={['CLINIC_ADMIN', 'RECEPCIONISTA']}
            redirectTo="/dashboard"
        >
            {children}
        </RoleGuard>
    );
}
