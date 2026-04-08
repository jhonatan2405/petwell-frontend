import type {
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    ProfileResponse,
    ChangePasswordRequest,
    BaseResponse,
} from '@/types';

// ─── URL base del microservicio ───────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ─── Helper: realizar petición fetch ─────────────────────────────────────────
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

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
    const data = await response.json();

    // Si el servidor devuelve error HTTP, lanzamos con el mensaje del backend
    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }

    return data as T;
}

// ─── Registro de usuario ──────────────────────────────────────────────────────
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/users/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ─── Inicio de sesión ─────────────────────────────────────────────────────────
export async function login(payload: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/users/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ─── Obtener perfil autenticado ───────────────────────────────────────────────
export async function getProfile(token: string): Promise<ProfileResponse> {
    return request<ProfileResponse>('/users/profile', {
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
    return request<BaseResponse>('/users/change-password', {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
}
