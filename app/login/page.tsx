'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { login } from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import type { FormState } from '@/types';

export default function LoginPage() {
    const router = useRouter();
    const { login: authLogin } = useAuthContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [form, setForm] = useState<FormState>({ loading: false, error: null, success: null });

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!email.trim()) newErrors.email = 'El correo electrónico es obligatorio.';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Ingresa un correo válido.';
        if (!password.trim()) newErrors.password = 'La contraseña es obligatoria.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setForm({ loading: true, error: null, success: null });
        try {
            const res = await login({ email, password });
            if (res.success && res.data?.token && res.data?.user) {
                console.log('[PetWell Login] ✅ Token recibido:', res.data.token.substring(0, 20) + '...');
                console.log('[PetWell Login] ✅ Usuario:', res.data.user.email, '| Rol:', res.data.user.role);
                // 1. Sincronizar AuthContext (actualiza Navbar inmediatamente)
                authLogin(res.data.token, res.data.user);
                setForm({ loading: false, error: null, success: '¡Inicio de sesión exitoso! Redirigiendo...' });
                // 2. Redirigir segun rol (normalizado) y forzar re-render
                const role = String(res.data.user.role ?? '').trim().toUpperCase();
                console.log('[PetWell Login] ✅ Role normalizado:', role);
                if (role === 'DUENO_MASCOTA') {
                    router.push('/pets');
                } else if (['CLINIC_ADMIN', 'VETERINARIO', 'RECEPCIONISTA'].includes(role)) {
                    router.push('/clinic-dashboard');
                } else {
                    router.push('/dashboard');
                }
                router.refresh();
            } else {
                setForm({ loading: false, error: res.message || 'Credenciales incorrectas.', success: null });
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al conectar con el servidor.';
            setForm({ loading: false, error: message, success: null });
        }
    };

    return (
        <div className="login-bg min-h-[calc(100vh-4rem)] relative flex items-center justify-center px-4 py-12 overflow-hidden">

            {/* Decorative blobs */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-petwell-teal/8 blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-[440px] h-[440px] rounded-full bg-petwell-blue/8 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-petwell-light/60 blur-2xl" />
            </div>

            {/* Decorative dot grid */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(46,134,193,0.06) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }}
            />

            <div className="relative w-full max-w-md">

                {/* ── Logo + header ─────────────────────────────────────────────── */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center mb-5">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center p-2 ring-1 ring-petwell-blue/10">
                            <Image
                                src="/logo.png"
                                alt="Logo PetWell"
                                width={64}
                                height={64}
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-petwell-navy">
                        Bienvenido a <span className="text-gradient-petwell">PetWell</span>
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Ingresa tus credenciales para continuar
                    </p>
                </div>

                {/* ── Card ──────────────────────────────────────────────────────── */}
                <div className="card-glass p-8 animate-slide-up shadow-xl">

                    {form.error && (
                        <div className="mb-5">
                            <Alert type="error" message={form.error} onClose={() => setForm(f => ({ ...f, error: null }))} />
                        </div>
                    )}
                    {form.success && (
                        <div className="mb-5">
                            <Alert type="success" message={form.success} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        <Input
                            id="login-email"
                            label="Correo electrónico"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            error={errors.email}
                            autoComplete="email"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            }
                        />
                        <Input
                            id="login-password"
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            error={errors.password}
                            autoComplete="current-password"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />

                        {/* Olvidé contraseña */}
                        <div className="flex justify-end -mt-2">
                            <Link
                                href="/forgot-password"
                                className="text-xs font-semibold text-petwell-blue hover:text-petwell-teal transition-colors duration-200"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            loading={form.loading}
                            disabled={form.loading}
                        >
                            {form.loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            ¿No tienes una cuenta?{' '}
                            <Link href="/register" className="font-semibold text-petwell-blue hover:text-petwell-teal transition-colors duration-200">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-gray-400 mt-6 animate-fade-in">
                    Tu información está protegida con cifrado SSL
                </p>
            </div>
        </div>
    );
}
