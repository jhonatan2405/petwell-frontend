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

// ─── URL base del API Gateway ─────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helper fetch ─────────────────────────────────────────────────────────────
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
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
    } catch (e) {
        throw new Error(`Respuesta no válida del servidor (no es JSON). Estado HTTP: ${response.status}`);
    }
    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    return data as T;
}

// ─── Normalizar respuesta de staff ─────────────────────────────────────────────
// Soporta: array plano, { data: [] }, { data: { data: [] } }, { staff: [] }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractStaffArray(res: any): StaffMember[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.staff)) return res.staff;
    if (Array.isArray(res?.data?.staff)) return res.data.staff; // { success, data: { staff: [] } }
    return [];
}

// ─── Registro de Clínica Veterinaria ─────────────────────────────────────────
// POST /api/v1/clinics/register
export async function registerClinic(payload: ClinicRegisterRequest): Promise<ClinicResponse> {
    return request<ClinicResponse>('/api/v1/clinics/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ─── Obtener listado de clínicas (requiere JWT) ────────────────────────────────
// GET /api/v1/clinics
// Normaliza: { data: { clinics: [] } } | { data: [] } | array plano
export async function getClinics(tokenArg?: string): Promise<Clinic[]> {
    const jwt = tokenArg ?? getToken();
    const url = `${BASE_URL}/api/v1/clinics`;
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
        raw = data.data.clinics;          // { data: { clinics: [] } }  ← backend actual
    } else if (Array.isArray(data?.data)) {
        raw = data.data;                   // { data: [] }
    } else if (Array.isArray(data?.clinics)) {
        raw = data.clinics;
    }

    // Normalizar: algunos backends devuelven 'name', otros 'clinic_name'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return raw.map((c: any) => ({
        ...c,
        clinic_name: c.clinic_name ?? c.name ?? '(Sin nombre)',
    })) as Clinic[];
}

// ─── Agregar Veterinario (requiere token de clínica) ─────────────────────────
// POST /api/v1/users/veterinarians
export async function addVeterinarian(
    payload: VeterinarianRequest,
    token: string
): Promise<BaseResponse> {
    return request<BaseResponse>(
        '/api/v1/users/veterinarians',
        {
            method: 'POST',
            body: JSON.stringify(payload),
        },
        token
    );
}

// ─── Obtener detalle de una clínica ──────────────────────────────────────────
// GET /api/v1/clinics/:id
export async function getClinic(id: string, token?: string): Promise<ClinicDetailResponse> {
    return request<ClinicDetailResponse>(`/api/v1/clinics/${id}`, { method: 'GET' }, token);
}

// ─── Obtener personal de una clínica ─────────────────────────────────────────
// GET /api/v1/clinics/:id/staff  →  devuelve StaffMember[] ya normalizado
export async function getClinicStaff(id: string, token?: string): Promise<StaffMember[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await request<any>(`/api/v1/clinics/${id}/staff`, { method: 'GET' }, token);

    const staffArray = extractStaffArray(res);

    return staffArray;
}

// ─── Actualizar datos de una clínica ─────────────────────────────────────────
// PUT /api/v1/clinics/:id
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
        `/api/v1/clinics/${id}`,
        {
            method: 'PUT',
            body: JSON.stringify(payload),
        },
        token
    );
}

// ─── Subir logo de clínica ───────────────────────────────────────────────────
// POST /api/v1/clinics/:id/logo
export async function uploadClinicLogo(
    id: string,
    token: string,
    file: File
): Promise<ClinicDetailResponse> {
    const formData = new FormData();
    formData.append('logo', file);

    const url = `${BASE_URL}/api/v1/clinics/${id}/logo`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    
    let data;
    try {
        data = await response.json();
    } catch (e) {
        throw new Error(`Respuesta no válida del servidor (no es JSON). Estado HTTP: ${response.status}`);
    }
    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    return data as ClinicDetailResponse;
}
