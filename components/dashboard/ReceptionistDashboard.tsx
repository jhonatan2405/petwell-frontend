import { useAuthContext } from '@/context/AuthContext';
import { ServiceCard, ComingSoonCard, DashboardSection } from './DashboardParts';

export default function ReceptionistDashboard() {
    const { user } = useAuthContext();
    const role = String(user?.role ?? '').trim().toUpperCase();

    if (role !== 'RECEPCIONISTA') {
        return <div className="card-glass p-6 text-center text-red-600 font-semibold">⛔ No autorizado para este panel</div>;
    }

    return (
        <div className="space-y-8">
            {/* ─── Banner modo lectura ────────────────────────────────── */}
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 animate-fade-in">
                <span className="text-lg">⚠️</span>
                <span><strong>Modo operativo</strong>: puedes consultar y registrar información básica, pero no modificar datos clínicos.</span>
            </div>

            {/* ─── Servicios activos ──────────────────────────────────── */}
            <DashboardSection
                title="🧾 Panel de Recepción"
                subtitle="Herramientas operativas para la atención al público"
            >
                <ServiceCard
                    href="/clinic-dashboard/pets"
                    icon="🐾"
                    accent="teal"
                    title="Mascotas de la Clínica"
                    description="Ubica pacientes, verifica información y confirma registros."
                />
                <ServiceCard
                    href="/profile"
                    icon="👤"
                    accent="amber"
                    title="Mi Perfil"
                    description="Actualiza tus datos personales y preferencias de cuenta."
                />
            </DashboardSection>

            {/* ─── Servicios futuros ─────────────────────────────────── */}
            <DashboardSection
                title="🚀 Próximamente"
                subtitle="Funcionalidades operativas en desarrollo"
            >
                <ComingSoonCard
                    icon="📅"
                    title="Agendar Citas"
                    description="Registra y gestiona las citas de los pacientes de la clínica."
                />
                <ComingSoonCard
                    icon="🔔"
                    title="Confirmaciones"
                    description="Envía recordatorios y confirmaciones automáticas a los dueños."
                />
                <ComingSoonCard
                    icon="📞"
                    title="Atención al Cliente"
                    description="Gestiona solicitudes, consultas y seguimiento de clientes."
                />
            </DashboardSection>
        </div>
    );
}
