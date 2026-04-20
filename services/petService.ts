import type { Pet, PetRequest, PetResponse, PetListResponse } from '@/types';

// BASE_URL ya incluye /api/v1 (definido en .env.local)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helper fetch ─────────────────────────────────────────────────────────────
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
): Promise<T> {
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const url = `${BASE_URL}/${cleanEndpoint}`;

    console.log('🌐 Request URL:', url);

    const config: RequestInit = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers as Record<string, string>),
        },
    };
    const response = await fetch(url, config);
    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error(`Respuesta no válida del servidor (no es JSON). Estado HTTP: ${response.status}`);
    }
    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    return data as T;
}

// ─── Obtener todas las mascotas del usuario autenticado ───────────────────────
export async function getPets(token: string): Promise<Pet[]> {
    const res = await request<PetListResponse>('pets', { method: 'GET' }, token);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
}

// ─── Obtener una mascota por ID ───────────────────────────────────────────────
export async function getPetById(id: string, token: string): Promise<Pet | null> {
    const res = await request<PetResponse>(`pets/${id}`, { method: 'GET' }, token);
    return res.data ?? null;
}

// ─── Crear una nueva mascota ──────────────────────────────────────────────────
export async function createPet(payload: PetRequest, token: string): Promise<PetResponse> {
    return request<PetResponse>('pets', {
        method: 'POST',
        body: JSON.stringify(payload),
    }, token);
}

// ─── Actualizar una mascota ───────────────────────────────────────────────────
export async function updatePet(id: string, payload: Partial<PetRequest>, token: string): Promise<PetResponse> {
    return request<PetResponse>(`pets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }, token);
}

// ─── Eliminar una mascota ─────────────────────────────────────────────────────
export async function deletePet(id: string, token: string): Promise<{ success: boolean; message?: string }> {
    return request(`pets/${id}`, { method: 'DELETE' }, token);
}

// ─── Agregar co-dueño a una mascota ──────────────────────────────────────────
export async function addPetOwner(
    petId: string,
    email: string,
    token: string
): Promise<{ success: boolean; message?: string }> {
    return request(`pets/${petId}/owners`, {
        method: 'POST',
        body: JSON.stringify({ email }),
    }, token);
}

// ─── Obtener dueños de una mascota ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPetOwners(petId: string, token: string): Promise<any[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await request<any>(`pets/${petId}/owners`, { method: 'GET' }, token);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.owners)) return res.data.owners;
    return [];
}

// ─── Eliminar co-dueño de una mascota ────────────────────────────────────────
export async function removePetOwner(
    petId: string,
    ownerId: string,
    token: string
): Promise<{ success: boolean; message?: string }> {
    return request(`pets/${petId}/owners/${ownerId}`, { method: 'DELETE' }, token);
}

// ─── Obtener mascotas de la clínica autenticada ───────────────────────────────
export async function getPetsByClinic(token: string): Promise<Pet[]> {
    const res = await request<PetListResponse>('pets/clinic', { method: 'GET' }, token);
    if (Array.isArray(res)) return res;
    if (Array.isArray((res as PetListResponse).data)) return (res as PetListResponse).data!;
    return [];
}

// ─── Subir / actualizar foto de mascota ───────────────────────────────────────
export async function uploadPetPhoto(
    petId: string,
    file: File,
    token: string,
): Promise<{ photo_url: string }> {
    const url = `${BASE_URL}/pets/${petId}/photo`;
    console.log('🌐 Request URL:', url);

    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error(`Respuesta no válida del servidor (no es JSON). Estado HTTP: ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
    }
    return data.data as { photo_url: string };
}
