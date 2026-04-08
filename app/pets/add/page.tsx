'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import { getToken } from '@/utils/auth';
import { createPet } from '@/services/petService';
import { getClinics } from '@/services/clinicService';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import type { PetRequest, FormState, Clinic } from '@/types';

// ─── Componente de campo textarea reutilizable ────────────────────────────────
function TextareaField({
    id, label, placeholder, value, onChange, hint,
}: {
    id: string; label: string; placeholder: string;
    value: string; onChange: (v: string) => void; hint?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-semibold text-petwell-navy mb-1.5">{label}</label>
            <textarea
                id={id}
                rows={2}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm text-petwell-navy placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-petwell-blue/30 focus:border-petwell-blue transition-all hover:border-petwell-blue/50"
            />
            {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
    );
}

export default function AddPetPage() {
    const router = useRouter();
    const { token } = useAuthContext();

    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [clinicsLoading, setClinicsLoading] = useState(true);
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('');
    const [breed, setBreed] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [sex, setSex] = useState('');
    const [weight, setWeight] = useState('');
    const [microchip, setMicrochip] = useState('');
    const [allergies, setAllergies] = useState('');
    const [primaryClinicId, setPrimaryClinicId] = useState<string>('');
    const [form, setForm] = useState<FormState>({ loading: false, error: null, success: null });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Cargar liste de clínicas al montar
    useEffect(() => {
        getClinics(token ?? undefined)
            .then(setClinics)
            .catch(() => setClinics([]))
            .finally(() => setClinicsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'El nombre es obligatorio.';
        if (!species.trim()) e.species = 'La especie es obligatoria.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;

        const jwt = token ?? getToken();
        if (!jwt) { router.replace('/login'); return; }

        const speciesMap: Record<string, string> = {
            perro: 'DOG',
            gato: 'CAT',
            conejo: 'RABBIT'
        };

        const sexMap: Record<string, string> = {
            Macho: 'male',
            Hembra: 'female'
        };

        const payload: PetRequest = {
            name: name.trim(),
            species: speciesMap[species.trim().toLowerCase()] ?? species.trim(),
            breed: breed.trim() || undefined,
            birth_date: birthDate ? new Date(birthDate).toISOString().split('T')[0] : undefined,
            sex: sex ? (sexMap[sex] ?? sex.toLowerCase()) : undefined,
            weight: weight ? Number(weight) : undefined,
            microchip: microchip.trim() ? String(microchip.trim()) : undefined,
            allergies: allergies.trim() || undefined,
            primary_clinic_id: primaryClinicId && primaryClinicId !== '' ? primaryClinicId : undefined,
        };

        setForm({ loading: true, error: null, success: null });
        try {
            const res = await createPet(payload, jwt);
            if (res.success) {
                setForm({ loading: false, error: null, success: '¡Mascota registrada exitosamente!' });
                setTimeout(() => router.push('/pets'), 1500);
            } else {
                setForm({ loading: false, error: res.message ?? 'Error al registrar la mascota.', success: null });
            }
        } catch (err: unknown) {
            setForm({
                loading: false,
                error: err instanceof Error ? err.message : 'Error al conectar con el servidor.',
                success: null,
            });
        }
    };

    const pawIcon = (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 11.5A2.5 2.5 0 007 9V7a2.5 2.5 0 00-5 0v2a2.5 2.5 0 002.5 2.5zm15 0A2.5 2.5 0 0022 9V7a2.5 2.5 0 00-5 0v2a2.5 2.5 0 002.5 2.5zM12 14a4 4 0 100-8 4 4 0 000 8zm-6.5 5.5a6.5 6.5 0 0113 0" />
        </svg>
    );

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 flex items-start justify-center px-4 py-10">
            <div className="w-full max-w-xl">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-petwell-teal rounded-2xl shadow-lg mb-5 text-3xl">
                        🐾
                    </div>
                    <h1 className="text-3xl font-extrabold text-petwell-navy">Registrar mascota</h1>
                    <p className="text-gray-500 mt-2 text-sm">Añade a tu compañero a PetWell.</p>
                </div>

                <div className="card-glass p-8 animate-slide-up">
                    {form.error && <div className="mb-5"><Alert type="error" message={form.error} onClose={() => setForm(f => ({ ...f, error: null }))} /></div>}
                    {form.success && <div className="mb-5"><Alert type="success" message={form.success} /></div>}

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        {/* Nombre y especie */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input id="pet-name" label="Nombre *" type="text" placeholder="Firulais" value={name}
                                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                                error={errors.name} icon={pawIcon} />
                            <Input id="pet-species" label="Especie *" type="text" placeholder="Perro, Gato..." value={species}
                                onChange={e => { setSpecies(e.target.value); setErrors(p => ({ ...p, species: '' })); }}
                                error={errors.species}
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                            />
                        </div>

                        {/* Raza y fecha nac */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input id="pet-breed" label="Raza" type="text" placeholder="Labrador, Siamés..." value={breed}
                                onChange={e => setBreed(e.target.value)}
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>}
                            />
                            <Input id="pet-birthdate" label="Fecha de nacimiento" type="date" value={birthDate}
                                onChange={e => setBirthDate(e.target.value)}
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                            />
                        </div>

                        {/* Sexo y peso */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-petwell-navy mb-1.5">Sexo</label>
                                <select
                                    value={sex}
                                    onChange={e => setSex(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-petwell-blue/30 focus:border-petwell-blue transition-all hover:border-petwell-blue/50"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Macho">Macho</option>
                                    <option value="Hembra">Hembra</option>
                                </select>
                            </div>
                            <Input id="pet-weight" label="Peso (kg)" type="number" placeholder="5.2" value={weight}
                                onChange={e => setWeight(e.target.value)} min="0" step="0.1"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
                            />
                        </div>

                        {/* Microchip */}
                        <Input id="pet-microchip" label="Número de microchip" type="text" placeholder="985000000000000" value={microchip}
                            onChange={e => setMicrochip(e.target.value)}
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>}
                        />

                        {/* Alergias */}
                        <TextareaField id="pet-allergies" label="Alergias"
                            placeholder="Pollo, antibióticos, ácaros..."
                            value={allergies} onChange={setAllergies}
                            hint="Registra cualquier alergia conocida de tu mascota."
                        />

                        {/* Clínica principal */}
                        <div>
                            <label htmlFor="pet-clinic" className="block text-sm font-semibold text-petwell-navy mb-1.5">
                                Clínica principal
                                <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                            </label>
                            <select
                                id="pet-clinic"
                                value={primaryClinicId}
                                onChange={e => setPrimaryClinicId(e.target.value)}
                                disabled={clinicsLoading}
                                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-petwell-blue/30 focus:border-petwell-blue transition-all hover:border-petwell-blue/50 disabled:opacity-60 disabled:cursor-wait"
                            >
                                <option value="">{clinicsLoading ? 'Cargando clínicas...' : 'Sin clínica asignada'}</option>
                                {clinics.map(c => (
                                    <option key={c.id} value={c.id}>{c.clinic_name}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-400">Selecciona la clínica veterinaria principal de tu mascota.</p>
                        </div>

                        <Button type="submit" variant="secondary" fullWidth size="lg" loading={form.loading} disabled={form.loading}>
                            {form.loading ? 'Registrando...' : 'Registrar mascota 🐾'}
                        </Button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                        <Link href="/pets" className="text-sm font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">
                            ← Volver a mis mascotas
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
