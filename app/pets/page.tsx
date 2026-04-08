'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { getToken } from '@/utils/auth';
import { getPets, deletePet } from '@/services/petService';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Pet } from '@/types';

// ─── Diccionarios de Traducción ───────────────────────────────────────────────
const speciesLabel: Record<string, string> = {
    DOG: 'Perro',
    CAT: 'Gato',
    RABBIT: 'Conejo'
};

const sexLabel: Record<string, string> = {
    MALE: 'Macho',
    FEMALE: 'Hembra',
    male: 'Macho',
    female: 'Hembra'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAge(birthDate: string): string {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const totalMonths = years * 12 + months;
    if (totalMonths < 1) return 'Recién nacido';
    if (totalMonths < 12) return `${totalMonths} mes${totalMonths > 1 ? 'es' : ''}`;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    return m > 0 ? `${y} año${y > 1 ? 's' : ''} y ${m} mes${m > 1 ? 'es' : ''}` : `${y} año${y > 1 ? 's' : ''}`;
}

// ─── Emoji por especie ────────────────────────────────────────────────────────
function speciesEmoji(species: string): string {
    const s = species.toLowerCase();
    if (s.includes('perro') || s.includes('dog')) return '🐶';
    if (s.includes('gato') || s.includes('cat')) return '🐱';
    if (s.includes('conejo') || s.includes('rabbit')) return '🐰';
    if (s.includes('pájaro') || s.includes('bird') || s.includes('ave')) return '🐦';
    if (s.includes('hamster') || s.includes('hámster')) return '🐹';
    return '🐾';
}

// ─── Card de mascota ──────────────────────────────────────────────────────────
function PetCard({ pet, onDelete }: { pet: Pet; onDelete: (id: string) => void }) {
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const { token } = useAuthContext();

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        const jwt = token ?? getToken();
        if (!jwt) return;
        setDeleting(true);
        try {
            await deletePet(pet.id, jwt);
            onDelete(pet.id);
        } catch {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className="card-glass p-6 flex flex-col gap-4 hover:shadow-lg transition-all duration-200 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-petwell-teal/10 flex items-center justify-center text-3xl flex-shrink-0 relative overflow-hidden">
                        {pet.photo_url ? (
                            <Image src={pet.photo_url} alt={pet.name} fill className="object-cover" sizes="56px" unoptimized />
                        ) : (
                            speciesEmoji(pet.species)
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-lg font-extrabold text-petwell-navy truncate">{pet.name}</h3>
                        <p className="text-sm text-petwell-blue font-medium capitalize">{speciesLabel[pet.species] ?? pet.species}</p>
                    </div>
                </div>
                {pet.sex && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${pet.sex.toLowerCase() === 'macho' || pet.sex.toLowerCase() === 'male'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-pink-100 text-pink-700'
                        }`}>
                        {sexLabel[pet.sex] ?? pet.sex}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
                {pet.breed && (
                    <div>
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Raza</span>
                        <p className="text-petwell-navy font-medium">{pet.breed}</p>
                    </div>
                )}
                {pet.birth_date && (
                    <div>
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Edad</span>
                        <p className="text-petwell-navy font-medium">{calcAge(pet.birth_date)}</p>
                    </div>
                )}
                {pet.weight !== undefined && (
                    <div>
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Peso</span>
                        <p className="text-petwell-navy font-medium">{pet.weight} kg</p>
                    </div>
                )}
                {pet.microchip && (
                    <div>
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Microchip</span>
                        <p className="text-petwell-navy font-medium font-mono text-xs">{pet.microchip}</p>
                    </div>
                )}
            </div>

            {pet.allergies && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-amber-700 mb-0.5">⚠ Alergias</p>
                    <p className="text-xs text-amber-600">{pet.allergies}</p>
                </div>
            )}

            {/* Acciones */}
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <Link href={`/pets/${pet.id}`} className="flex-1">
                    <Button variant="outline" size="sm" fullWidth>Ver detalle</Button>
                </Link>
                <Link href={`/pets/${pet.id}/edit`} className="flex-1">
                    <Button variant="primary" size="sm" fullWidth>Editar</Button>
                </Link>
                <Button
                    variant="danger"
                    size="sm"
                    loading={deleting}
                    disabled={deleting}
                    onClick={handleDelete}
                    className={`flex-shrink-0 ${confirmDelete ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
                >
                    {confirmDelete ? '¿Confirmar?' : '✕'}
                </Button>
            </div>
            {confirmDelete && !deleting && (
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-400 hover:text-gray-600 text-center -mt-2">
                    Cancelar eliminación
                </button>
            )}
        </div>
    );
}

// ─── Estado vacío ──────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="card-glass flex flex-col items-center justify-center py-20 gap-4 text-center col-span-full">
            <div className="text-6xl">🐾</div>
            <div>
                <p className="text-lg font-bold text-petwell-navy">Aún no tienes mascotas registradas</p>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">Agrega a tu compañero y lleva un registro de su salud en un solo lugar.</p>
            </div>
            <Link href="/pets/add">
                <Button variant="secondary" size="lg">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Registrar primera mascota
                </Button>
            </Link>
        </div>
    );
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function PetsPage() {
    const router = useRouter();
    const { user, token, loading: authLoading } = useAuthContext();
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPets = useCallback(async () => {
        const jwt = token ?? getToken();
        if (!jwt) { router.replace('/login'); return; }
        setLoading(true);
        setError(null);
        try {
            const data = await getPets(jwt);
            setPets(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar las mascotas.');
        } finally {
            setLoading(false);
        }
    }, [token, router]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.replace('/login'); return; }
        if (user.role !== 'DUENO_MASCOTA') {
            router.replace('/dashboard');
            return;
        }
        loadPets();
    }, [authLoading, user, router, loadPets]);

    const handleDelete = (id: string) => setPets(prev => prev.filter(p => p.id !== id));

    if (authLoading || loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingSpinner size={52} text="Cargando mascotas..." />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 px-4 py-10">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-petwell-navy">
                            Mis <span className="text-gradient-petwell">Mascotas</span>
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Gestiona el perfil de salud de tus compañeros.</p>
                    </div>
                    <Link href="/pets/add">
                        <Button variant="secondary">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Agregar mascota
                        </Button>
                    </Link>
                </div>

                {/* Error */}
                {error && (
                    <Alert type="error" message={error} onClose={() => setError(null)} />
                )}

                {/* Grid de mascotas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {pets.length === 0 && !error
                        ? <EmptyState />
                        : pets.map(pet => (
                            <PetCard key={pet.id} pet={pet} onDelete={handleDelete} />
                        ))
                    }
                </div>

                {/* Volver */}
                <div className="pt-2">
                    <Link href="/dashboard" className="text-sm text-petwell-blue hover:text-petwell-teal transition-colors font-medium">
                        ← Volver al panel
                    </Link>
                </div>
            </div>
        </div>
    );
}
