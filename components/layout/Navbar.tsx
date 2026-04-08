'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { removeToken } from '@/utils/auth';
import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useAuthContext } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

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
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                
                {/* 1. Izquierda: Logo */}
                <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
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

                {/* 2. Centro: Navegación Principal (Desktop) */}
                <div className="hidden md:flex items-center gap-7">
                    {isAuthenticated && (
                        <>
                            {navLink('/dashboard', 'Mi Panel')}
                            {isAdmin && (
                                <>
                                    {navLink('/clinic-dashboard', 'Panel de Clínica')}
                                    {navLink('/clinic/schedules', 'Horarios')}
                                    {navLink('/clinic/vetblocks', 'Gestión de Agenda')}
                                    {navLink('/clinic/appointments', 'Citas')}
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

                {/* 3. Derecha: Acciones de usuario (Desktop) */}
                <div className="hidden md:flex items-center gap-3 relative">
                    {isAuthenticated ? (
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

                {/* Botón menú móvil */}
                <button
                    className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
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
        </header>
    );
}

