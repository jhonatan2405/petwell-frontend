'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { getToken } from '@/utils/auth';
import { getPetsByClinic } from '@/services/petService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import type { Pet } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function speciesLabel(species: string): string {
    const map: Record<string, string> = {
        DOG: 'Perro', CAT: 'Gato', RABBIT: 'Conejo',
        BIRD: 'Ave', HAMSTER: 'Hámster',
    };
    return map[species.toUpperCase()] ?? species;
}

function speciesEmoji(species: string): string {
    const s = species.toUpperCase();
    if (s === 'DOG') return '🐶';
    if (s === 'CAT') return '🐱';
    if (s === 'RABBIT') return '🐰';
    if (s === 'BIRD') return '🐦';
    if (s === 'HAMSTER') return '🐹';
    return '🐾';
}

function calcAge(birthDate: string): string {
    const birth = new Date(birthDate);
    const now = new Date();
    const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (totalMonths < 1) return 'Recién nacido';
    if (totalMonths < 12) return `${totalMonths} mes${totalMonths > 1 ? 'es' : ''}`;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    return m > 0 ? `${y} año${y > 1 ? 's' : ''} y ${m} mes${m > 1 ? 'es' : ''}` : `${y} año${y > 1 ? 's' : ''}`;
}

export default function ClinicPetsPage() {
    const router = useRouter();
    const { token, user } = useAuthContext();

    const isVet = user?.role === 'VETERINARIO';
    const isClinicAdmin = user?.role === 'CLINIC_ADMIN';
    const isReceptionist = user?.role === 'RECEPCIONISTA';
    const canAccessEhr = isVet || isClinicAdmin || isReceptionist;

    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const jwt = token ?? getToken();
        if (!jwt) { router.replace('/login'); return; }

        // v7.6: Usar nuevo endpoint del backend que ya filtra por clínica internamente
        getPetsByClinic(jwt)
            .then((clinicPets: Pet[]) => {
                console.log("CLINIC PETS:", clinicPets);
                setPets(clinicPets);
            })
            .catch((err: Error) => setError(err.message ?? 'Error al cargar las mascotas de la clínica.'))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, user?.clinic_id]);

    if (loading || !user || !token) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingSpinner size={52} text="Cargando mascotas..." />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 px-4 py-10">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm animate-fade-in">
                    <Link href="/clinic-dashboard" className="font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">
                        Panel clínica
                    </Link>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-500">Mascotas</span>
                </div>

                {/* Header */}
                <div className="card-glass p-6 animate-slide-up">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-extrabold text-petwell-navy">🐾 Mascotas de la Clínica</h1>
                            <p className="text-sm text-gray-400 mt-1">
                                Mascotas registradas con tu clínica como principal.
                            </p>
                        </div>
                        {isClinicAdmin && (
                            <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-petwell-blue/10 text-petwell-blue border border-petwell-blue/20">
                                Admin. Clínica
                            </span>
                        )}
                        {isVet && (
                            <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-petwell-teal/10 text-teal-700 border border-petwell-teal/20">
                                Veterinario
                            </span>
                        )}
                        {isReceptionist && (
                            <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Recepcionista
                            </span>
                        )}
                    </div>
                </div>

                {/* Banner autorización */}
                {!isVet && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 animate-fade-in">
                        <span className="text-xl">⚠️</span>
                        <span>
                            {isReceptionist
                                ? <><strong>Modo solo lectura</strong>: puedes consultar el historial pero no modificarlo.</>
                                : <>Solo el <strong>personal autorizado</strong> puede modificar registros clínicos.</>
                            }
                        </span>
                    </div>
                )}

                {/* Error */}
                {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

                {/* Lista o vacío */}
                {!error && pets.length === 0 ? (
                    <div className="card-glass p-12 text-center animate-slide-up">
                        <div className="text-6xl mb-4">🏥</div>
                        <h2 className="text-xl font-bold text-petwell-navy mb-2">Sin mascotas registradas</h2>
                        <p className="text-gray-400 text-sm">No hay mascotas con esta clínica como principal todavía.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pets.map(pet => (
                            <div key={pet.id} className="card-glass p-5 flex flex-col gap-3 hover:shadow-md transition-shadow animate-slide-up">
                                {/* Avatar + nombre */}
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-petwell-teal/10 flex items-center justify-center text-3xl flex-shrink-0">
                                        {speciesEmoji(pet.species)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-extrabold text-petwell-navy truncate">{pet.name}</p>
                                        <p className="text-xs text-petwell-blue font-semibold">{speciesLabel(pet.species)}</p>
                                    </div>
                                </div>

                                {/* Detalles */}
                                <div className="text-xs text-gray-500 space-y-1">
                                    {pet.breed && <p>🐾 Raza: <span className="font-medium text-petwell-navy">{pet.breed}</span></p>}
                                    {pet.birth_date && <p>🎂 Edad: <span className="font-medium text-petwell-navy">{calcAge(pet.birth_date)}</span></p>}
                                    {pet.weight !== undefined && <p>⚖️ Peso: <span className="font-medium text-petwell-navy">{pet.weight} kg</span></p>}
                                    {pet.allergies && (
                                        <p className="text-amber-700 bg-amber-50 rounded-lg px-2 py-1 border border-amber-100">
                                            ⚠️ {pet.allergies}
                                        </p>
                                    )}
                                </div>

                                {/* Acción */}
                                {canAccessEhr && (
                                    <Link
                                        href={`/pets/${pet.id}/ehr`}
                                        className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-petwell-blue text-white text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
                                    >
                                        📋 Ver historial clínico
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
