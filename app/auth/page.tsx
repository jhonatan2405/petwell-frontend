'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, UserPlus, Fingerprint, Smartphone, Lock, CheckCircle2, Sparkles, HeartPulse, Activity, Shield } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import './auth.css';

function AnimatedShieldNode() {
    return (
        <div className="relative w-[300px] h-[300px] flex items-center justify-center auth-image group mt-4">
            {/* Center Shield */}
            <div className="relative z-10 w-28 h-32 bg-white/10 backdrop-blur-lg border border-white/30 rounded-3xl shadow-xl flex items-center justify-center transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                <ShieldCheck className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            </div>

            {/* Orbiting nodes */}
            <div className="absolute inset-0 animate-[spin_12s_linear_infinite]">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/20 transform transition-transform group-hover:scale-125 hover:bg-white/40">
                    <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div className="absolute bottom-10 right-4 bg-white/20 p-2.5 rounded-full backdrop-blur-sm border border-white/20 transform transition-transform group-hover:scale-125 hover:bg-white/40" style={{ animationDelay: '100ms' }}>
                    <HeartPulse className="w-6 h-6 text-white" />
                </div>
                <div className="absolute bottom-12 left-4 bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/20 transform transition-transform group-hover:scale-125 hover:bg-white/40" style={{ animationDelay: '200ms' }}>
                    <Activity className="w-6 h-6 text-white" />
                </div>
            </div>
            
            {/* Rings */}
            <div className="absolute inset-8 border border-white/20 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse]" />
            <div className="absolute inset-16 border border-white/10 rounded-full" />
            
            {/* Floating Sparkles */}
            <Sparkles className="absolute top-10 right-10 w-6 h-6 text-yellow-300 animate-pulse" />
            <Sparkles className="absolute bottom-20 left-2 w-4 h-4 text-white/60 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
    );
}

function AnimatedPhoneLogin() {
    return (
        <div className="relative w-[300px] h-[300px] flex items-center justify-center auth-image group mt-4">
            {/* Phone Frame */}
            <div className="relative z-10 w-40 h-64 bg-white/10 backdrop-blur-lg border border-white/30 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-start pt-6 pb-4 transform transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-2 group-hover:rotate-3 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15),_0_0_30px_rgba(255,255,255,0.2)]">
                {/* Notch */}
                <div className="absolute top-2 w-16 h-1.5 bg-white/20 rounded-full" />
                
                {/* Screen content */}
                <div className="flex flex-col items-center justify-center gap-6 w-full h-full px-4 relative">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 animate-pulse" />
                        <Fingerprint className="w-8 h-8 text-white relative z-10 transform transition-all duration-500 group-hover:scale-110 group-hover:text-green-300" />
                    </div>
                    
                    <div className="w-full space-y-3">
                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full w-0 bg-gradient-to-r from-white/40 to-white/80 group-hover:w-full transition-all duration-1000 ease-out" />
                        </div>
                        <div className="h-3 w-3/4 mx-auto bg-white/10 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full w-0 bg-gradient-to-r from-white/40 to-white/80 group-hover:w-full transition-all duration-1000 delay-300 ease-out" />
                        </div>
                    </div>

                    <div className="mt-2 w-12 h-12 relative flex items-center justify-center bg-white/10 rounded-full border border-white/20 shadow-md">
                        <Lock className="w-5 h-5 text-white/70 group-hover:opacity-0 group-hover:scale-50 transition-all duration-300 absolute" />
                        <CheckCircle2 className="w-7 h-7 text-green-300 absolute opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(134,239,172,0.6)]" />
                    </div>
                </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute right-2 top-14 bg-white/20 p-2.5 rounded-xl backdrop-blur-md animate-float shadow-lg border border-white/20 z-20 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700">
                <Shield className="w-6 h-6 text-blue-100" />
            </div>
            <div className="absolute left-2 bottom-16 bg-white/20 p-3 rounded-2xl backdrop-blur-md animate-float shadow-lg border border-white/20 z-20 group-hover:-translate-x-4 group-hover:translate-y-4 transition-transform duration-700" style={{ animationDelay: '1.5s' }}>
                <Smartphone className="w-6 h-6 text-white" />
            </div>
        </div>
    );
}

function AuthContent() {
    const searchParams = useSearchParams();
    const [isSignUpMode, setIsSignUpMode] = useState(searchParams.get('mode') === 'register');

    return (
        <div className="min-h-[calc(100dvh-64px)] w-full bg-[#f8faff] md:bg-transparent animate-page-enter relative overflow-hidden flex flex-col justify-center">
            
            {/* ─── DESKTOP VIEW (VISTA ANIMADA CSS) ─── */}
            <div className={`hidden md:block auth-wrapper ${isSignUpMode ? 'sign-up-mode' : ''} absolute inset-0`}>
                <div className="auth-forms-container">
                    <div className="auth-signin-signup">
                        <LoginForm />
                        <RegisterForm />
                    </div>
                </div>

                <div className="auth-panels-container">
                    <div className="auth-panel left-panel">
                        <div className="content">
                            <h3>¿Nuevo en PetWell?</h3>
                            <p>¡Descubre un mundo de posibilidades! Únete a nosotros y explora una comunidad vibrante orientada a la salud de tu mascota.</p>
                            <button className="auth-btn-transparent" onClick={() => setIsSignUpMode(true)}>
                                Crear cuenta
                            </button>
                        </div>
                        <AnimatedShieldNode />
                    </div>

                    <div className="auth-panel right-panel">
                        <div className="content">
                            <h3>Bienvenido de nuevo</h3>
                            <p>Gracias por ser parte de nuestra comunidad. ¡Sigamos este viaje juntos en PetWell!</p>
                            <button className="auth-btn-transparent" onClick={() => setIsSignUpMode(false)}>
                                Iniciar sesión
                            </button>
                        </div>
                        <AnimatedPhoneLogin />
                    </div>
                </div>
            </div>

            {/* ─── MOBILE VIEW (TABS SIMPLES) ─── */}
            <div className="md:hidden flex flex-col items-center w-full px-4 py-8 z-10 pt-20">
                {/* Selector visual Mobile */}
                <div className="w-full max-w-[460px] bg-white rounded-full p-1.5 shadow-sm border border-gray-100 flex mb-8">
                    <button
                        onClick={() => setIsSignUpMode(false)}
                        className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-300 ${!isSignUpMode ? 'bg-[#1e3a5f] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Iniciar sesión
                    </button>
                    <button
                        onClick={() => setIsSignUpMode(true)}
                        className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-300 ${isSignUpMode ? 'bg-[#1e3a5f] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Crear cuenta
                    </button>
                </div>

                <div className="w-full max-w-[460px] relative animate-slide-up">
                    {!isSignUpMode ? <LoginForm /> : <RegisterForm />}
                </div>
            </div>

            {/* Back to Home Button */}
            <div className="fixed bottom-6 left-6 z-50">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 md:bg-white/10 hover:bg-white text-petwell-navy rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 border border-black/5 md:border-white/20 group bg-white"
                >
                    <div className="bg-petwell-navy text-white rounded-full p-1.5 group-hover:-translate-x-1 transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </div>
                    <span className="font-semibold text-sm mr-1 hidden sm:block">Volver al Inicio</span>
                </Link>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={null}>
            <AuthContent />
        </Suspense>
    );
}

