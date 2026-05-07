'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '@/services/api';
import { getToken, removeToken } from '@/utils/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Link from 'next/link';
import type { FormState } from '@/types';

interface Fields {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

interface FieldErrors {
    current_password?: string;
    new_password?: string;
    confirm_password?: string;
}

export default function ChangePasswordPage() {
    const router = useRouter();
    const [fields, setFields] = useState<Fields>({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [form, setForm] = useState<FormState>({ loading: false, error: null, success: null });

    // Protección de ruta: redirigir si no hay token
    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/auth');
        }
    }, [router]);

    const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFields(f => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors(er => ({ ...er, [key]: undefined }));
    };

    const validate = (): boolean => {
        const newErrors: FieldErrors = {};

        if (!fields.current_password.trim()) {
            newErrors.current_password = 'La contraseña actual es obligatoria.';
        }
        if (!fields.new_password.trim()) {
            newErrors.new_password = 'La nueva contraseña es obligatoria.';
        } else if (fields.new_password.length < 8) {
            newErrors.new_password = 'La nueva contraseña debe tener al menos 8 caracteres.';
        } else if (fields.new_password === fields.current_password) {
            newErrors.new_password = 'La nueva contraseña debe ser diferente a la actual.';
        }
        if (!fields.confirm_password.trim()) {
            newErrors.confirm_password = 'Debes confirmar la nueva contraseña.';
        } else if (fields.confirm_password !== fields.new_password) {
            newErrors.confirm_password = 'Las contraseñas no coinciden.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        setForm({ loading: true, error: null, success: null });
        try {
            const res = await changePassword(token, {
                current_password: fields.current_password,
                new_password: fields.new_password,
            });

            if (res.success) {
                setForm({
                    loading: false,
                    error: null,
                    success: '¡Contraseña actualizada exitosamente! Por seguridad, inicia sesión nuevamente.',
                });
                // Cerrar sesión tras cambio exitoso
                setTimeout(() => {
                    removeToken();
                    router.push('/auth');
                }, 2500);
            } else {
                setForm({ loading: false, error: res.message || 'Error al cambiar la contraseña.', success: null });
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
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-petwell-navy rounded-2xl shadow-lg mb-5">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-petwell-navy">Cambiar contraseña</h1>
                    <p className="text-gray-500 mt-2 text-sm">Actualiza tu contraseña de acceso a PetWell</p>
                </div>

                {/* Tarjeta */}
                <div className="card-glass p-8 animate-slide-up">

                    {/* Alertas */}
                    {form.error && (
                        <div className="mb-5">
                            <Alert
                                type="error"
                                message={form.error}
                                onClose={() => setForm(f => ({ ...f, error: null }))}
                            />
                        </div>
                    )}
                    {form.success && (
                        <div className="mb-5">
                            <Alert type="success" message={form.success} />
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">

                        <Input
                            id="current-password"
                            label="Contraseña actual"
                            type="password"
                            placeholder="Tu contraseña actual"
                            value={fields.current_password}
                            onChange={set('current_password')}
                            error={errors.current_password}
                            autoComplete="current-password"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />

                        <Input
                            id="new-password"
                            label="Nueva contraseña"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            value={fields.new_password}
                            onChange={set('new_password')}
                            error={errors.new_password}
                            autoComplete="new-password"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            }
                        />

                        <Input
                            id="confirm-password"
                            label="Confirmar nueva contraseña"
                            type="password"
                            placeholder="Repite tu nueva contraseña"
                            value={fields.confirm_password}
                            onChange={set('confirm_password')}
                            error={errors.confirm_password}
                            autoComplete="new-password"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            }
                        />

                        {/* Aviso de seguridad */}
                        <div className="flex items-start gap-2 p-3 bg-petwell-light rounded-xl border border-petwell-blue/20">
                            <svg className="w-4 h-4 text-petwell-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-petwell-navy/70 leading-relaxed">
                                Al cambiar tu contraseña, tu sesión actual se cerrará automáticamente por seguridad.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            loading={form.loading}
                            disabled={form.loading || !!form.success}
                        >
                            {form.loading ? 'Actualizando...' : 'Cambiar contraseña'}
                        </Button>
                    </form>

                    {/* Links */}
                    <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-gray-500">
                        <Link
                            href="/dashboard"
                            className="font-semibold text-petwell-blue hover:text-petwell-teal transition-colors duration-200"
                        >
                            ← Volver al panel
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
