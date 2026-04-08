'use client';

import { useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validate = (): boolean => {
        if (!email.trim()) {
            setEmailError('El correo electrónico es obligatorio.');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError('Ingresa un correo electrónico válido.');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setError(null);

        try {
            // Endpoint futuro: POST /users/forgot-password
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/users/forgot-password`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                }
            );
            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess(true);
            } else {
                setError(data.message || 'No se pudo procesar la solicitud. Intenta nuevamente.');
            }
        } catch {
            setError('Error al conectar con el servidor. Verifica tu conexión.');
        } finally {
            setLoading(false);
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
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-petwell-navy">¿Olvidaste tu contraseña?</h1>
                    <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto">
                        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                    </p>
                </div>

                {/* Tarjeta */}
                <div className="card-glass p-8 animate-slide-up">

                    {/* Estado: éxito */}
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-petwell-navy mb-2">¡Correo enviado!</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Revisa tu bandeja de entrada en <strong className="text-petwell-navy">{email}</strong>.
                                El enlace de recuperación expira en 30 minutos.
                            </p>
                            <p className="text-xs text-gray-400 mb-6">
                                ¿No lo ves? Revisa tu carpeta de spam o correo no deseado.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 font-semibold text-petwell-blue hover:text-petwell-teal transition-colors duration-200 text-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-5">
                                    <Alert type="error" message={error} onClose={() => setError(null)} />
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                                <Input
                                    id="forgot-email"
                                    label="Correo electrónico"
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value);
                                        if (emailError) setEmailError('');
                                    }}
                                    error={emailError}
                                    autoComplete="email"
                                    icon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    }
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    size="lg"
                                    loading={loading}
                                    disabled={loading}
                                >
                                    {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                                </Button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-petwell-blue hover:text-petwell-teal transition-colors duration-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
