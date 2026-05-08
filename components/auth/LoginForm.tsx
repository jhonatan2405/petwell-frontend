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
    const [showWelcome, setShowWelcome] = useState(false);
    const [welcomeUser, setWelcomeUser] = useState<any>(null);

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
                const token = res.data.token;
                const user = res.data.user;
                
                authLogin(token, user);
                setWelcomeUser(user);
                setShowWelcome(true);
                
                setTimeout(() => {
                    const role = String(user.role ?? '').trim().toUpperCase();
                    if (role === 'DUENO_MASCOTA') {
                        router.push('/pets');
                    } else if (['CLINIC_ADMIN', 'VETERINARIO', 'RECEPCIONISTA'].includes(role)) {
                        router.push('/clinic-dashboard');
                    } else {
                        router.push('/dashboard');
                    }
                    router.refresh();
                }, 2500);
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

    if (showWelcome) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#1e3a5f] to-[#112239] text-white animate-fade-in">
                <div className="relative mb-10">
                    <div className="absolute inset-0 bg-[#ED5565] blur-[80px] opacity-40 rounded-full scale-150"></div>
                    <svg width="120" height="120" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-[#ED5565] animate-bounce relative z-10 drop-shadow-2xl">
                        <path d="M226.5 92.9c14.3 7.3 22.8 16.6 32.5 29.6 11 14.8 28.5 31.8 46.5 31.8 18 0 35.5-17 46.5-31.8 9.7-12.9 18.2-22.3 32.5-29.6 46.1-23.5 100.3 12 96.8 62.5-2.8 40.5-27 75.3-64.8 91.5-29.9 12.8-63.7 9.8-93.5-3.3-11.2-4.9-22.3-4.9-33.5 0-29.8 13.1-63.6 16.1-93.5 3.3-37.8-16.2-62-51-64.8-91.5-3.5-50.5 50.7-86 96.8-62.5zm-147 186.2c35.6-21.3 84.5-4.4 109.1 37.8 24.6 42.2 15.6 94.1-20 115.4-35.6 21.3-84.5 4.4-109.1-37.8-24.6-42.2-15.6-94.1 20-115.4zm353 0c35.6 21.3 26.6 73.2 2 115.4-24.6 42.2-73.5 59.1-109.1 37.8-35.6-21.3-26.6-73.2-2-115.4 24.6-42.2 73.5-59.1 109.1-37.8zM256 256c-11.2 0-21.8 1.4-31.8 3.9-34.9 8.8-64.4 34.6-78.5 69.1-14.5 35.6-9.6 74 12.4 105.5 21 29.9 54.4 47.9 90.7 47.9h14.4c36.3 0 69.7-18 90.7-47.9 22-31.5 26.9-69.9 12.4-105.5-14.1-34.5-43.6-60.3-78.5-69.1-10-2.5-20.6-3.9-31.8-3.9z"/>
                    </svg>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight animate-slide-up" style={{ animationFillMode: 'both' }}>¡Bienvenido a PetWell!</h2>
                <p className="text-xl md:text-2xl text-[#e8f4fd] font-medium opacity-90 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                    {welcomeUser?.first_name ? `Hola, ${welcomeUser.first_name}` : 'Preparando tu panel...'}
                </p>
                
                {/* Floating elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] left-[20%] w-3 h-3 bg-white rounded-full animate-ping opacity-70" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute top-[30%] right-[25%] w-4 h-4 bg-yellow-300 rounded-full animate-pulse opacity-80" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute bottom-[30%] left-[30%] w-2 h-2 bg-[#2e86c1] rounded-full animate-ping opacity-60" style={{ animationDuration: '2.5s' }}></div>
                    <div className="absolute bottom-[20%] right-[20%] w-5 h-5 bg-[#ED5565] rounded-full animate-pulse opacity-50" style={{ animationDuration: '4s' }}></div>
                </div>
            </div>
        );
    }

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

