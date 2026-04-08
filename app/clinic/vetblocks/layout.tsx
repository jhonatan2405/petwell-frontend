import RoleGuard from '@/components/auth/RoleGuard';

export default function VetBlocksLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['CLINIC_ADMIN', 'VETERINARIO', 'RECEPCIONISTA']} redirectTo="/dashboard">
            {children}
        </RoleGuard>
    );
}
