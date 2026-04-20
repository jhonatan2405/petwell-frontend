'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/services/authService';
import { useAuthContext } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface FieldErrors { email?: string; password?: string; }

export default function LoginForm() {
    const router = useRouter();
    const { login: authLogin } = useAuthContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // ── Validación en cliente ──────────────────────────────────────────────────
    const validate = (): boolean => {
        const errs: FieldErrors = {};
        if (!email.trim()) {
            errs.email = 'El correo electrónico es obligatorio.';
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            errs.email = 'Ingresa un correo válido.';
        }
        if (!password.trim()) {
            errs.password = 'La contraseña es obligatoria.';
        } else if (password.length < 6) {
            errs.password = 'Mínimo 6 caracteres.';
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const clearField = (field: keyof FieldErrors) =>
        setFieldErrors(prev => ({ ...prev, [field]: undefined }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError(null);
        if (!validate()) return;

        setLoading(true);
        try {
            const res = await login({ email, password });
            if (res.success && res.data?.token && res.data?.user) {
                authLogin(res.data.token, res.data.user);
                const role = String(res.data.user.role ?? '').trim().toUpperCase();
                if (role === 'DUENO_MASCOTA') {
                    router.push('/pets');
                } else if (['CLINIC_ADMIN', 'VETERINARIO', 'RECEPCIONISTA'].includes(role)) {
                    router.push('/clinic-dashboard');
                } else {
                    router.push('/dashboard');
                }
                router.refresh();
            } else {
                setServerError(res.message || 'Credenciales incorrectas.');
            }
        } catch (err: any) {
            const status = (err as any).status;
            if (status === 403) {
                // Account not verified → redirect with email hint in query
                router.push(`/verify-account?email=${encodeURIComponent(email)}`);
            } else {
                setServerError(err.message || 'Error al conectar con el servidor.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="sign-in-form auth-form" noValidate>
            <div className="flex flex-col items-center mb-8 z-10 w-full max-w-[420px] pt-4 animate-slide-up">
                <div className="w-[88px] h-[88px] bg-white rounded-3xl shadow-xl flex items-center justify-center mb-5 border border-gray-50 animate-float">
                    <img src="/logo.png" alt="PetWell Logo" className="w-14 h-14 object-contain" />
                </div>
                <h1 className="text-[32px] font-extrabold text-[#1e3a5f] mb-2 tracking-tight">
                    Bienvenido a <span className="text-petwell-teal">PetWell</span>
                </h1>
                <p className="text-gray-500 text-[15px] font-medium text-center">
                    Ingresa tus credenciales para continuar
                </p>
            </div>

            <div className="bg-white p-10 rounded-[28px] shadow-[0_20px_60px_-15px_rgba(30,58,95,0.15)] w-full max-w-[420px] flex flex-col items-center border border-gray-50/50 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {serverError && (
                    <div className="w-full mb-4">
                        <Alert type="error" message={serverError} onClose={() => setServerError(null)} />
                    </div>
                )}

                <div className="w-full space-y-5">
                    <Input
                        id="login-email"
                        label="Correo electrónico"
                        type="email"
                        placeholder="ejemplo@correo.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearField('email'); }}
                        error={fieldErrors.email}
                        autoFocus
                        autoComplete="email"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                        }
                    />
                    <Input
                        id="login-password"
                        label="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearField('password'); }}
                        error={fieldErrors.password}
                        autoComplete="current-password"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        }
                    />

                    <div className="flex justify-end -mt-1">
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
                        loading={loading}
                        disabled={loading}
                        className="bg-[#1e3a5f] hover:bg-[#1a365d] text-white border-none mt-2 shadow-md hover:shadow-lg"
                    >
                        {loading ? 'Cargando...' : 'Iniciar sesión'}
                    </Button>
                </div>
            </div>
        </form>
    );
}

