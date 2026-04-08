'use client';

import { useState } from 'react';
import Link from 'next/link';
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
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-petwell-light/30">
            <div className="w-full max-w-md">
                {/* Encabezado */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-petwell-blue rounded-2xl shadow-lg mb-5">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-petwell-navy">Iniciar sesión</h1>
                    <p className="text-gray-500 mt-2 text-sm">Accede a tu cuenta PetWell</p>
                </div>

                {/* Tarjeta */}
                <div className="card-glass p-8 animate-slide-up">
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
                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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

                        {/* Link olvide contraseña */}
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
                            {form.loading ? 'Verificando...' : 'Iniciar sesión'}
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
            </div>
        </div>
    );
}

