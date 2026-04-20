'use client';

import { useState } from 'react';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import './auth.css';

export default function AuthPage() {
    const [isSignUpMode, setIsSignUpMode] = useState(false);

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
                        <img src="https://i.ibb.co/6HXL6q1/Privacy-policy-rafiki.png" className="auth-image" alt="Privacy Policy" />
                    </div>

                    <div className="auth-panel right-panel">
                        <div className="content">
                            <h3>Bienvenido de nuevo</h3>
                            <p>Gracias por ser parte de nuestra comunidad. ¡Sigamos este viaje juntos en PetWell!</p>
                            <button className="auth-btn-transparent" onClick={() => setIsSignUpMode(false)}>
                                Iniciar sesión
                            </button>
                        </div>
                        <img src="https://i.ibb.co/nP8H853/Mobile-login-rafiki.png" className="auth-image" alt="Mobile Login" />
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
