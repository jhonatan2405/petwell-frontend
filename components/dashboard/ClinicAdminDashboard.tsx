import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { ServiceCard, ComingSoonCard, DashboardSection } from './DashboardParts';
import { getClinicAnalytics } from '@/services/analyticsService';
import { AnalyticsClinic } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Stethoscope, DollarSign, CalendarCheck, Percent } from 'lucide-react';

const COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

function MetricCard({ title, value, icon: Icon, loading }: { title: string, value: string | number, icon: any, loading: boolean }) {
    return (
        <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-petwell-light flex items-center justify-center text-petwell-blue flex-shrink-0">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                {loading ? (
                    <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                    <p className="text-2xl font-extrabold text-petwell-navy">{value}</p>
                )}
            </div>
        </div>
    );
}

export default function ClinicAdminDashboard() {
    const { user, token } = useAuthContext();
    const role = String(user?.role ?? '').trim().toUpperCase();
    const [analytics, setAnalytics] = useState<AnalyticsClinic | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!token || !user?.clinic_id) return;
            try {
                const data = await getClinicAnalytics(user.clinic_id, token);
                setAnalytics(data);
            } catch (err) {
                console.error('Error fetching clinic analytics', err);
            } finally {
                setLoading(false);
            }
        };
        if (role === 'CLINIC_ADMIN') {
            fetchAnalytics();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, user?.clinic_id, role]);

    if (role !== 'CLINIC_ADMIN') {
        return <div className="card-glass p-6 text-center text-red-600 font-semibold">⛔ No autorizado para este panel</div>;
    }

    const typeData = analytics ? Object.entries(analytics.appointments_by_type).map(([name, value]) => ({ name, value })) : [];

    return (
        <div className="space-y-8">
            
            {/* ─── Analíticas de la clínica ──────────────────────────────────── */}
            <section className="animate-slide-up">
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-petwell-navy">📈 Rendimiento de tu Clínica</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Métricas y estadísticas en tiempo real</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    <MetricCard 
                        title="Tasa de Ocupación" 
                        value={analytics?.occupancy_rate || '0%'} 
                        icon={Percent} 
                        loading={loading} 
                    />
                    <MetricCard 
                        title="Ingresos Totales" 
                        value={`$${(analytics?.revenue_total ?? 0).toLocaleString()}`} 
                        icon={DollarSign} 
                        loading={loading} 
                    />
                    <MetricCard 
                        title="Citas Atendidas" 
                        value={analytics?.completed ?? 0} 
                        icon={Stethoscope} 
                        loading={loading} 
                    />
                    <MetricCard 
                        title="Citas Pendientes" 
                        value={analytics?.pending ?? 0} 
                        icon={CalendarCheck} 
                        loading={loading} 
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full mt-4">
                    {/* Gráfico de tipos de consulta */}
                    <div className="card-glass p-6">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Métricas de Especialidad</h3>
                        {loading ? (
                            <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>
                        ) : typeData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={typeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {typeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-48 text-gray-400">Sin datos de citas para graficar</div>
                        )}
                    </div>

                    {/* Resumen de telemedicina */}
                    <div className="card-glass p-6 flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4">
                            <Stethoscope className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Adopción de Telemedicina</h3>
                        {loading ? (
                            <div className="h-10 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>
                        ) : (
                            <p className="text-4xl font-extrabold text-petwell-navy">
                                {analytics?.telemed_usage_rate || '0%'}
                            </p>
                        )}
                        <p className="text-sm text-gray-500 mt-2 max-w-xs">De tus citas programadas utilizan nuestra plataforma segura de telemedicina.</p>
                    </div>
                </div>
            </section>

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
                <ServiceCard
                    href="/clinic/vetblocks"
                    icon="📅"
                    accent="blue"
                    title="Gestionar Agenda"
                    description="Configura la disponibilidad de los veterinarios para permitir el agendamiento de citas."
                />
            </DashboardSection>

            {/* ─── Servicios futuros ─────────────────────────────────── */}
            <DashboardSection
                title="🚀 Próximamente"
                subtitle="Herramientas empresariales en desarrollo"
            >
                <ComingSoonCard
                    icon="⚙️"
                    title="Configuración Avanzada"
                    description="Personaliza horarios, especialidades, tarifas y políticas de tu clínica."
                />
            </DashboardSection>
        </div>
    );
}
