'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerOwner } from '@/services/authService';
import { registerClinic } from '@/services/clinicService';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import type { AccountType, FormState } from '@/types';

// ─── Tipos: Dueño de mascota ──────────────────────────────────────────────────
interface OwnerFields { name: string; email: string; phone: string; password: string; }
interface OwnerErrors { name?: string; email?: string; phone?: string; password?: string; }

// ─── Tipos: Clínica veterinaria ───────────────────────────────────────────────
interface ClinicFields {
    clinic_name: string;
    admin_name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    city: string;
    tax_id: string;
    opening_hours: string;
    specialties: string;
}
interface ClinicErrors {
    clinic_name?: string;
    admin_name?: string;
    email?: string;
    password?: string;
    phone?: string;
    address?: string;
    city?: string;
    tax_id?: string;
}

// ─── Formulario: Dueño de mascota ─────────────────────────────────────────────
function OwnerForm({ onSuccess, onError }: { onSuccess: (msg: string) => void; onError: (msg: string) => void }) {
    const router = useRouter();
    const [fields, setFields] = useState<OwnerFields>({ name: '', email: '', phone: '', password: '' });
    const [errors, setErrors] = useState<OwnerErrors>({});
    const [loading, setLoading] = useState(false);

    const set = (key: keyof OwnerFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFields(f => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors(er => ({ ...er, [key]: undefined }));
    };

    const validate = (): boolean => {
        const e: OwnerErrors = {};
        if (!fields.name.trim()) e.name = 'El nombre es obligatorio.';
        else if (fields.name.trim().length < 2) e.name = 'Mínimo 2 caracteres.';
        if (!fields.email.trim()) e.email = 'El correo electrónico es obligatorio.';
        else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = 'Ingresa un correo válido.';
        if (fields.phone && !/^[0-9+\-\s()]{7,15}$/.test(fields.phone)) e.phone = 'Ingresa un teléfono válido.';
        if (!fields.password.trim()) e.password = 'La contraseña es obligatoria.';
        else if (fields.password.length < 6) e.password = 'Mínimo 6 caracteres.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const res = await registerOwner({
                name: fields.name.trim(),
                email: fields.email.trim(),
                password: fields.password,
                ...(fields.phone.trim() && { phone: fields.phone.trim() }),
            });
            if (res.success) {
                onSuccess('¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                onError(res.message || 'Error al crear la cuenta.');
            }
        } catch (err: unknown) {
            onError(err instanceof Error ? err.message : 'Error al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input id="owner-name" label="Nombre completo" type="text" placeholder="Juan Pérez"
                value={fields.name} onChange={set('name')} error={errors.name} autoComplete="name"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
            <Input id="owner-email" label="Correo electrónico" type="email" placeholder="ejemplo@correo.com"
                value={fields.email} onChange={set('email')} error={errors.email} autoComplete="email"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
            <Input id="owner-phone" label="Teléfono (opcional)" type="tel" placeholder="+57 300 000 0000"
                value={fields.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} />
            <Input id="owner-password" label="Contraseña" type="password" placeholder="Mínimo 6 caracteres"
                value={fields.password} onChange={set('password')} error={errors.password} autoComplete="new-password"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
            <Button type="submit" variant="secondary" fullWidth size="lg" loading={loading} disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
        </form>
    );
}

// ─── Formulario: Clínica Veterinaria ─────────────────────────────────────────
function ClinicForm({ onSuccess, onError }: { onSuccess: (msg: string) => void; onError: (msg: string) => void }) {
    const router = useRouter();
    const [fields, setFields] = useState<ClinicFields>({
        clinic_name: '', admin_name: '', email: '', password: '', phone: '', address: '', city: '', tax_id: '',
        opening_hours: '', specialties: '',
    });
    const [errors, setErrors] = useState<ClinicErrors>({});
    const [loading, setLoading] = useState(false);

    const set = (key: keyof ClinicFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFields(f => ({ ...f, [key]: e.target.value }));
        setErrors(er => ({ ...er, [key]: undefined }));
    };

    const validate = (): boolean => {
        const e: ClinicErrors = {};
        if (!fields.clinic_name.trim()) e.clinic_name = 'El nombre de la clínica es obligatorio.';
        if (!fields.admin_name.trim()) e.admin_name = 'El nombre del administrador es obligatorio.';
        if (!fields.email.trim()) e.email = 'El correo electrónico es obligatorio.';
        else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = 'Ingresa un correo válido.';
        if (!fields.password.trim()) e.password = 'La contraseña es obligatoria.';
        else if (fields.password.length < 6) e.password = 'Mínimo 6 caracteres.';
        if (!fields.phone.trim()) e.phone = 'El teléfono es obligatorio.';
        else if (!/^[0-9+\-\s()]{7,15}$/.test(fields.phone)) e.phone = 'Ingresa un teléfono válido.';
        if (!fields.address.trim()) e.address = 'La dirección es obligatoria.';
        if (!fields.city.trim()) e.city = 'La ciudad es obligatoria.';
        if (!fields.tax_id.trim()) e.tax_id = 'El NIT/RUT es obligatorio.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const res = await registerClinic({
                clinic_name: fields.clinic_name.trim(),
                admin_name: fields.admin_name.trim(),
                email: fields.email.trim(),
                password: fields.password,
                phone: fields.phone.trim(),
                address: fields.address.trim(),
                city: fields.city.trim(),
                tax_id: fields.tax_id.trim(),
                ...(fields.opening_hours.trim() && { opening_hours: fields.opening_hours.trim() }),
                ...(fields.specialties.trim() && { specialties: fields.specialties.trim() }),
            });
            if (res.success) {
                onSuccess('¡Clínica registrada exitosamente! Redirigiendo al inicio de sesión...');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                onError(res.message || 'Error al registrar la clínica.');
            }
        } catch (err: unknown) {
            onError(err instanceof Error ? err.message : 'Error al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const phoneIcon = (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    );

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="clinic-name" label="Nombre de la clínica" type="text" placeholder="Clínica VetSalud"
                    value={fields.clinic_name} onChange={set('clinic_name')} error={errors.clinic_name}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
                <Input id="clinic-admin" label="Nombre del administrador" type="text" placeholder="María García"
                    value={fields.admin_name} onChange={set('admin_name')} error={errors.admin_name}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
            </div>
            <Input id="clinic-email" label="Correo electrónico" type="email" placeholder="clinica@correo.com"
                value={fields.email} onChange={set('email')} error={errors.email} autoComplete="email"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
            <Input id="clinic-password" label="Contraseña" type="password" placeholder="Mínimo 6 caracteres"
                value={fields.password} onChange={set('password')} error={errors.password} autoComplete="new-password"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
            <Input id="clinic-phone" label="Teléfono" type="tel" placeholder="+57 300 000 0000"
                value={fields.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel"
                icon={phoneIcon} />
            <Input id="clinic-address" label="Dirección" type="text" placeholder="Calle 123 # 45-67"
                value={fields.address} onChange={set('address')} error={errors.address}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="clinic-city" label="Ciudad" type="text" placeholder="Bogotá"
                    value={fields.city} onChange={set('city')} error={errors.city}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h1v11H4zm15 0h1v11h-1zM9 10h1v11H9zm5 0h1v11h-1z" /></svg>} />
                <Input id="clinic-taxid" label="NIT / RUT" type="text" placeholder="900.123.456-7"
                    value={fields.tax_id} onChange={set('tax_id')} error={errors.tax_id}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
            </div>

            {/* Horarios y Especialidades */}
            <div>
                <label htmlFor="clinic-hours" className="block text-sm font-semibold text-petwell-navy mb-1.5">
                    Horarios de atención <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                    id="clinic-hours"
                    rows={2}
                    placeholder="Lunes a Viernes 8:00 - 18:00, Sábados 9:00 - 13:00"
                    value={fields.opening_hours}
                    onChange={set('opening_hours')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-petwell-navy placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-petwell-teal/40 focus:border-petwell-teal transition-all"
                />
            </div>
            <div>
                <label htmlFor="clinic-specialties" className="block text-sm font-semibold text-petwell-navy mb-1.5">
                    Especialidades <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                    id="clinic-specialties"
                    rows={2}
                    placeholder="Cirugía, Dermatología, Vacunación, Medicina general"
                    value={fields.specialties}
                    onChange={set('specialties')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-petwell-navy placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-petwell-teal/40 focus:border-petwell-teal transition-all"
                />
            </div>

            <Button type="submit" variant="secondary" fullWidth size="lg" loading={loading} disabled={loading}>
                {loading ? 'Registrando clínica...' : 'Registrar clínica'}
            </Button>
        </form>
    );
}

// ─── Página principal de registro ─────────────────────────────────────────────
export default function RegisterPage() {
    const [accountType, setAccountType] = useState<AccountType>('owner');
    const [form, setForm] = useState<FormState>({ loading: false, error: null, success: null });

    const handleSuccess = (msg: string) => setForm({ loading: false, error: null, success: msg });
    const handleError = (msg: string) => setForm({ loading: false, error: msg, success: null });

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-petwell-light/30">
            <div className="w-full max-w-xl">
                {/* Encabezado */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-petwell-teal rounded-2xl shadow-lg mb-5">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-petwell-navy">Crear cuenta</h1>
                    <p className="text-gray-500 mt-2 text-sm">Únete a PetWell — elige el tipo de cuenta</p>
                </div>

                {/* Tarjeta */}
                <div className="card-glass p-8 animate-slide-up">
                    {/* Alertas */}
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

                    {/* Selector de tipo de cuenta */}
                    <div className="grid grid-cols-2 gap-3 mb-7">
                        {/* Dueño de Mascota */}
                        <button
                            type="button"
                            onClick={() => { setAccountType('owner'); setForm({ loading: false, error: null, success: null }); }}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center cursor-pointer
                                ${accountType === 'owner'
                                    ? 'border-petwell-teal bg-petwell-teal/10 text-petwell-navy shadow-md'
                                    : 'border-gray-200 bg-white text-gray-500 hover:border-petwell-blue/40 hover:bg-petwell-light/50'}`}
                        >
                            <span className={accountType === 'owner' ? 'text-petwell-teal' : 'text-gray-400'}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </span>
                            <span className="font-semibold text-sm leading-tight">Dueño de Mascota</span>
                            <span className="text-xs text-gray-400 leading-tight">Gestiona la salud de tu mascota</span>
                        </button>

                        {/* Clínica Veterinaria */}
                        <button
                            type="button"
                            onClick={() => { setAccountType('clinic'); setForm({ loading: false, error: null, success: null }); }}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center cursor-pointer
                                ${accountType === 'clinic'
                                    ? 'border-petwell-teal bg-petwell-teal/10 text-petwell-navy shadow-md'
                                    : 'border-gray-200 bg-white text-gray-500 hover:border-petwell-blue/40 hover:bg-petwell-light/50'}`}
                        >
                            <span className={accountType === 'clinic' ? 'text-petwell-teal' : 'text-gray-400'}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </span>
                            <span className="font-semibold text-sm leading-tight">Clínica Veterinaria</span>
                            <span className="text-xs text-gray-400 leading-tight">Registra tu clínica en la plataforma</span>
                        </button>
                    </div>

                    {/* Formulario dinámico */}
                    {accountType === 'owner'
                        ? <OwnerForm onSuccess={handleSuccess} onError={handleError} />
                        : <ClinicForm onSuccess={handleSuccess} onError={handleError} />
                    }

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            ¿Ya tienes una cuenta?{' '}
                            <Link href="/login" className="font-semibold text-petwell-blue hover:text-petwell-teal transition-colors duration-200">
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
