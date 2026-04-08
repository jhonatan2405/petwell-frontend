import { useAuthContext } from '@/context/AuthContext';
import { ServiceCard, ComingSoonCard, DashboardSection } from './DashboardParts';

export default function VeterinarianDashboard() {
    const { user } = useAuthContext();
    const role = String(user?.role ?? '').trim().toUpperCase();

    if (role !== 'VETERINARIO') {
        return <div className="card-glass p-6 text-center text-red-600 font-semibold">⛔ No autorizado para este panel</div>;
    }

    return (
        <div className="space-y-8">
            {/* ─── Servicios activos ──────────────────────────────────── */}
            <DashboardSection
                title="🩺 Panel Clínico"
                subtitle="Herramientas para tu práctica veterinaria diaria"
            >
                <ServiceCard
                    href="/clinic-dashboard/pets"
                    icon="🐾"
                    accent="teal"
                    title="Mascotas y Pacientes"
                    description="Consulta los pacientes registrados, accede a sus fichas y crea nuevas consultas."
                />
                <ServiceCard
                    href="/clinic-dashboard/pets"
                    icon="📋"
                    accent="blue"
                    title="Historial Clínico"
                    description="Accede, edita y gestiona los registros médicos completos de cada paciente."
                />
                <ServiceCard
                    href="/profile"
                    icon="👤"
                    accent="amber"
                    title="Mi Perfil Profesional"
                    description="Actualiza tus datos, licencia veterinaria y preferencias de cuenta."
                />
            </DashboardSection>

            {/* ─── Servicios futuros ─────────────────────────────────── */}
            <DashboardSection
                title="🚀 Próximamente"
                subtitle="Funcionalidades clínicas avanzadas en desarrollo"
            >
                <ComingSoonCard
                    icon="📅"
                    title="Agenda Diaria"
                    description="Visualiza y gestiona tus citas del día con horarios y pacientes asignados."
                />
                <ComingSoonCard
                    icon="💻"
                    title="Telemedicina"
                    description="Atiende consultas remotas por videollamada con dueños de mascotas."
                />
                <ComingSoonCard
                    icon="🔬"
                    title="Diagnósticos Estructurados"
                    description="Registro estandarizado de diagnósticos con códigos clínicos veterinarios."
                />
                <ComingSoonCard
                    icon="📈"
                    title="Historial Avanzado"
                    description="Gráficas de evolución clínica, alertas automáticas y seguimiento de tratamientos."
                />
            </DashboardSection>
        </div>
    );
}
