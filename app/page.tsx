'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

// ─── Metadata (moved to a separate metadata.ts for client component) ──────────
// Note: page.tsx is client because of animations; metadata is set via layout.

// ─── Intersection Observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.2) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);
    return { ref, inView };
}

// ─── Feature data ─────────────────────────────────────────────────────────────
const features = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
        title: 'Historial Médico Digital',
        desc: 'Accede al historial clínico completo de cada mascota de forma organizada y segura, siempre disponible.',
        color: 'from-blue-500 to-cyan-400',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        title: 'Agenda Inteligente',
        desc: 'Programa, modifica y notifica citas veterinarias en tiempo real desde cualquier dispositivo.',
        color: 'from-petwell-teal to-emerald-400',
        bg: 'bg-teal-50',
        border: 'border-teal-100',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        title: 'Control de Roles',
        desc: 'Administradores, veterinarios y propietarios: cada uno con acceso exacto a lo que necesita.',
        color: 'from-purple-500 to-violet-400',
        bg: 'bg-purple-50',
        border: 'border-purple-100',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: 'Seguridad JWT',
        desc: 'Autenticación con tokens JWT. Tus datos clínicos siempre protegidos y encriptados.',
        color: 'from-amber-500 to-orange-400',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
        title: 'Microservicios',
        desc: 'Arquitectura moderna basada en microservicios escalables e independientes.',
        color: 'from-petwell-blue to-sky-400',
        bg: 'bg-sky-50',
        border: 'border-sky-100',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
        ),
        title: 'Siempre en la Nube',
        desc: 'Alta disponibilidad garantizada. Accede desde cualquier dispositivo, en cualquier momento.',
        color: 'from-rose-400 to-pink-400',
        bg: 'bg-rose-50',
        border: 'border-rose-100',
    },
];

