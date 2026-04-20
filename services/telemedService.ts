import axios from 'axios';
import { getToken } from '@/utils/auth';
import type { TelemedSession } from '@/types';

// ─── Axios instance (same base as the rest of the app) ───────────────────────
const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

API.interceptors.request.use((config) => {
    const token = getToken();
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Helper ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSession(res: any): TelemedSession | null {
    if (res?.data && typeof res.data === 'object' && res.data.id) return res.data as TelemedSession;
    if (res?.id) return res as TelemedSession;
    return null;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Obtiene la sesión de telemedicina asociada a una cita.
 * GET /api/v1/telemed/sessions/appointment/:appointmentId
 *
 * Returns null when no session exists yet (404).
 * Throws on unexpected errors.
 */
export async function getSessionByAppointmentId(
    appointmentId: string,
    token?: string
): Promise<TelemedSession | null> {
    try {
        const config: Parameters<typeof API.request>[0] = {
            method: 'GET',
            url: `/telemed/sessions/appointment/${appointmentId}`,
        };

        if (token) {
            config.headers = { Authorization: `Bearer ${token}` };
        }

        const response = await API.request<unknown>(config);
        return extractSession(response.data);
    } catch (error: any) {
        // 404 → no session yet, return null gracefully
        if (error?.response?.status === 404) return null;

        // 401 → expired session
        if (error?.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('petwell_token');
                window.location.href = '/login';
            }
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }

        const msg =
            error?.response?.data?.message ||
            `Error al obtener sesión de telemedicina: ${error?.message ?? 'desconocido'}`;
        throw new Error(msg);
    }
}

/**
 * Genera un token privado de Daily.co para entrar a la sala de videollamada.
 * POST /api/v1/telemed/sessions/:id/token
 */
export async function generateToken(sessionId: string): Promise<{
    room_url: string;
    token: string;
    scheduled_at: string;
    status: string;
}> {
    try {
        const response = await API.post(`/telemed/sessions/${sessionId}/token`);
        return response.data.data;
    } catch (error: any) {
        if (error?.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('petwell_token');
                window.location.href = '/login';
            }
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }

        const msg =
            error?.response?.data?.message ||
            `Error al generar token de telemedicina: ${error?.message ?? 'desconocido'}`;
        throw new Error(msg);
    }
}

/**
 * Inicia explícitamente una sesión de telemedicina (Solo Veterinario).
 * PATCH /api/v1/telemed/sessions/:id/start
 */
export async function startSession(sessionId: string): Promise<TelemedSession> {
    try {
        const response = await API.patch(`/telemed/sessions/${sessionId}/start`);
        return extractSession(response.data) as TelemedSession;
    } catch (error: any) {
        if (error?.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('petwell_token');
                window.location.href = '/login';
            }
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }

        const msg =
            error?.response?.data?.message ||
            `Error al iniciar sesión de telemedicina: ${error?.message ?? 'desconocido'}`;
        throw new Error(msg);
    }
}

/**
 * Obtiene la sesión activa de telemedicina del usuario (IN_PROGRESS).
 * GET /api/v1/telemed/sessions/active
 *
 * Siempre retorna null si no hay sesión — nunca lanza error.
 * Diseñado para polling frecuente sin ruido en consola.
 */
export async function getActiveSession(): Promise<TelemedSession | null> {
    try {
        const response = await API.get(`/telemed/sessions/active`);
        // Response shape: { success: true, data: TelemedSession | null }
        const session = response.data?.data ?? null;
        return session;
    } catch {
        // Silent fail — polling must never spam la consola
        return null;
    }
}

/**
 * Finaliza explícitamente una sesión de telemedicina (Solo Veterinario).
 * PATCH /api/v1/telemed/sessions/:id/end
 */
export async function endSession(sessionId: string): Promise<TelemedSession> {
    try {
        const response = await API.patch(`/telemed/sessions/${sessionId}/end`);
        return extractSession(response.data) as TelemedSession;
    } catch (error: any) {
        if (error?.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('petwell_token');
                window.location.href = '/login';
            }
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }

        const msg =
            error?.response?.data?.message ||
            `Error al finalizar sesión de telemedicina: ${error?.message ?? 'desconocido'}`;
        throw new Error(msg);
    }
}
