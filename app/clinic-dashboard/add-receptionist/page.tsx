'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addReceptionist } from '@/services/userService';
import { getToken } from '@/utils/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import type { FormState } from '@/types';

interface Fields {
    name: string;
    email: string;
    phone: string;
    password: string;
}

interface FieldErrors {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
}

export default function AddReceptionistPage() {
    const router = useRouter();
    const [fields, setFields] = useState<Fields>({
        name: '', email: '', phone: '', password: ''
    });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [form, setForm] = useState<FormState>({ loading: false, error: null, success: null });

    const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFields(f => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors(er => ({ ...er, [key]: undefined }));
    };

    const validate = (): boolean => {
        const e: FieldErrors = {};
        if (!fields.name.trim()) e.name = 'El nombre es obligatorio.';
        else if (fields.name.trim().length < 2) e.name = 'Mínimo 2 caracteres.';
        if (!fields.email.trim()) e.email = 'El correo electrónico es obligatorio.';
        else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = 'Ingresa un correo válido.';
        if (fields.phone && !/^\+?[\d\s\-()]{7,}$/.test(fields.phone)) e.phone = 'Ingresa un teléfono válido.';
        if (!fields.password.trim()) e.password = 'La contraseña es obligatoria.';
        else if (fields.password.length < 6) e.password = 'Mínimo 6 caracteres.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;

        const token = getToken();
        if (!token) { router.push('/login'); return; }

        setForm({ loading: true, error: null, success: null });
        try {
            const payload: { name: string; email: string; password: string; phone?: string } = {
                name: fields.name.trim(),
                email: fields.email.trim(),
                password: fields.password,
            };
            if (fields.phone.trim()) payload.phone = fields.phone.trim();

            const res = await addReceptionist(token, payload);
            if (res.success) {
                setForm({ loading: false, error: null, success: `¡Recepcionista "${fields.name.trim()}" agregado exitosamente!` });
                setFields({ name: '', email: '', phone: '', password: '' });
                router.push('/clinic-dashboard');
                router.refresh();
            } else {
                setForm({ loading: false, error: res.message || 'Error al agregar el recepcionista.', success: null });
            }
        } catch (err: unknown) {
            setForm({
                loading: false,
                error: err instanceof Error ? err.message : 'Error al conectar con el servidor.',
                success: null,
            });
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-petwell-light/30">
            <div className="w-full max-w-md">
                {/* Encabezado */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl shadow-lg mb-5">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-petwell-navy">Agregar Recepcionista</h1>
                    <p className="text-gray-500 mt-2 text-sm">Registra un nuevo recepcionista en tu clínica</p>
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
                            <Alert type="success" message={form.success} onClose={() => setForm(f => ({ ...f, success: null }))} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        <Input
                            id="rec-name"
                            label="Nombre completo"
                            type="text"
                            placeholder="Ana Pérez"
                            value={fields.name}
                            onChange={set('name')}
                            error={errors.name}
                            autoComplete="name"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            }
                        />
                        <Input
                            id="rec-email"
                            label="Correo electrónico"
                            type="email"
                            placeholder="recepcion@clinica.com"
                            value={fields.email}
                            onChange={set('email')}
                            error={errors.email}
                            autoComplete="email"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            }
                        />
                        <Input
                            id="rec-phone"
                            label="Teléfono (opcional)"
                            type="tel"
                            placeholder="+57 300 000 0000"
                            value={fields.phone}
                            onChange={set('phone')}
                            error={errors.phone}
                            autoComplete="tel"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            }
                        />
                        <Input
                            id="rec-password"
                            label="Contraseña temporal"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={fields.password}
                            onChange={set('password')}
                            error={errors.password}
                            autoComplete="new-password"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            size="lg"
                            loading={form.loading}
                            disabled={form.loading}
                        >
                            {form.loading ? 'Agregando recepcionista...' : 'Agregar Recepcionista'}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <Link
                            href="/clinic-dashboard"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-petwell-blue hover:text-petwell-teal transition-colors duration-200"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Volver al Panel de la Clínica
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
