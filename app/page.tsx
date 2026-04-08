import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PetWell – Plataforma Veterinaria Profesional',
  description: 'Gestiona las mascotas de tus clientes, citas médicas y registros veterinarios con PetWell.',
};

const features = [
  {
    icon: (
      <svg className="w-7 h-7 text-petwell-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Historial Médico',
    desc: 'Accede al historial clínico completo de cada mascota de forma organizada y segura.',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-petwell-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Gestión de Citas',
    desc: 'Agenda, modifica y notifica citas veterinarias en tiempo real desde cualquier dispositivo.',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-petwell-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'Gestión de Usuarios',
    desc: 'Control de acceso por roles: administradores, veterinarios y propietarios de mascotas.',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-petwell-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Seguridad JWT',
    desc: 'Autenticación segura con tokens JWT. Tus datos siempre protegidos y encriptados.',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-petwell-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Microservicios',
    desc: 'Arquitectura moderna basada en microservicios escalables y de alta disponibilidad.',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-petwell-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    title: 'Siempre Disponible',
    desc: 'Plataforma en la nube con alta disponibilidad, accesible desde cualquier dispositivo.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="gradient-petwell relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-petwell-teal/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-petwell-blue/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="w-28 h-28 bg-white rounded-3xl shadow-2xl flex items-center justify-center p-3">
                <Image
                  src="/logo.png"
                  alt="PetWell logo"
                  width={100}
                  height={100}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 text-petwell-teal border border-petwell-teal/30 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-petwell-teal animate-pulse" />
              Plataforma Veterinaria Profesional
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 animate-slide-up">
              El cuidado de tus mascotas,{' '}
              <span className="text-petwell-teal">digitalizado</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto mb-10 animate-slide-up leading-relaxed">
              PetWell es la plataforma integral para clínicas veterinarias modernas.
              Gestiona usuarios, citas, historiales médicos y mucho más desde un solo lugar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-petwell-teal hover:bg-teal-400 text-white font-semibold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 text-base"
              >
                Comenzar gratis
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl border border-white/20 transition-all duration-200 text-base"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CARACTERÍSTICAS ───────────────────────────────────────────────── */}
      <section className="py-20 bg-petwell-light/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-petwell-navy mb-4">
              Todo lo que necesitas en{' '}
              <span className="text-gradient-petwell">una sola plataforma</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">
              Diseñada para veterinarios, clínicas y propietarios de mascotas que buscan eficiencia y profesionalismo.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-glass p-6 hover:-translate-y-1 transition-transform duration-200 group">
                <div className="w-14 h-14 bg-petwell-light rounded-2xl flex items-center justify-center mb-5 group-hover:bg-petwell-blue/10 transition-colors duration-200">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-petwell-navy mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card-glass p-10 gradient-petwell rounded-3xl shadow-2xl">
            <h2 className="text-3xl font-extrabold text-white mb-4">
              ¿Listo para modernizar tu clínica?
            </h2>
            <p className="text-white/75 mb-8 text-lg">
              Regístrate hoy y empieza a gestionar tu clínica veterinaria de forma profesional, segura y eficiente.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-petwell-navy font-bold px-10 py-4 rounded-xl hover:bg-petwell-teal hover:text-white transition-all duration-200 shadow-lg text-base"
            >
              Crear cuenta gratuita
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
