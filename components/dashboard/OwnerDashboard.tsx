import { useAuthContext } from '@/context/AuthContext';
import { ServiceCard, ComingSoonCard, DashboardSection } from './DashboardParts';

export default function OwnerDashboard() {
    const { user } = useAuthContext();
    const role = String(user?.role ?? '').trim().toUpperCase();

    if (role !== 'DUENO_MASCOTA' && role !== 'ADMIN') {
        return <div className="card-glass p-6 text-center text-red-600 font-semibold">⛔ No autorizado para este panel</div>;
    }

    return (
        <div className="space-y-8">
            {/* ─── Servicios activos ──────────────────────────────────── */}
            <DashboardSection
                title="🐾 Mis Servicios"
                subtitle="Accede a los módulos disponibles para tu cuenta"
            >
                <ServiceCard
                    href="/pets"
                    icon="🐶"
                    accent="teal"
                    title="Mis Mascotas"
                    description="Consulta, registra y gestiona el perfil de cada uno de tus animales."
                />
                <ServiceCard
                    href="/pets"
                    icon="📋"
                    accent="purple"
                    title="Historial Clínico"
                    description="Selecciona una mascota para ver su historial médico completo y gestionar permisos de acceso."
                />
                <ServiceCard
                    href="/profile"
                    icon="👤"
                    accent="blue"
                    title="Mi Perfil"
                    description="Actualiza tu información personal, contraseña y preferencias de cuenta."
                />
                <ServiceCard
                    href="/change-password"
                    icon="🔐"
                    accent="amber"
                    title="Seguridad"
                    description="Cambia tu contraseña y gestiona la seguridad de tu cuenta."
                />
            </DashboardSection>

            {/* ─── Servicios futuros ─────────────────────────────────── */}
            <DashboardSection
                title="🚀 Próximamente"
                subtitle="Nuevas funcionalidades que estarán disponibles pronto"
            >
                <ComingSoonCard
                    icon="📅"
                    title="Citas"
                    description="Agenda, consulta y gestiona citas veterinarias para tus mascotas."
                />
                <ComingSoonCard
                    icon="💊"
                    title="Recordatorios"
                    description="Recibe alertas de vacunas, desparasitaciones y controles médicos."
                />
                <ComingSoonCard
                    icon="💻"
                    title="Telemedicina"
                    description="Consultas veterinarias por videollamada desde la comodidad de tu hogar."
                />
                <ComingSoonCard
                    icon="💳"
                    title="Pagos"
                    description="Realiza pagos en línea por servicios veterinarios de forma segura."
                />
            </DashboardSection>
        </div>
    );
}
