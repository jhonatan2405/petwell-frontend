import type {
    ProfileResponse,
    ChangePasswordRequest,
    UpdateProfileRequest,
    ReceptionistRequest,
    BaseResponse,
} from '@/types';

// ─── URL base del API Gateway ─────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ─── Helper fetch con autenticación ──────────────────────────────────────────
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
        cache: 'no-store', // Prevent Next.js from caching profile updates aggressively
    };
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    return data as T;
}

// ─── Obtener perfil del usuario autenticado ───────────────────────────────────
// GET /api/users/profile
export async function getProfile(token: string): Promise<ProfileResponse> {
    return request<ProfileResponse>('/users/profile', { method: 'GET' }, token);
}

// ─── Actualizar información personal ─────────────────────────────────────────
// PUT /api/users/profile
export async function updateProfile(
    token: string,
    payload: UpdateProfileRequest
): Promise<ProfileResponse> {
    return request<ProfileResponse>(
        '/users/profile',
        {
            method: 'PUT',
            body: JSON.stringify(payload),
        },
        token
    );
}

// ─── Cambiar contraseña ───────────────────────────────────────────────────────
// PUT /api/users/change-password
export async function changePassword(
    token: string,
    payload: ChangePasswordRequest
): Promise<BaseResponse> {
    return request<BaseResponse>(
        '/users/change-password',
        {
            method: 'PUT',
            body: JSON.stringify(payload),
        },
        token
    );
}

// ─── Agregar Recepcionista ────────────────────────────────────────────────────
// POST /api/users/receptionists
export async function addReceptionist(
    token: string,
    payload: ReceptionistRequest
): Promise<BaseResponse> {
    return request<BaseResponse>(
        '/users/receptionists',
        {
            method: 'POST',
            body: JSON.stringify(payload),
        },
        token
    );
}

// ─── Subir foto de perfil ─────────────────────────────────────────────────────
// POST /api/users/me/photo
export async function uploadUserPhoto(
    token: string,
    file: File
): Promise<ProfileResponse> {
    const formData = new FormData();
    formData.append('photo', file);

    const url = `${BASE_URL}/users/me/photo`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    return data as ProfileResponse;
}
