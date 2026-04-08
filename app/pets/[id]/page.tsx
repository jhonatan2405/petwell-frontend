'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { getToken } from '@/utils/auth';
import {
    getPetById,
    deletePet,
    addPetOwner,
    getPetOwners,
    removePetOwner,
    uploadPetPhoto,
} from '@/services/petService';
import { downloadEhrPdf } from '@/services/ehrService';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import type { Pet } from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function speciesEmoji(species: string): string {
    const s = species.toLowerCase();
    if (s.includes('perro') || s.includes('dog')) return '🐶';
    if (s.includes('gato') || s.includes('cat')) return '🐱';
    if (s.includes('conejo') || s.includes('rabbit')) return '🐰';
    if (s.includes('pájaro') || s.includes('bird') || s.includes('ave')) return '🐦';
    if (s.includes('hamster') || s.includes('hámster')) return '🐹';
    return '🐾';
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-gray-100 last:border-0">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider sm:w-40 flex-shrink-0">{label}</span>
            <span className="text-sm font-medium text-petwell-navy">{String(value)}</span>
        </div>
    );
}

// ─── PetPhotoSection ──────────────────────────────────────────────────────────

function PetPhotoSection({
    pet,
    onPhotoUpdated,
    canEdit,
}: {
    pet: Pet;
    onPhotoUpdated: (url: string) => void;
    canEdit: boolean;
}) {
    const { token } = useAuthContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            setPhotoError('Solo se permiten imágenes JPG, PNG o WebP.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setPhotoError('La imagen no puede superar los 5 MB.');
            return;
        }

        const jwt = token ?? getToken();
        if (!jwt) return;

        setUploading(true);
        setPhotoError(null);
        try {
            const { photo_url } = await uploadPetPhoto(pet.id, file, jwt);
            onPhotoUpdated(photo_url);
        } catch (err) {
            setPhotoError(err instanceof Error ? err.message : 'Error al subir la foto.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col items-center gap-3 mb-6">
            {/* Photo display */}
            <div className="relative w-28 h-28 flex-shrink-0">
                {pet.photo_url ? (
                    <Image
                        src={pet.photo_url}
                        alt={`Foto de ${pet.name}`}
                        fill
                        className="object-cover rounded-2xl shadow"
                        sizes="112px"
                        unoptimized
                    />
                ) : (
                    <div className="w-28 h-28 rounded-2xl bg-petwell-teal/10 flex items-center justify-center text-6xl">
                        {speciesEmoji(pet.species)}
                    </div>
                )}
                {/* Upload button overlay */}
                {canEdit && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        title="Cambiar foto"
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-petwell-blue text-white shadow-lg flex items-center justify-center hover:bg-petwell-teal transition-colors disabled:opacity-50 text-sm"
                    >
                        {uploading ? '⟳' : '📷'}
                    </button>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    aria-label="Subir foto de mascota"
                />
            </div>

            {uploading && (
                <p className="text-xs text-petwell-blue animate-pulse">Subiendo foto...</p>
            )}
            {photoError && (
                <p className="text-xs text-red-500 text-center">{photoError}</p>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PetDetailPage() {
    const router = useRouter();
    const params = useParams();
    const petId = params?.id as string;
    const { user, token } = useAuthContext();
    const isOwner = user?.role === 'DUENO_MASCOTA';

    const [pet, setPet] = useState<Pet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // PDF download state
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);

    // Owners management
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [owners, setOwners] = useState<any[]>([]);
    const [ownersLoading, setOwnersLoading] = useState(false);
    const [showOwnerForm, setShowOwnerForm] = useState(false);
    const [ownerEmail, setOwnerEmail] = useState('');
    const [ownerLoading, setOwnerLoading] = useState(false);
    const [ownerSuccess, setOwnerSuccess] = useState<string | null>(null);
    const [ownerError, setOwnerError] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const loadOwners = async (id: string) => {
        const jwt = token ?? getToken();
        if (!jwt) return;
        setOwnersLoading(true);
        try {
            const list = await getPetOwners(id, jwt);
            setOwners(list);
        } catch {
            // no bloquear la UI si falla la carga de dueños
        } finally {
            setOwnersLoading(false);
        }
    };

    const handleAddOwner = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const trimmed = ownerEmail.trim();
        if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setOwnerError('Ingresa un correo electrónico válido.');
            return;
        }
        const jwt = token ?? getToken();
        if (!jwt || !pet) return;
        setOwnerLoading(true);
        setOwnerError(null);
        setOwnerSuccess(null);
        try {
            await addPetOwner(pet.id, trimmed, jwt);
            setOwnerSuccess(`✅ ${trimmed} fue agregado como dueño.`);
            setOwnerEmail('');
            setShowOwnerForm(false);
            await loadOwners(pet.id);
        } catch (err) {
            setOwnerError(err instanceof Error ? err.message : 'Error al agregar el dueño.');
        } finally {
            setOwnerLoading(false);
        }
    };

    const handleRemoveOwner = async (ownerId: string) => {
        const jwt = token ?? getToken();
        if (!jwt || !pet) return;
        setRemovingId(ownerId);
        try {
            await removePetOwner(pet.id, ownerId, jwt);
            setOwners(prev => prev.filter(o => o.id !== ownerId));
        } catch (err) {
            setOwnerError(err instanceof Error ? err.message : 'Error al eliminar el dueño.');
        } finally {
            setRemovingId(null);
        }
    };

    const handleDownloadPdf = async () => {
        const jwt = token ?? getToken();
        if (!jwt || !pet) return;
        setPdfLoading(true);
        setPdfError(null);
        try {
            await downloadEhrPdf(pet.id, jwt);
        } catch (err) {
            setPdfError(err instanceof Error ? err.message : 'Error al generar el PDF.');
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        if (!petId) return;
        const jwt = token ?? getToken();
        if (!jwt) { router.replace('/login'); return; }
        getPetById(petId, jwt)
            .then(data => {
                if (!data) { setError('Mascota no encontrada.'); return; }
                setPet(data);
                loadOwners(data.id);
            })
            .catch(err => setError(err.message ?? 'Error al cargar la mascota.'))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [petId]);

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        const jwt = token ?? getToken();
        if (!jwt || !pet) return;
        setDeleting(true);
        try {
            await deletePet(pet.id, jwt);
            router.push('/pets');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar la mascota.');
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingSpinner size={52} text="Cargando mascota..." />
            </div>
        );
    }

    if (error || !pet) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <Alert type="error" message={error ?? 'Mascota no encontrada.'} />
                    <div className="mt-4 text-center">
                        <button onClick={() => router.back()} className="text-sm font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">
                            ← Volver
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-petwell-light/30 px-4 py-10">
            <div className="max-w-xl mx-auto space-y-6">

                {/* Cabecera */}
                <div className="animate-fade-in">
                    {isOwner ? (
                        <Link href="/pets" className="text-sm font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">
                            ← Volver a mis mascotas
                        </Link>
                    ) : (
                        <Link href="/clinic/appointments" className="text-sm font-semibold text-petwell-blue hover:text-petwell-teal transition-colors">
                            ← Volver a agenda
                        </Link>
                    )}
                </div>

                {/* Hero card */}
                <div className="card-glass p-8 animate-slide-up">

                    {/* Photo + basic identity */}
                    <PetPhotoSection
                        pet={pet}
                        canEdit={isOwner}
                        onPhotoUpdated={(url) => setPet(prev => prev ? { ...prev, photo_url: url } : prev)}
                    />

                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-extrabold text-petwell-navy">{pet.name}</h1>
                        <p className="text-petwell-blue font-semibold capitalize">{pet.species}</p>
                        {pet.sex && (
                            <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                pet.sex.toLowerCase() === 'macho' || pet.sex.toLowerCase() === 'male'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-pink-100 text-pink-700'
                            }`}>
                                {pet.sex}
                            </span>
                        )}
                    </div>

                    {/* Info detallada */}
                    <div className="divide-y divide-gray-100">
                        <InfoRow label="Raza" value={pet.breed} />
                        <InfoRow label="Edad" value={pet.birth_date ? calcAge(pet.birth_date) : undefined} />
                        <InfoRow label="Fecha de nac." value={pet.birth_date ? new Date(pet.birth_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                        <InfoRow label="Peso" value={pet.weight !== undefined ? `${pet.weight} kg` : undefined} />
                        <InfoRow label="Microchip" value={pet.microchip} />
                        <InfoRow label="Clínica principal" value={pet.primary_clinic_id} />
                    </div>

                    {/* Alergias */}
                    {pet.allergies && (
                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <p className="text-sm font-semibold text-amber-700 mb-1">⚠ Alergias registradas</p>
                            <p className="text-sm text-amber-600">{pet.allergies}</p>
                        </div>
                    )}

                    {/* Acciones principales */}
                    <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">

                        {/* Historial clínico */}
                        <Link href={`/pets/${pet.id}/ehr`} className="w-full">
                            <Button variant="secondary" fullWidth>
                                📋 Ver historial clínico
                            </Button>
                        </Link>

                        {/* Vacunas */}
                        <Link href={`/pets/${pet.id}/vaccinations`} className="w-full">
                            <Button variant="secondary" fullWidth>
                                💉 Ver / registrar vacunas
                            </Button>
                        </Link>

                        {/* Descargar PDF */}
                        <Button
                            variant="outline"
                            fullWidth
                            loading={pdfLoading}
                            disabled={pdfLoading}
                            onClick={handleDownloadPdf}
                        >
                            🧾 {pdfLoading ? 'Generando PDF...' : 'Descargar historial en PDF'}
                        </Button>
                        {pdfError && (
                            <p className="text-xs text-red-500 text-center">{pdfError}</p>
                        )}

                        {/* Editar / Eliminar */}
                        {isOwner && (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link href={`/pets/${pet.id}/edit`} className="flex-1">
                                    <Button variant="outline" fullWidth>
                                        ✏️ Editar mascota
                                    </Button>
                                </Link>
                                <Button
                                    variant="danger"
                                    className="flex-1"
                                    loading={deleting}
                                    disabled={deleting}
                                    onClick={handleDelete}
                                >
                                    {confirmDelete ? '¿Confirmar eliminación?' : '🗑 Eliminar'}
                                </Button>
                            </div>
                        )}
                    </div>
                    {isOwner && confirmDelete && !deleting && (
                        <button onClick={() => setConfirmDelete(false)} className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 text-center">
                            Cancelar
                        </button>
                    )}
                </div>

                {/* ─── Dueños de la mascota (Solo Dueño) ──────────────────── */}
                {isOwner && (
                <div className="card-glass p-6 animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base font-extrabold text-petwell-navy">👥 Dueños de la mascota</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Comparte el acceso agregando a otro dueño por correo.</p>
                        </div>
                        {!showOwnerForm && (
                            <button
                                onClick={() => { setShowOwnerForm(true); setOwnerSuccess(null); setOwnerError(null); }}
                                className="text-sm font-semibold text-petwell-blue hover:text-petwell-teal transition-colors flex items-center gap-1"
                            >
                                <span className="text-lg leading-none">+</span> Añadir dueño
                            </button>
                        )}
                    </div>

                    {ownerSuccess && (
                        <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                            {ownerSuccess}
                        </div>
                    )}
                    {ownerError && (
                        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                            {ownerError}
                        </div>
                    )}

                    {/* Lista de dueños */}
                    {ownersLoading ? (
                        <p className="text-xs text-gray-400 py-2">Cargando dueños...</p>
                    ) : owners.length > 0 ? (
                        <ul className="divide-y divide-gray-100 mb-4">
                            {owners.map(owner => (
                                <li key={owner.id} className="flex items-center justify-between py-3 gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-petwell-navy truncate">{owner.name ?? owner.full_name ?? '—'}</p>
                                        <p className="text-xs text-gray-400 truncate">{owner.email}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveOwner(owner.id)}
                                        disabled={removingId === owner.id}
                                        className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors flex-shrink-0 disabled:opacity-50"
                                    >
                                        {removingId === owner.id ? 'Eliminando...' : 'Eliminar'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-gray-400 py-2 mb-3">Aún no hay otros dueños registrados.</p>
                    )}

                    {showOwnerForm && (
                        <form onSubmit={handleAddOwner} noValidate className="space-y-3 border-t border-gray-100 pt-4">
                            <div>
                                <label htmlFor="owner-email" className="block text-sm font-semibold text-petwell-navy mb-1.5">
                                    Email del nuevo dueño
                                </label>
                                <input
                                    id="owner-email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={ownerEmail}
                                    onChange={e => { setOwnerEmail(e.target.value); setOwnerError(null); }}
                                    disabled={ownerLoading}
                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm text-petwell-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-petwell-blue/30 focus:border-petwell-blue transition-all hover:border-petwell-blue/50 disabled:opacity-60"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" variant="secondary" size="sm" loading={ownerLoading} disabled={ownerLoading}>
                                    {ownerLoading ? 'Agregando...' : 'Agregar dueño'}
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => { setShowOwnerForm(false); setOwnerEmail(''); setOwnerError(null); }}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
                )}

            </div>
        </div>
    );
}
