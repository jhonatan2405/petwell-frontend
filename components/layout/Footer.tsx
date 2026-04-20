'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();
    if (pathname === '/auth' || pathname === '/verify-account') {
        return null;
    }
    
    return (
        <footer className="bg-petwell-navy text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Marca */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-petwell-blue rounded-lg flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 7v1M12 16v1M7 12H6M18 12h-1" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span className="font-bold text-lg">Pet<span className="text-petwell-teal">well</span></span>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Servicios veterinarios y cuidado animal.<br />
                            Tecnología al servicio de las mascotas.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-semibold text-petwell-teal mb-3 text-sm uppercase tracking-wider">Plataforma</h3>
                        <ul className="space-y-2">
                            {[
                                { href: '/', label: 'Inicio' },
                                { href: '/login', label: 'Iniciar sesión' },
                                { href: '/register', label: 'Crear cuenta' },
                                { href: '/dashboard', label: 'Mi Panel' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-white/60 hover:text-petwell-teal text-sm transition-colors duration-200"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div>
                        <h3 className="font-semibold text-petwell-teal mb-3 text-sm uppercase tracking-wider">Contacto</h3>
                        <ul className="space-y-2 text-white/60 text-sm">
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-petwell-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                contacto@petwell.com
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-petwell-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                +57 300 000 0000
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <p className="text-white/40 text-xs">
                        © {new Date().getFullYear()} PetWell. Todos los derechos reservados.
                    </p>
                    <p className="text-white/40 text-xs">
                        Servicios Veterinarios y Cuidado Animal
                    </p>
                </div>
            </div>
        </footer>
    );
}
