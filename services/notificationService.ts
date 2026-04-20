import type { UserNotification, NotificationListResponse, NotificationResponse } from '@/types';

// BASE_URL ya incluye /api/v1 (definido en .env.local)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
): Promise<T> {
    if (!token) {
        throw new Error('Operación abortada: no se proporcionó token de autenticación');
    }

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

// Obtener todas las notificaciones
export async function getNotifications(token: string): Promise<UserNotification[]> {
    const res = await request<NotificationListResponse>('notifications', { method: 'GET' }, token);
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    return [];
}

// Marcar notificación como leída (UX)
export async function markAsRead(id: string, token: string): Promise<UserNotification | null> {
    const res = await request<NotificationResponse>(`notifications/${id}/read`, {
        method: 'PATCH'
    }, token);
    return res.data ?? null;
}

// Marcar todas las notificaciones como leídas (UX)
export async function markAllAsRead(token: string): Promise<UserNotification[]> {
    const res = await request<NotificationListResponse>(`notifications/read-all`, {
        method: 'PATCH'
    }, token);
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    return [];
}
