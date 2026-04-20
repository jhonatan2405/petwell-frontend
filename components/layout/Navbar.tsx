'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { removeToken } from '@/utils/auth';
import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useAuthContext } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import NotificationBell from '@/components/NotificationBell';
import { getActiveSession } from '@/services/telemedService';
import type { TelemedSession } from '@/types';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { isAuthenticated, user, logout } = useAuthContext();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const hasClinicAccess = user?.role && ['CLINIC_ADMIN', 'VETERINARIO', 'RECEPCIONISTA'].includes(user.role);
    const isOwner = user?.role === 'DUENO_MASCOTA';
    const isAdmin = user?.role === 'CLINIC_ADMIN';

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Active Telemed Session Polling
    const [activeSession, setActiveSession] = useState<TelemedSession | null>(null);
    const [showTelemedToast, setShowTelemedToast] = useState(false);
    const prevSessionRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        let mounted = true;

        const checkActive = async () => {
            try {
                const session = await getActiveSession();
                if (!mounted) return; // prevent setState on unmounted component

                setActiveSession(session);

                if (session && session.status === 'IN_PROGRESS' && prevSessionRef.current !== session.id) {
                    // Only toast for owners — vet triggered the start himself
                    const isVet = user?.role === 'VETERINARIO';
                    if (!isVet) {
                        setShowTelemedToast(true);
                        setTimeout(() => setShowTelemedToast(false), 8000);
                    }
                    prevSessionRef.current = session.id;
                } else if (!session) {
                    prevSessionRef.current = null;
                }
            } catch {
                // Fully silenced — polling must never throw or log errors
            }
        };

        checkActive();
        const interval = setInterval(checkActive, 15000); // 15s — less aggressive, less noise

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [isAuthenticated, user?.role]);

    const handleLogout = () => {
        setMenuOpen(false);
        setDropdownOpen(false);
        removeToken();
        logout();
        router.push('/login');
    };

    const navLink = (href: string, label: string) => (
        <Link
            href={href}
            onClick={() => setMenuOpen(false)}
            className={`text-sm font-semibold transition-colors duration-200 hover:text-petwell-teal ${pathname === href ? 'text-petwell-teal' : 'text-white/90'
                }`}
        >
            {label}
        </Link>
    );

    const getInitial = () => {
        if (!user?.name) return 'U';
        return user.name.charAt(0).toUpperCase();
    };

    return (
        <header className="bg-petwell-navy shadow-sm sticky top-0 z-50 transition-all duration-200" role="navigation" aria-label="Navegación principal">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 relative flex items-center">

                {/* 1. Izquierda: Logo — posición fija izquierda */}
                <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 group flex-shrink-0">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden group-hover:ring-2 group-hover:ring-petwell-teal transition-all duration-200">
                        <Image
                            src="/logo.png"
                            alt="Logotipo de PetWell"
                            width={36}
                            height={36}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight hidden sm:block">
                        Pet<span className="text-petwell-teal">well</span>
                    </span>
                </Link>

                {/* 2. Centro: Navegación Principal — absolutamente centrado en la pantalla */}
                <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
                    {isAuthenticated && (
                        <>
                            {navLink('/dashboard', 'Mi Panel')}
                            {isAdmin && (
                                <>
                                    {navLink('/clinic-dashboard', 'Panel de Clínica')}
                                    {navLink('/clinic/schedules', 'Horarios')}
                                    {navLink('/clinic/vetblocks', 'Gestión de Agenda')}
                                    {navLink('/clinic/appointments', 'Citas')}
                                    {navLink('/clinic/settings/pricing', 'Precios')}
                                </>
                            )}
                            {user?.role === 'VETERINARIO' && (
                                <>
                                    {navLink('/clinic/appointments', 'Mis Consultas')}
                                </>
                            )}
                            {user?.role === 'RECEPCIONISTA' && (
                                <>
                                    {navLink('/clinic/appointments', 'Citas')}
                                    {navLink('/clinic-dashboard/pets', 'Pacientes')}
                                </>
                            )}
                            {isOwner && (
                                <>
                                    {navLink('/appointments', 'Mis Citas')}
                                </>
                            )}
                        </>
                    )}
                    {!isAuthenticated && (
                        navLink('/', 'Inicio')
                    )}
                </div>

                {/* 3. Derecha: Acciones de usuario — posición fija derecha */}
                <div className="hidden md:flex items-center gap-3 relative ml-auto flex-shrink-0">
                    {isAuthenticated ? (
                        <>
                            {activeSession?.status === 'IN_PROGRESS' && (
                                <Link
                                    href={`/telemed/${activeSession.appointment_id}/waiting`}
                                    className="hidden lg:flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full hover:bg-green-500/20 transition-colors"
                                >
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-bold text-green-400">Consulta en curso</span>
                                </Link>
                            )}
                            <NotificationBell />
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 focus:outline-none group"
                                    aria-expanded={dropdownOpen}
                                    aria-haspopup="true"
                                >
                                    <div className="w-10 h-10 ring-2 ring-transparent group-hover:ring-white/50 rounded-full transition-all duration-200">
                                        <Avatar src={user?.photo_url || user?.clinic_logo_url} name={user?.name || getInitial()} size="md" />
                                    </div>
                                    <svg className={`w-4 h-4 text-white/80 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl overflow-hidden animate-fade-in border border-gray-100">
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                            <p className="text-sm font-semibold text-petwell-navy truncate">{user?.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setDropdownOpen(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-petwell-light hover:text-petwell-teal transition-colors"
                                            >
                                                Mi Panel
                                            </Link>
                                            <Link
                                                href="/profile"
                                                onClick={() => setDropdownOpen(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-petwell-light hover:text-petwell-teal transition-colors"
                                            >
                                                Mi Perfil
                                            </Link>
                                            {isAdmin && (
                                                <>
                                                    <Link href="/clinic-dashboard" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-petwell-light hover:text-petwell-teal transition-colors">Panel de Clínica</Link>
                                                    <Link href="/clinic/schedules" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-petwell-light hover:text-petwell-teal transition-colors">Horarios</Link>
                                                    <Link href="/clinic/vetblocks" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-petwell-light hover:text-petwell-teal transition-colors">Gestión de Agenda</Link>
                                                    <Link href="/clinic/appointments" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-petwell-light hover:text-petwell-teal transition-colors">Citas</Link>
                                                    <Link href="/clinic/settings/pricing" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-petwell-light hover:text-petwell-teal transition-colors">Configuración de Precios</Link>
                                                </>
                                            )}
                                            {user?.role === 'VETERINARIO' && (
                                                <>
                                                    <Link href="/clinic/appointments" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-petwell-light hover:text-petwell-teal transition-colors">Mis Consultas</Link>
                                                </>
                                            )}
                                            {user?.role === 'RECEPCIONISTA' && (
                                                <>
                                                    <Link href="/clinic/appointments" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-petwell-light hover:text-petwell-teal transition-colors">Citas</Link>
                                                    <Link href="/clinic-dashboard/pets" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-petwell-light hover:text-petwell-teal transition-colors">Pacientes</Link>
                                                </>
                                            )}
                                            {isOwner && (
                                                <Link href="/appointments" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-petwell-light hover:text-petwell-teal transition-colors">
                                                    Mis Citas
                                                </Link>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                Cerrar sesión
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm font-semibold text-white/90 hover:text-petwell-teal transition-colors duration-200 px-3"
                            >
                                Iniciar sesión
                            </Link>
                            <Link href="/register">
                                <Button variant="secondary" size="sm">Registrarse</Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Action group mobile */}
                <div className="md:hidden ml-auto flex items-center gap-2 flex-shrink-0">
                    {isAuthenticated && <NotificationBell />}
                    {/* Botón menú móvil */}
                    <button
                        className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Abrir menú"
                        aria-expanded={menuOpen}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {menuOpen
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            }
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Menú móvil (Responsive) */}
            <div
                className={`md:hidden bg-petwell-navy border-t border-white/10 overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-4 py-4 flex flex-col gap-4">
                    {isAuthenticated ? (
                        <>
                            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                                <Avatar src={user?.photo_url || user?.clinic_logo_url} name={user?.name || getInitial()} size="md" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-white/60 truncate">{user?.email}</p>
                                </div>
                            </div>
                            {navLink('/', 'Inicio')}
                            {navLink('/dashboard', 'Mi Panel')}
                            {isAdmin && (
                                <>
                                    {navLink('/clinic-dashboard', 'Panel de Clínica')}
                                    {navLink('/clinic/schedules', 'Horarios')}
                                    {navLink('/clinic/vetblocks', 'Gestión de Agenda')}
                                    {navLink('/clinic/appointments', 'Citas')}
                                    {navLink('/clinic/settings/pricing', 'Precios')}
                                </>
                            )}
                            {user?.role === 'VETERINARIO' && (
                                <>
                                    {navLink('/clinic/appointments', 'Mis Consultas')}
                                </>
                            )}
                            {user?.role === 'RECEPCIONISTA' && (
                                <>
                                    {navLink('/clinic/appointments', 'Citas')}
                                    {navLink('/clinic-dashboard/pets', 'Pacientes')}
                                </>
                            )}
                            {isOwner && navLink('/appointments', 'Mis Citas')}
                            {navLink('/profile', 'Mi Perfil')}
                            <button onClick={handleLogout} className="text-left text-red-400 font-semibold text-sm hover:text-red-300 transition-colors">
                                Cerrar sesión
                            </button>
                        </>
                    ) : (
                        <>
                            {navLink('/', 'Inicio')}
                            {navLink('/login', 'Iniciar sesión')}
                            {navLink('/register', 'Registrarse')}
                        </>
                    )}
                </div>
            </div>

            {/* Global Real-time Toast para Inicio de Telemedicina */}
            {showTelemedToast && activeSession && (
                <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
                    <div className="bg-white rounded-2xl shadow-2xl p-4 pr-12 border border-purple-100 flex items-start gap-4">
                        <button
                            onClick={() => setShowTelemedToast(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl">🎥</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-800 mb-0.5">Tu consulta ha iniciado</h4>
                            <p className="text-xs text-gray-500 mb-2">El veterinario te está esperando en la sala virtual.</p>
                            <Link
                                href={`/telemed/${activeSession.appointment_id}/waiting`}
                                onClick={() => setShowTelemedToast(false)}
                                className="inline-block bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
                            >
                                Ir a la consulta
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

