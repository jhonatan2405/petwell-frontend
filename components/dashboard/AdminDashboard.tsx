import { useEffect, useState } from 'react';
import { Network, Building2, Calendar, DollarSign, Activity, Users } from 'lucide-react';
import { getGlobalAnalytics } from '@/services/analyticsService';
import { AnalyticsGlobal } from '@/types';
import { useAuthContext } from '@/context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

function StatCard({ 
    title, 
    value, 
    icon: Icon,
    loading 
}: { 
    title: string; 
    value: string | number; 
    icon: React.ElementType;
    loading: boolean;
}) {
    return (
        <div className="card-glass p-6 animate-slide-up flex items-center justify-between">
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
                {loading ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                    <h3 className="text-3xl font-extrabold text-petwell-navy">{value}</h3>
                )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-petwell-light flex items-center justify-center text-petwell-teal">
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { token } = useAuthContext();
    const [data, setData] = useState<AnalyticsGlobal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const result = await getGlobalAnalytics(token);
                setData(result);
            } catch (err: any) {
                setError(err.message || 'Error al cargar analíticas globales');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    // Format data for Recharts
    const statusData = data ? Object.entries(data.appointments_by_status).map(([name, value]) => ({ name, value })) : [];
    const typeData = data ? Object.entries(data.appointments_by_type).map(([name, value]) => ({ name, value })) : [];

    if (error) {
        return (
            <div className="card-glass p-6 text-center text-red-600 font-semibold">
                ⚠️ {error}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-petwell-navy">
                    <Activity className="w-6 h-6 text-petwell-teal" />
                    Vista Global de la Red PetWell
                </h2>
                <p className="text-sm text-gray-500">Supervisa las métricas y KPIs de todo el ecosistema.</p>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Clínicas" 
                    value={data?.total_clinics ?? 0} 
                    icon={Building2} 
                    loading={loading} 
                />
                <StatCard 
                    title="Total Mascotas" 
                    value={data?.total_pets ?? 0} 
                    icon={Users} 
                    loading={loading} 
                />
                <StatCard 
                    title="Citas Globales" 
                    value={data?.total_appointments ?? 0} 
                    icon={Calendar} 
                    loading={loading} 
                />
                <StatCard 
                    title="Ingresos Totales" 
                    value={`$${(data?.total_revenue ?? 0).toLocaleString()}`} 
                    icon={DollarSign} 
                    loading={loading} 
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                
                {/* Status Chart */}
                <div className="card-glass p-6 min-h-[300px]">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Estado de Citas</h3>
                    {loading ? (
                        <div className="flex h-48 justify-center items-center"><LoadingSpinner /></div>
                    ) : statusData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
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
                        <div className="flex h-48 justify-center items-center text-gray-400">Sin datos</div>
                    )}
                </div>

                {/* Types Chart */}
                <div className="card-glass p-6 min-h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Tipo de Consulta</h3>
                        {!loading && data?.telemed_usage_rate && (
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                {data.telemed_usage_rate} Telemedicina
                            </span>
                        )}
                    </div>
                    {loading ? (
                        <div className="flex h-48 justify-center items-center"><LoadingSpinner /></div>
                    ) : typeData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={typeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {typeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
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
                        <div className="flex h-48 justify-center items-center text-gray-400">Sin datos</div>
                    )}
                </div>

            </div>

        </div>
    );
}