// ─── Animated floating paw icon ───────────────────────────────────────────────
function FloatingPaw({ style, delay, duration = '15s' }: { style?: React.CSSProperties; delay?: string; duration?: string }) {
    return (
        <div
            className="absolute opacity-[0.08] pointer-events-none select-none floating-paw"
            style={{ animationDelay: delay, animationDuration: duration, ...style }}
        >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C9.2 2 7 4.2 7 7s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zM4 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm16 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.5 14C5 14 2 16 2 19c0 1.7 2.5 3 5.5 3 1.4 0 2.7-.3 3.7-.9-.2-.6-.2-1.4-.2-2.1 0-2.1 1-4 2.6-5H7.5zm9 0H13c1.6 1 2.6 2.9 2.6 5 0 .7-.1 1.5-.2 2.1 1 .6 2.3.9 3.7.9 3 0 5.5-1.3 5.5-3-.1-3-3.1-5-7.1-5z" />
            </svg>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
    const featuresRef = useInView(0.1);
    const [heroVisible, setHeroVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setHeroVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <>
            {/* ═══════════════════════════════════════════════════════════════
                HERO — Full-height immersive section
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden">

                {/* Animated gradient background */}
                <div
                    className="absolute inset-0 -z-0"
                    style={{
                        background: 'linear-gradient(135deg, #0d2240 0%, #1e3a5f 35%, #1a5276 60%, #0e6655 100%)',
                    }}
                />

                {/* Moving mesh gradient overlay */}
                <div
                    className="absolute inset-0 -z-0 opacity-40"
                    style={{
                        background: 'radial-gradient(ellipse at 20% 50%, rgba(72,201,169,0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(46,134,193,0.4) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(72,201,169,0.2) 0%, transparent 40%)',
                    }}
                />

                {/* Subtle grid */}
                <div
                    className="absolute inset-0 -z-0"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                />

                {/* Floating paws decoration */}
                <FloatingPaw style={{ top: '15%', left: '10%' }} delay="0s" duration="15s" />
                <FloatingPaw style={{ top: '65%', left: '15%', width: 64, height: 64 }} delay="-3s" duration="20s" />
                <FloatingPaw style={{ top: '20%', right: '15%', width: 56, height: 56 }} delay="-7s" duration="18s" />
                <FloatingPaw style={{ bottom: '20%', right: '10%', width: 80, height: 80 }} delay="-12s" duration="25s" />
                <FloatingPaw style={{ top: '50%', left: '30%', width: 40, height: 40 }} delay="-5s" duration="22s" />
                <FloatingPaw style={{ top: '40%', right: '25%', width: 48, height: 48 }} delay="-9s" duration="19s" />

                {/* Content */}
                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16 sm:py-24">

                    {/* Logo + brand pill */}
                    <div
                        className="flex flex-col items-center mb-8"
                        style={{
                            opacity: heroVisible ? 1 : 0,
                            transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
                            transition: 'opacity 0.7s ease, transform 0.7s ease',
                        }}
                    >
                        <div className="relative mb-6">
                            {/* Glow ring */}
                            <div className="absolute inset-0 rounded-3xl bg-petwell-teal/30 blur-2xl scale-110 animate-pulse" />
                            <div className="relative w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center p-3 ring-2 ring-white/20">
                                <Image
                                    src="/logo.png"
                                    alt="PetWell logo"
                                    width={80}
                                    height={80}
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold text-petwell-teal">
                            <span className="w-2 h-2 rounded-full bg-petwell-teal animate-pulse" />
                            Plataforma Veterinaria Profesional
                        </div>
                    </div>

                    {/* Headline */}
                    <div
                        style={{
                            opacity: heroVisible ? 1 : 0,
                            transform: heroVisible ? 'translateY(0)' : 'translateY(32px)',
                            transition: 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s',
                        }}
                    >
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
                            El cuidado de tus
                            <br />
                            <span
                                style={{
                                    background: 'linear-gradient(90deg, #48c9a9 0%, #2e86c1 50%, #48c9a9 100%)',
                                    backgroundSize: '200% auto',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    animation: 'gradient-shift 4s linear infinite',
                                }}
                            >
                                mascotas, digitalizado
                            </span>
                        </h1>
                    </div>

                    {/* Subheadline */}
                    <div
                        style={{
                            opacity: heroVisible ? 1 : 0,
                            transform: heroVisible ? 'translateY(0)' : 'translateY(32px)',
                            transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s',
                        }}
                    >
                        <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
                            PetWell unifica clínicas, veterinarios y propietarios en una sola plataforma de gestión moderna —{' '}
                            <span className="text-white/90 font-medium">citas, historiales y más, en tiempo real.</span>
                        </p>
                    </div>

                    {/* CTA buttons */}
                    <div
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                        style={{
                            opacity: heroVisible ? 1 : 0,
                            transform: heroVisible ? 'translateY(0)' : 'translateY(32px)',
                            transition: 'opacity 0.8s ease 0.45s, transform 0.8s ease 0.45s',
                        }}
                    >
                        <Link
                            href="/register"
                            className="group inline-flex items-center justify-center gap-2.5 bg-petwell-teal text-white font-bold px-9 py-4 rounded-2xl shadow-lg hover:shadow-petwell-teal/40 hover:shadow-2xl hover:scale-[1.03] transition-all duration-200 text-base"
                        >
                            Comenzar gratis
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold px-9 py-4 rounded-2xl border border-white/25 hover:border-white/40 transition-all duration-200 text-base hover:scale-[1.02]"
                        >
                            Iniciar sesión
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div
                        className="flex flex-wrap items-center justify-center gap-6 mt-12 text-white/40 text-xs font-medium"
                        style={{
                            opacity: heroVisible ? 1 : 0,
                            transition: 'opacity 1s ease 0.7s',
                        }}
                    >
                        {['Sin tarjeta requerida', 'Datos seguros con JWT', 'Soporte en español', 'Disponible 24/7'].map((t) => (
                            <span key={t} className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-petwell-teal/70" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
                    <span className="text-xs font-medium tracking-widest uppercase">Descubre más</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {/* Bottom wave separator */}
                <div className="absolute bottom-0 left-0 right-0 -z-0">
                    <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" fill="#f8faff" />
                    </svg>
                </div>
            </section>



            {/* ═══════════════════════════════════════════════════════════════
                FEATURES — Staggered cards
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 bg-[#f8faff]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center mb-16">
                        <span className="inline-block text-petwell-blue text-sm font-bold uppercase tracking-widest mb-3">
                            Funcionalidades
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-petwell-navy mb-5 leading-tight">
                            Todo lo que necesitas en{' '}
                            <span className="text-gradient-petwell">una sola plataforma</span>
                        </h2>
                        <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
                            Diseñada para veterinarios, clínicas y propietarios que buscan eficiencia y profesionalismo.
                        </p>
                    </div>

                    <div
                        ref={featuresRef.ref}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {features.map((f, i) => (
                            <div
                                key={f.title}
                                className={`
                                    group relative bg-white rounded-2xl p-6 border ${f.border}
                                    hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300
                                    overflow-hidden
                                `}
                                style={{
                                    opacity: featuresRef.inView ? 1 : 0,
                                    transform: featuresRef.inView ? 'translateY(0)' : 'translateY(40px)',
                                    transition: `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s, box-shadow 0.3s, transform 0.3s`,
                                }}
                            >
                                {/* Gradient accent top-left */}
                                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${f.color} text-white`}>
                                    {f.icon}
                                </div>
                                <h3 className="text-base font-bold text-petwell-navy mb-2">{f.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                HOW IT WORKS — 3 steps
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 bg-white border-t border-gray-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block text-petwell-teal text-sm font-bold uppercase tracking-widest mb-3">
                            Así funciona
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-petwell-navy leading-tight">
                            Empieza en <span className="text-gradient-petwell">3 pasos</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-14 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-petwell-blue via-petwell-teal to-petwell-blue opacity-20 mx-8" />

                        {[
                            { num: '01', title: 'Crea tu cuenta', desc: 'Regístrate en segundos y configura tu clínica o perfil de propietario.', color: 'bg-petwell-blue' },
                            { num: '02', title: 'Agrega tu equipo', desc: 'Invita veterinarios, recepcionistas y conecta tus mascotas.', color: 'bg-petwell-teal' },
                            { num: '03', title: 'Gestiona todo', desc: 'Citas, historiales y comunicación desde un solo panel centralizado.', color: 'bg-petwell-navy' },
                        ].map((step, i) => (
                            <div key={step.num} className="flex flex-col items-center text-center group">
                                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                                    <span className="text-white font-black text-xl">{step.num}</span>
                                </div>
                                <h3 className="text-lg font-extrabold text-petwell-navy mb-2">{step.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                CTA FINAL
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 bg-[#f8faff]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div
                        className="relative gradient-petwell rounded-3xl p-12 overflow-hidden"
                        style={{ boxShadow: '0 32px 80px rgba(30,58,95,0.25)' }}
                    >
                        {/* Overlay blobs */}
                        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-petwell-teal/20 blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

                        <div className="relative">
                            <span className="inline-block text-petwell-teal text-sm font-bold uppercase tracking-widest mb-4">
                                Únete hoy
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                                ¿Listo para modernizar tu clínica?
                            </h2>
                            <p className="text-white/70 mb-8 text-lg max-w-xl mx-auto leading-relaxed">
                                Regístrate hoy y gestiona tu clínica veterinaria de forma profesional, segura y eficiente.
                            </p>
                            <Link
                                href="/register"
                                className="group inline-flex items-center gap-3 bg-white text-petwell-navy font-bold px-10 py-4 rounded-2xl hover:bg-petwell-teal hover:text-white transition-all duration-200 shadow-xl hover:shadow-2xl text-base hover:scale-[1.02]"
                            >
                                Crear cuenta gratuita
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Inline keyframes for animations */}
            <style>{`
                @keyframes gradient-shift {
                    0% { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
                .floating-paw {
                    animation: float-paw linear infinite;
                }
                @keyframes float-paw {
                    0% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 0.05; }
                    25% { transform: translateY(-30px) translateX(20px) rotate(15deg) scale(1.1); opacity: 0.12; }
                    50% { transform: translateY(10px) translateX(40px) rotate(-10deg) scale(0.9); opacity: 0.05; }
                    75% { transform: translateY(40px) translateX(10px) rotate(20deg) scale(1.05); opacity: 0.12; }
                    100% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 0.05; }
                }
            `}</style>
        </>
    );
}
