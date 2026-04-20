import type { RegisterRequest, LoginRequest, AuthResponse } from '@/types';

// BASE_URL ya incluye /api/v1 (definido en .env.local)
// NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ─── Helper fetch ─────────────────────────────────────────────────────────────
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const url = `${BASE_URL}/${cleanEndpoint}`;

    console.log('🌐 Request URL:', url);

    const config: RequestInit = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
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
        const err = new Error(data.message || `Error ${response.status}: ${response.statusText}`) as Error & { status: number };
        err.status = response.status;
        throw err;
    }
    return data as T;
}

// ─── Registro de dueño de mascota ────────────────────────────────────────────
export async function registerOwner(payload: RegisterRequest): Promise<AuthResponse> {
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

// ─── Verificación de cuenta (2FA) ─────────────────────────────────────────────
export async function verifyAccount(email: string, code: string): Promise<AuthResponse> {
    return request<AuthResponse>('auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
    });
}

// ─── Reenviar código de verificación ─────────────────────────────────────────
export async function resendVerificationCode(email: string): Promise<AuthResponse> {
    return request<AuthResponse>('auth/resend-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}
