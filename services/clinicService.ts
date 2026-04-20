import type {
    ClinicRegisterRequest,
    ClinicResponse,
    Clinic,
    VeterinarianRequest,
    BaseResponse,
    ClinicDetailResponse,
    StaffMember,
} from '@/types';
import { getToken } from '@/utils/auth';

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
        cache: 'no-store',
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

// ─── Normalizar respuesta de staff ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractStaffArray(res: any): StaffMember[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.staff)) return res.staff;
    if (Array.isArray(res?.data?.staff)) return res.data.staff;
    return [];
}

// ─── Registro de Clínica Veterinaria ─────────────────────────────────────────
export async function registerClinic(payload: ClinicRegisterRequest): Promise<ClinicResponse> {
    return request<ClinicResponse>('clinics/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ─── Obtener listado de clínicas (requiere JWT) ────────────────────────────────
export async function getClinics(tokenArg?: string): Promise<Clinic[]> {
    const jwt = tokenArg ?? getToken();
    const url = `${BASE_URL}/clinics`;
    console.log('🌐 Request URL:', url);

    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
    });
    const data = await res.json();

    let raw: unknown[] = [];
    if (Array.isArray(data)) {
        raw = data;
    } else if (Array.isArray(data?.data?.clinics)) {
        raw = data.data.clinics;
    } else if (Array.isArray(data?.data)) {
        raw = data.data;
    } else if (Array.isArray(data?.clinics)) {
        raw = data.clinics;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return raw.map((c: any) => ({
        ...c,
        clinic_name: c.clinic_name ?? c.name ?? '(Sin nombre)',
    })) as Clinic[];
}

// ─── Agregar Veterinario ─────────────────────────────────────────────────────
export async function addVeterinarian(
    payload: VeterinarianRequest,
    token: string
): Promise<BaseResponse> {
    return request<BaseResponse>(
        'users/veterinarians',
        { method: 'POST', body: JSON.stringify(payload) },
        token
    );
}

// ─── Obtener detalle de una clínica ──────────────────────────────────────────
export async function getClinic(id: string, token?: string): Promise<ClinicDetailResponse> {
    return request<ClinicDetailResponse>(`clinics/${id}`, { method: 'GET' }, token);
}

// ─── Obtener personal de una clínica ─────────────────────────────────────────
export async function getClinicStaff(id: string, token?: string): Promise<StaffMember[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await request<any>(`clinics/${id}/staff`, { method: 'GET' }, token);
    return extractStaffArray(res);
}

// ─── Actualizar datos de una clínica ─────────────────────────────────────────
export interface UpdateClinicPayload {
    clinic_name?: string;
    address?: string;
    phone?: string;
    email?: string;
    city?: string;
    opening_hours?: string;
    specialties?: string;
}

export async function updateClinic(
    id: string,
    payload: UpdateClinicPayload,
    token: string
): Promise<ClinicDetailResponse> {
    return request<ClinicDetailResponse>(
        `clinics/${id}`,
        { method: 'PUT', body: JSON.stringify(payload) },
        token
    );
}

// ─── Subir logo de clínica ───────────────────────────────────────────────────
export async function uploadClinicLogo(
    id: string,
    token: string,
    file: File
): Promise<ClinicDetailResponse> {
    const formData = new FormData();
    formData.append('logo', file);

    const url = `${BASE_URL}/clinics/${id}/logo`;
    console.log('🌐 Request URL:', url);

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
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    return data as ClinicDetailResponse;
}
