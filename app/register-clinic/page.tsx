'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerClinic } from '@/services/clinicService';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

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

export default function RegisterClinicPage() {
    const router = useRouter();
    const [fields, setFields] = useState<ClinicFields>({
        clinic_name: '', admin_name: '', email: '', password: '', phone: '', address: '', city: '', tax_id: '',
        opening_hours: '', specialties: '',
    });
    const [errors, setErrors] = useState<ClinicErrors>({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const set = (key: keyof ClinicFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFields(f => ({ ...f, [key]: e.target.value }));
        setErrors(er => ({ ...er, [key]: undefined }));
        setServerError(null);
    };

    const validate = (): boolean => {
        const e: ClinicErrors = {};
        if (!fields.clinic_name.trim()) e.clinic_name = 'El nombre de la clínica es obligatorio.';
        if (!fields.admin_name.trim()) e.admin_name = 'El nombre del administrador es obligatorio.';
        if (!fields.email.trim()) e.email = 'El correo electrónico es obligatorio.';
        else if (!/^\S+@\S+\.\S+$/.test(fields.email)) e.email = 'Ingresa un correo válido.';
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
        setServerError(null);
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
                setSuccessMsg('¡Clínica registrada exitosamente! Redirigiendo a verificación...');
                setTimeout(() => router.push('/verify-account'), 2000);
            } else {
                setServerError(res.message || 'Error al registrar la clínica.');
            }
        } catch (err: unknown) {
            setServerError(err instanceof Error ? err.message : 'Error al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-petwell-light/30">
            <div className="w-full max-w-xl">
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-petwell-teal rounded-2xl shadow-lg mb-5">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-petwell-navy">Registro de Clínica</h1>
                    <p className="text-gray-500 mt-2 text-sm">Registra tu clínica veterinaria en PetWell</p>
                </div>

                <div className="card-glass p-8 animate-slide-up">
                    {serverError && (
                        <div className="mb-5">
                            <Alert type="error" message={serverError} onClose={() => setServerError(null)} />
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-5">
                            <Alert type="success" message={successMsg} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input id="clinic-name" label="Nombre de la clínica" type="text" placeholder="Clínica VetSalud"
                                value={fields.clinic_name} onChange={set('clinic_name')} error={errors.clinic_name} />
                            <Input id="clinic-admin" label="Nombre del administrador" type="text" placeholder="María García"
                                value={fields.admin_name} onChange={set('admin_name')} error={errors.admin_name} />
                        </div>
                        <Input id="clinic-email" label="Correo electrónico" type="email" placeholder="clinica@correo.com"
                            value={fields.email} onChange={set('email')} error={errors.email} autoComplete="email" />
                        <Input id="clinic-password" label="Contraseña" type="password" placeholder="Mínimo 6 caracteres"
                            value={fields.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
                        <Input id="clinic-phone" label="Teléfono" type="tel" placeholder="+57 300 000 0000"
                            value={fields.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
                        <Input id="clinic-address" label="Dirección" type="text" placeholder="Calle 123 # 45-67"
                            value={fields.address} onChange={set('address')} error={errors.address} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input id="clinic-city" label="Ciudad" type="text" placeholder="Bogotá"
                                value={fields.city} onChange={set('city')} error={errors.city} />
                            <Input id="clinic-taxid" label="NIT / RUT" type="text" placeholder="900.123.456-7"
                                value={fields.tax_id} onChange={set('tax_id')} error={errors.tax_id} />
                        </div>

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

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            ¿Eres dueño de mascota?{' '}
                            <Link href="/auth" className="font-semibold text-petwell-blue hover:text-petwell-teal transition-colors duration-200">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
