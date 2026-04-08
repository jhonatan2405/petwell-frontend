import { useAuthContext } from '@/context/AuthContext';
import { ServiceCard, ComingSoonCard, DashboardSection } from './DashboardParts';

export default function ClinicAdminDashboard() {
    const { user } = useAuthContext();
    const role = String(user?.role ?? '').trim().toUpperCase();

    if (role !== 'CLINIC_ADMIN') {
        return <div className="card-glass p-6 text-center text-red-600 font-semibold">⛔ No autorizado para este panel</div>;
    }

    return (
        <div className="space-y-8">
            {/* ─── Servicios activos ──────────────────────────────────── */}
            <DashboardSection
                title="🏥 Administración de Clínica"
                subtitle="Gestión integral de tu clínica veterinaria"
            >
                <ServiceCard
                    href="/clinic-dashboard"
                    icon="👥"
                    accent="blue"
                    title="Gestión de Personal"
                    description="Administra tu equipo de veterinarios y recepcionistas. Altas, bajas y visualización."
                />
                <ServiceCard
                    href="/clinic-dashboard/pets"
                    icon="🐾"
                    accent="teal"
                    title="Mascotas de la Clínica"
                    description="Consulta el registro completo de pacientes vinculados a tu clínica."
                />
                <ServiceCard
                    href="/clinic-dashboard/add-veterinarian"
                    icon="🩺"
                    accent="purple"
                    title="Alta de Veterinario"
                    description="Registra un nuevo profesional veterinario y asígnalo a tu clínica."
                />
                <ServiceCard
                    href="/clinic-dashboard/add-receptionist"
                    icon="📞"
                    accent="amber"
                    title="Alta de Recepcionista"
                    description="Registra personal de recepción para la atención al público."
                />
            </DashboardSection>

            {/* ─── Servicios futuros ─────────────────────────────────── */}
            <DashboardSection
                title="🚀 Próximamente"
                subtitle="Herramientas empresariales en desarrollo"
            >
                <ComingSoonCard
                    icon="📊"
                    title="Analítica"
                    description="Dashboard con métricas de consultas, ingresos y rendimiento de tu equipo."
                />
                <ComingSoonCard
                    icon="💰"
                    title="Facturación"
                    description="Gestión de cobros, facturas y reportes financieros de la clínica."
                />
                <ServiceCard
                    href="/clinic/vetblocks"
                    icon="📅"
                    accent="blue"
                    title="Gestionar Agenda"
                    description="Configura la disponibilidad de los veterinarios para permitir el agendamiento de citas."
                />
                <ComingSoonCard
                    icon="⚙️"
                    title="Configuración Avanzada"
                    description="Personaliza horarios, especialidades, tarifas y políticas de tu clínica."
                />
            </DashboardSection>
        </div>
    );
}
