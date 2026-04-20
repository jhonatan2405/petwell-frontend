import type {
    ProfileResponse,
    ChangePasswordRequest,
    UpdateProfileRequest,
    ReceptionistRequest,
    BaseResponse,
} from '@/types';

// BASE_URL ya incluye /api/v1 (definido en .env.local)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helper fetch con autenticación ──────────────────────────────────────────
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

// ─── Obtener perfil del usuario autenticado ───────────────────────────────────
export async function getProfile(token: string): Promise<ProfileResponse> {
    return request<ProfileResponse>('users/profile', { method: 'GET' }, token);
}

// ─── Actualizar información personal ─────────────────────────────────────────
export async function updateProfile(
    token: string,
    payload: UpdateProfileRequest
): Promise<ProfileResponse> {
    return request<ProfileResponse>(
        'users/profile',
        { method: 'PUT', body: JSON.stringify(payload) },
        token
    );
}

// ─── Cambiar contraseña ───────────────────────────────────────────────────────
export async function changePassword(
    token: string,
    payload: ChangePasswordRequest
): Promise<BaseResponse> {
    return request<BaseResponse>(
        'users/change-password',
        { method: 'PUT', body: JSON.stringify(payload) },
        token
    );
}

// ─── Agregar Recepcionista ────────────────────────────────────────────────────
export async function addReceptionist(
    token: string,
    payload: ReceptionistRequest
): Promise<BaseResponse> {
    return request<BaseResponse>(
        'users/receptionists',
        { method: 'POST', body: JSON.stringify(payload) },
        token
    );
}

// ─── Subir foto de perfil ─────────────────────────────────────────────────────
export async function uploadUserPhoto(
    token: string,
    file: File
): Promise<ProfileResponse> {
    const formData = new FormData();
    formData.append('photo', file);

    const url = `${BASE_URL}/users/me/photo`;
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
    return data as ProfileResponse;
}
