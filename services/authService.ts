import type { RegisterRequest, LoginRequest, AuthResponse } from '@/types';

// ─── URL base del API Gateway ─────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helper fetch ─────────────────────────────────────────────────────────────
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
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
    } catch (e) {
        throw new Error(`Respuesta no válida del servidor (no es JSON). Estado HTTP: ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    return data as T;
}

// ─── Registro de dueño de mascota ────────────────────────────────────────────
export async function registerOwner(payload: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ─── Inicio de sesión ─────────────────────────────────────────────────────────
export async function login(payload: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

