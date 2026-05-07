'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerOwner } from '@/services/authService';
import { registerClinic } from '@/services/clinicService';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface FieldErrors {
    name?: string; email?: string; password?: string;
    clinic_name?: string; admin_name?: string; phone?: string;
    address?: string; city?: string; tax_id?: string;
}

export default function RegisterForm() {
    const router = useRouter();
    const [mode, setMode] = useState<'OWNER' | 'CLINIC'>('OWNER');

    // Múltiples campos combinados para ambos formularios
    const [fields, setFields] = useState({
        name: '', email: '', phone: '', password: '',
        clinic_name: '', admin_name: '', address: '', city: '', tax_id: '',
        opening_hours: '', specialties: ''
    });

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [emailDuplicate, setEmailDuplicate] = useState(false);

    const handleFieldChange = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFields(prev => ({ ...prev, [key]: e.target.value }));
        setFieldErrors(prev => ({ ...prev, [key]: undefined }));
        setServerError(null);
        if (key === 'email') setEmailDuplicate(false);
    };

    const validateOwner = (): boolean => {
        const errs: FieldErrors = {};
        if (!fields.name.trim()) errs.name = 'Requerido.';
        if (!fields.email.trim()) errs.email = 'Requerido.';
        else if (!/^\S+@\S+\.\S+$/.test(fields.email)) errs.email = 'Correo inválido.';
        if (!fields.password.trim()) errs.password = 'Requerido.';
        else if (fields.password.length < 6) errs.password = 'Mín. 6 chars.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateClinic = (): boolean => {
        const errs: FieldErrors = {};
        if (!fields.clinic_name.trim()) errs.clinic_name = 'Requerido.';
        if (!fields.admin_name.trim()) errs.admin_name = 'Requerido.';
        if (!fields.email.trim()) errs.email = 'Requerido.';
        else if (!/^\S+@\S+\.\S+$/.test(fields.email)) errs.email = 'Correo inválido.';
        if (!fields.password.trim()) errs.password = 'Requerido.';
        else if (fields.password.length < 6) errs.password = 'Mínimo 6 caracteres.';
        if (!fields.phone.trim()) errs.phone = 'Requerido.';
        if (!fields.address.trim()) errs.address = 'Requerido.';
        if (!fields.city.trim()) errs.city = 'Requerido.';
        if (!fields.tax_id.trim()) errs.tax_id = 'Requerido.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (mode === 'OWNER') {
            if (!validateOwner()) return;
            setLoading(true);
            try {
                const res = await registerOwner({
                    name: fields.name.trim(),
                    email: fields.email.trim(),
                    password: fields.password,
                    ...(fields.phone.trim() && { phone: fields.phone.trim() }),
                });
                if (res.success) {
                    setSuccessMsg('¡Cuenta registrada! Redirigiendo a verificación...');
                    setTimeout(() => router.push(`/verify-account?email=${encodeURIComponent(fields.email.trim())}`), 1800);
                } else setServerError(res.message || 'Error al registrar.');
            } catch (err: any) {
                if ((err as any).status === 409) {
                    setEmailDuplicate(true);
                    setFieldErrors(prev => ({ ...prev, email: 'Este correo ya está registrado.' }));
                } else {
                    setServerError(err.message || 'Error de conexión.');
                }
            }
            finally { setLoading(false); }
            
        } else {
            if (!validateClinic()) return;
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
                    setSuccessMsg('¡Clínica registrada! Redirigiendo a verificación...');
                    setTimeout(() => router.push(`/verify-account?email=${encodeURIComponent(fields.email.trim())}`), 1800);
                } else setServerError(res.message || 'Error al registrar.');
            } catch (err: any) {
                if ((err as any).status === 409) {
                    setEmailDuplicate(true);
                    setFieldErrors(prev => ({ ...prev, email: 'Este correo ya está registrado.' }));
                } else {
                    setServerError(err.message || 'Error de conexión.');
                }
            }
            finally { setLoading(false); }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="sign-up-form auth-form min-h-0" noValidate>
            <div className="flex flex-col items-center mb-8 z-10 w-full max-w-[460px] pt-4 animate-slide-up">
                <div className="w-[88px] h-[88px] bg-white rounded-3xl shadow-xl flex items-center justify-center mb-5 border border-gray-50 animate-float">
                    <img src="/logo.png" alt="PetWell Logo" className="w-14 h-14 object-contain" />
                </div>
                <h1 className="text-[32px] font-extrabold text-[#1e3a5f] mb-2 tracking-tight">
                    Únete a <span className="text-petwell-teal">PetWell</span>
                </h1>
                <p className="text-gray-500 text-[15px] font-medium text-center">
                    Crea tu cuenta para comenzar
                </p>
            </div>

            <div className={`bg-white p-9 rounded-[28px] shadow-[0_20px_60px_-15px_rgba(30,58,95,0.15)] w-full max-w-[460px] flex flex-col items-center border border-gray-50/50 backdrop-blur-sm overflow-y-auto custom-scrollbar transition-all duration-300 animate-slide-up ${mode === 'CLINIC' ? 'max-h-[65vh]' : 'max-h-[75vh]'}`} style={{ animationDelay: '0.1s' }}>
                
                {/* Selector visual Owner vs Clinic */}
                <div className="flex w-full bg-gray-100/80 p-1.5 rounded-xl mb-6">
                    <button
                        type="button"
                        onClick={() => { setMode('OWNER'); setServerError(null); }}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'OWNER' ? 'bg-white text-petwell-navy shadow border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Dueño de mascota
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('CLINIC'); setServerError(null); }}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'CLINIC' ? 'bg-white text-petwell-navy shadow border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Clínica
                    </button>
                </div>

                {serverError && <div className="w-full mb-4"><Alert type="error" message={serverError} onClose={() => setServerError(null)} /></div>}
                {emailDuplicate && (
                    <div className="w-full mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="text-sm">
                            <p className="font-semibold text-amber-800">Este correo ya tiene una cuenta.</p>
                            <p className="text-amber-700 mt-0.5">
                                ¿Quieres{' '}
                                <button type="button" onClick={() => router.push('/auth')} className="underline font-semibold hover:text-amber-900">iniciar sesión</button>
                                {' '}o{' '}
                                <button type="button" onClick={() => router.push(`/verify-account?email=${encodeURIComponent(fields.email.trim())}`)} className="underline font-semibold hover:text-amber-900">verificar tu cuenta</button>?
                            </p>
                        </div>
                    </div>
                )}
                {successMsg && <div className="w-full mb-4"><Alert type="success" message={successMsg} /></div>}

                <div className="w-full space-y-4">
                    {mode === 'OWNER' && (
                        <>
                            <Input label="Nombre completo" type="text" placeholder="Juan Pérez" value={fields.name} onChange={handleFieldChange('name')} error={fieldErrors.name} />
                            <Input label="Correo electrónico" type="email" placeholder="ejemplo@correo.com" value={fields.email} onChange={handleFieldChange('email')} error={fieldErrors.email} />
                            <Input label="Teléfono (opcional)" type="tel" placeholder="+57 300 000 0000" value={fields.phone} onChange={handleFieldChange('phone')} />
                            <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" value={fields.password} onChange={handleFieldChange('password')} error={fieldErrors.password} />
                        </>
                    )}

                    {mode === 'CLINIC' && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Nombre d. clínica" type="text" placeholder="VetSalud" value={fields.clinic_name} onChange={handleFieldChange('clinic_name')} error={fieldErrors.clinic_name} />
                                <Input label="Nombre Admin" type="text" placeholder="María G." value={fields.admin_name} onChange={handleFieldChange('admin_name')} error={fieldErrors.admin_name} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Correo" type="email" placeholder="clinica@..." value={fields.email} onChange={handleFieldChange('email')} error={fieldErrors.email} />
                                <Input label="Contraseña" type="password" placeholder="••••••" value={fields.password} onChange={handleFieldChange('password')} error={fieldErrors.password} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Ciudad" type="text" placeholder="Bogotá" value={fields.city} onChange={handleFieldChange('city')} error={fieldErrors.city} />
                                <Input label="Teléfono" type="tel" placeholder="3000000000" value={fields.phone} onChange={handleFieldChange('phone')} error={fieldErrors.phone} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Dirección" type="text" placeholder="Calle 123" value={fields.address} onChange={handleFieldChange('address')} error={fieldErrors.address} />
                                <Input label="NIT / RUT" type="text" placeholder="900.123.456-7" value={fields.tax_id} onChange={handleFieldChange('tax_id')} error={fieldErrors.tax_id} />
                            </div>
                            
                            {/* Opcionales en Clínica */}
                            <div>
                                <label className="block text-xs font-semibold text-petwell-navy mb-1">Horarios (opcional)</label>
                                <textarea rows={1} value={fields.opening_hours} onChange={handleFieldChange('opening_hours')} placeholder="Lun-Vie 8-6 / Sab 9-1" className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 outline-none focus:border-petwell-blue custom-scrollbar" />
                            </div>
                        </>
                    )}
                    
                    <Button type="submit" fullWidth size="lg" loading={loading} disabled={loading || !!successMsg} className="bg-[#1e3a5f] hover:bg-[#1a365d] text-white border-none mt-2 shadow-md hover:shadow-lg">
                        {loading ? 'Cargando...' : 'Crear cuenta'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
