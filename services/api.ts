import type {
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    ProfileResponse,
    ChangePasswordRequest,
    BaseResponse,
} from '@/types';

// BASE_URL ya incluye /api/v1 (definido en .env.local)
// NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helper: realizar petición fetch ─────────────────────────────────────────
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    // Eliminar cualquier slash inicial para evitar dobles slashes
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const url = `${BASE_URL}/${cleanEndpoint}`;

    console.log('🌐 Request URL:', url);

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
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

// ─── Registro de usuario ──────────────────────────────────────────────────────
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ─── Inicio de sesión ─────────────────────────────────────────────────────────
export async function login(payload: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ─── Obtener perfil autenticado ───────────────────────────────────────────────
export async function getProfile(token: string): Promise<ProfileResponse> {
    return request<ProfileResponse>('users/profile', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// ─── Cambiar contraseña ───────────────────────────────────────────────────────
export async function changePassword(
    token: string,
    payload: ChangePasswordRequest
): Promise<BaseResponse> {
    return request<BaseResponse>('users/change-password', {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
}
