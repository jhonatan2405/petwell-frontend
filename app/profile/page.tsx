'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, removeToken } from '@/utils/auth';
import { updateProfile, changePassword } from '@/services/userService';
import { updateClinic, getClinic } from '@/services/clinicService';
import type { UpdateClinicPayload } from '@/services/clinicService';
import { useAuthContext } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ImageUploadBox } from '@/components/ui/ImageUploadBox';
import { uploadUserPhoto } from '@/services/userService';
import type { FormState, ClinicDetail } from '@/types';

type Tab = 'info' | 'password' | 'clinic';

// ─── Tab selector ─────────────────────────────────────────────────────────────
function TabButton({ active, onClick, children }: {
    active: boolean; onClick: () => void; children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                active
                    ? 'bg-petwell-blue text-white shadow-md'
                    : 'text-gray-500 hover:text-petwell-navy hover:bg-petwell-light'
            }`}
        >
            {children}
        </button>
    );
}

// ─── Información personal ─────────────────────────────────────────────────────
function InfoTab({ onSaved }: { onSaved: () => Promise<void> }) {
    const { user, token } = useAuthContext();
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
    const [form, setForm] = useState<FormState>({ loading: false, error: null, success: null });

    // Sync fields when user loads
    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setPhone(user.phone ?? '');
        }
    }, [user]);

    const validate = (): boolean => {
        const e: typeof errors = {};
        if (!name.trim()) e.name = 'El nombre es obligatorio.';
        else if (name.trim().length < 2) e.name = 'Mínimo 2 caracteres.';
        if (!email.trim()) e.email = 'El correo electrónico es obligatorio.';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Correo inválido.';
        if (phone && !/^\+?[\d\s\-()]{7,}$/.test(phone)) e.phone = 'Teléfono inválido.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;
        const jwt = token ?? getToken();
        if (!jwt) return;

        setForm({ loading: true, error: null, success: null });
        try {
            const payload: { name: string; email: string; phone?: string } = {
                name: name.trim(),
                email: email.trim(),
            };
            if (phone.trim()) payload.phone = phone.trim();

            const res = await updateProfile(jwt, payload);
            if (res.success) {
                setForm({ loading: false, error: null, success: 'Perfil actualizado correctamente.' });
                await onSaved(); // refresh AuthContext user
            } else {
                setForm({ loading: false, error: res.message ?? 'Error al actualizar el perfil.', success: null });
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
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {form.error && <Alert type="error" message={form.error} onClose={() => setForm(f => ({ ...f, error: null }))} />}
            {form.success && <Alert type="success" message={form.success} onClose={() => setForm(f => ({ ...f, success: null }))} />}

            <Input
                id="profile-name"
                label="Nombre completo"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={e => { setName(e.target.value); setErrors(er => ({ ...er, name: undefined })); }}
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
                id="profile-email"
                label="Correo electrónico"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: undefined })); }}
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
                id="profile-phone"
                label="Teléfono (opcional)"
                type="tel"
                placeholder="+57 300 000 0000"
                value={phone}
                onChange={e => { setPhone(e.target.value); setErrors(er => ({ ...er, phone: undefined })); }}
                error={errors.phone}
                autoComplete="tel"
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                }
            />

            <Button type="submit" variant="primary" fullWidth size="lg" loading={form.loading} disabled={form.loading}>
                {form.loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
        </form>
    );
}

// ─── Cambiar contraseña ───────────────────────────────────────────────────────
function PasswordTab() {
    const { token } = useAuthContext();
    const router = useRouter();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
    const [form, setForm] = useState<FormState>({ loading: false, error: null, success: null });

    const validate = () => {
        const e: typeof errors = {};
        if (!current) e.current = 'Ingresa tu contraseña actual.';
        if (!next) e.next = 'Ingresa la nueva contraseña.';
        else if (next.length < 6) e.next = 'Mínimo 6 caracteres.';
        if (!confirm) e.confirm = 'Confirma la nueva contraseña.';
        else if (next !== confirm) e.confirm = 'Las contraseñas no coinciden.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;
        const jwt = token ?? getToken();
        if (!jwt) { router.push('/login'); return; }

        setForm({ loading: true, error: null, success: null });
        try {
            const res = await changePassword(jwt, { current_password: current, new_password: next });
            if (res.success) {
                setForm({ loading: false, error: null, success: '¡Contraseña actualizada correctamente!' });
                setCurrent(''); setNext(''); setConfirm('');
            } else {
                setForm({ loading: false, error: res.message || 'Error al cambiar la contraseña.', success: null });
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor.';
            if (msg.includes('401') || msg.toLowerCase().includes('token')) {
                removeToken(); router.push('/login'); return;
            }
            setForm({ loading: false, error: msg, success: null });
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {form.error && <Alert type="error" message={form.error} onClose={() => setForm(f => ({ ...f, error: null }))} />}
            {form.success && <Alert type="success" message={form.success} onClose={() => setForm(f => ({ ...f, success: null }))} />}

            <Input
                id="pw-current"
                label="Contraseña actual"
                type="password"
                placeholder="Tu contraseña actual"
                value={current}
                onChange={e => { setCurrent(e.target.value); setErrors(er => ({ ...er, current: undefined })); }}
                error={errors.current}
                autoComplete="current-password"
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                }
            />
            <Input
                id="pw-new"
                label="Nueva contraseña"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={next}
                onChange={e => { setNext(e.target.value); setErrors(er => ({ ...er, next: undefined })); }}
                error={errors.next}
                autoComplete="new-password"
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                }
            />
            <Input
                id="pw-confirm"
                label="Confirmar nueva contraseña"
                type="password"
                placeholder="Repite la nueva contraseña"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setErrors(er => ({ ...er, confirm: undefined })); }}
                error={errors.confirm}
                autoComplete="new-password"
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            />

            <Button type="submit" variant="primary" fullWidth size="lg" loading={form.loading} disabled={form.loading}>
                {form.loading ? 'Actualizando...' : 'Cambiar contraseña'}
            </Button>
        </form>
    );
}

// ─── Tab Mi Clínica (solo CLINIC_ADMIN) ──────────────────────────────────────
function ClinicTab() {
    const { user, token } = useAuthContext();
    const [fetchLoading, setFetchLoading] = useState(true);
    const [clinicName, setClinicName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [openingHours, setOpeningHours] = useState('');
    const [specialties, setSpecialties] = useState('');
    const [form, setForm] = useState<FormState>({ loading: false, error: null, success: null });

    // Cargar datos actuales de la clínica al montar
    useEffect(() => {
        if (!user?.clinic_id) {
            setFetchLoading(false);
            return;
        }
        const jwt = token ?? getToken();
        getClinic(user.clinic_id, jwt ?? undefined)
            .then((res) => {
                const c: ClinicDetail | undefined = res.data;
                if (c) {
                    setClinicName(c.clinic_name ?? '');
                    setAddress(c.address ?? '');
                    setPhone(c.phone ?? '');
                    setEmail(c.email ?? '');
                    setCity(c.city ?? '');
                    setOpeningHours(c.opening_hours ?? '');
                    setSpecialties(c.specialties ?? '');
                }
            })
            .catch(() => { /* fallo silencioso — el form sigue editable */ })
            .finally(() => setFetchLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.clinic_id]);

    if (!user?.clinic_id) {
        return (
            <Alert
                type="error"
                message="No se encontró el ID de clínica en tu perfil. Intenta cerrar sesión e iniciar de nuevo."
            />
        );
    }

    if (fetchLoading) {
        return (
            <div className="flex justify-center py-10">
                <LoadingSpinner size={40} text="Cargando datos de la clínica..." />
            </div>
        );
    }

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const jwt = token ?? getToken();
        if (!jwt || !user.clinic_id) return;

        const payload: UpdateClinicPayload = {};
        if (clinicName.trim()) payload.clinic_name = clinicName.trim();
        if (address.trim()) payload.address = address.trim();
        if (phone.trim()) payload.phone = phone.trim();
        if (email.trim()) payload.email = email.trim();
        if (city.trim()) payload.city = city.trim();
        if (openingHours.trim()) payload.opening_hours = openingHours.trim();
        if (specialties.trim()) payload.specialties = specialties.trim();

        setForm({ loading: true, error: null, success: null });
        try {
            const res = await updateClinic(user.clinic_id, payload, jwt);
            if (res.success) {
                setForm({ loading: false, error: null, success: 'Datos de la clínica actualizados correctamente.' });
            } else {
                setForm({ loading: false, error: res.message ?? 'Error al actualizar la clínica.', success: null });
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
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {form.error && <Alert type="error" message={form.error} onClose={() => setForm(f => ({ ...f, error: null }))} />}
            {form.success && <Alert type="success" message={form.success} onClose={() => setForm(f => ({ ...f, success: null }))} />}

            <Input
                id="clinic-name"
                label="Nombre de la clínica"
                type="text"
                placeholder="Mi Clínica Veterinaria"
                value={clinicName}
                onChange={e => setClinicName(e.target.value)}
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                }
            />
            <Input
                id="clinic-address"
                label="Dirección"
                type="text"
                placeholder="Calle 123 # 45-67"
                value={address}
                onChange={e => setAddress(e.target.value)}
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    id="clinic-city"
                    label="Ciudad"
                    type="text"
                    placeholder="Bogotá"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h2v11H4zm7 0h2v11h-2zm7 0h2v11h-2z" />
                        </svg>
                    }
                />
                <Input
                    id="clinic-phone"
                    label="Teléfono"
                    type="tel"
                    placeholder="+57 300 000 0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    }
                />
            </div>
            <Input
                id="clinic-email"
                label="Correo de la clínica"
                type="email"
                placeholder="clinica@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                }
            />

            {/* ── Divider */}
            <hr className="border-gray-100" />

            {/* Horarios de atención */}
            <div>
                <label htmlFor="clinic-hours" className="block text-sm font-semibold text-petwell-navy mb-1.5">
                    Horarios de atención
                    <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </label>
                <textarea
                    id="clinic-hours"
                    rows={3}
                    placeholder="Lunes a Viernes 8:00 - 18:00&#10;Sábados 9:00 - 13:00"
                    value={openingHours}
                    onChange={e => setOpeningHours(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-petwell-navy placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-petwell-teal/40 focus:border-petwell-teal transition-all"
                />
                <p className="mt-1 text-xs text-gray-400">Indica los días y horarios de atención de tu clínica.</p>
            </div>

            {/* Especialidades */}
            <div>
                <label htmlFor="clinic-specialties" className="block text-sm font-semibold text-petwell-navy mb-1.5">
                    Especialidades
                    <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </label>
                <textarea
                    id="clinic-specialties"
                    rows={3}
                    placeholder="Cirugía, Dermatología, Vacunación, Medicina general"
                    value={specialties}
                    onChange={e => setSpecialties(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-petwell-navy placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-petwell-teal/40 focus:border-petwell-teal transition-all"
                />
                <p className="mt-1 text-xs text-gray-400">Lista las especialidades médicas que ofrece tu clínica.</p>
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" loading={form.loading} disabled={form.loading}>
                {form.loading ? 'Guardando...' : 'Actualizar clínica'}
            </Button>
        </form>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ProfilePage() {
    const { user, token, loading, refreshUser } = useAuthContext();
    const router = useRouter();
    const [tab, setTab] = useState<Tab>('info');
    const isClinicAdmin = user?.role === 'CLINIC_ADMIN';

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingSpinner size={56} text="Cargando perfil..." />
            </div>
        );
    }
    if (!user) return null;

    const initials = user.name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('');

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 px-4 py-10">
            <div className="max-w-lg mx-auto">

                {/* Encabezado */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="flex justify-center mb-4">
                        <ImageUploadBox
                            currentImageUrl={user.photo_url}
                            name={user.name}
                            onUpload={async (file) => {
                                const jwt = token ?? getToken();
                                if (!jwt) return;
                                try {
                                    await uploadUserPhoto(jwt, file);
                                    await refreshUser();
                                } catch (error: any) {
                                    alert(error.message || 'Error al subir la imagen');
                                }
                            }}
                        />
                    </div>
                    <h1 className="text-2xl font-extrabold text-petwell-navy">Mi Cuenta</h1>
                    <p className="text-gray-400 text-sm mt-1">{user.email}</p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl p-1.5 mb-6 animate-fade-in">
                    <TabButton active={tab === 'info'} onClick={() => setTab('info')}>
                        Información personal
                    </TabButton>
                    <TabButton active={tab === 'password'} onClick={() => setTab('password')}>
                        Cambiar contraseña
                    </TabButton>
                    {isClinicAdmin && (
                        <TabButton active={tab === 'clinic'} onClick={() => setTab('clinic')}>
                            Mi Clínica
                        </TabButton>
                    )}
                </div>

                {/* Contenido */}
                <div className="card-glass p-8 animate-slide-up">
                    {tab === 'info'
                        ? <InfoTab onSaved={refreshUser} />
                        : tab === 'password'
                        ? <PasswordTab />
                        : <ClinicTab />
                    }
                </div>

            </div>
        </div>
    );
}
