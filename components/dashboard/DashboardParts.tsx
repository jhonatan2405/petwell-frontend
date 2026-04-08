'use client';

import Link from 'next/link';

// ─── Tarjeta de Servicio Activo ───────────────────────────────────────────────
function ServiceCard({ href, icon, title, description, accent }: {
    href: string;
    icon: string;
    title: string;
    description: string;
    accent: string;
}) {
    const accentMap: Record<string, string> = {
        blue: 'bg-petwell-blue/10 text-petwell-blue group-hover:bg-petwell-blue',
        teal: 'bg-petwell-teal/10 text-petwell-teal group-hover:bg-petwell-teal',
        purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-600',
        amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-500',
        emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500',
    };
    return (
        <Link href={href}
            className="card-glass p-5 flex items-start gap-4 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:text-white ${accentMap[accent] || accentMap.blue}`}>
                <span className="text-xl">{icon}</span>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="font-bold text-petwell-navy text-sm mb-0.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-snug">{description}</p>
            </div>
            <svg className="w-4 h-4 text-gray-300 group-hover:text-petwell-teal transition-colors duration-200 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </Link>
    );
}

// ─── Tarjeta de Servicio Futuro (Próximamente) ───────────────────────────────
function ComingSoonCard({ icon, title, description }: {
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <div className="card-glass p-5 flex items-start gap-4 opacity-60 cursor-default select-none">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl grayscale">{icon}</span>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-400 text-sm">{title}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-500 uppercase tracking-wider">
                        Próximamente
                    </span>
                </div>
                <p className="text-xs text-gray-400 leading-snug">{description}</p>
            </div>
        </div>
    );
}

// ─── Sección con título ───────────────────────────────────────────────────────
function DashboardSection({ title, subtitle, children }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="animate-slide-up">
            <div className="mb-4">
                <h2 className="text-lg font-bold text-petwell-navy">{title}</h2>
                {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children}
            </div>
        </section>
    );
}

export { ServiceCard, ComingSoonCard, DashboardSection };
