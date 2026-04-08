import type {
    Appointment,
    AppointmentRequest,
    AppointmentStatusRequest,
    AppointmentResponse,
    AppointmentListResponse,
    AvailabilitySlot,
    AvailabilityResponse,
    ClinicSchedule,
    ScheduleRequest,
    ScheduleResponse,
    ScheduleListResponse,
    VetBlock,
    VetBlockRequest,
    VetBlockResponse,
    VetBlockListResponse,
    WaitlistEntry,
    WaitlistListResponse,
    AppointmentStatus,
} from '@/types';
import { DAY_OF_WEEK_MAP, REVERSE_DAY_OF_WEEK_MAP } from '@/types';
import { getToken } from '@/utils/auth';
import axios from 'axios';

// ─── URL base del API Gateway ─────────────────────────────────────────────────
const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
});

API.interceptors.request.use((config) => {
    const token = getToken();
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Helper fetch con manejo de errores ──────────────────────────────────────
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    tokenArg?: string
): Promise<T> {
    const config: any = {
        method: options.method || 'GET',
        url: endpoint,
    };
    
    if (tokenArg) {
        config.headers = { Authorization: `Bearer ${tokenArg}` };
    }
    
    if (options.body) {
        config.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    }

    try {
        const response = await API.request<T>(config);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401) {
            // Limpiar sesión y redirigir al login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('petwell_token');
                window.location.href = '/login';
            }
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }

        const data = error.response?.data || {};
        const newError = new Error(data.message || `Error ${error.response?.status || 'desconocido'}: ${error.message}`);
        (newError as any).response = error.response;

        if (error.response?.status === 409) {
            newError.message = data.message || 'SLOT_TAKEN';
            throw newError;
        }
        if (error.response?.status === 403) {
            newError.message = data.message || 'FORBIDDEN';
            throw newError;
        }
        if (error.response?.status === 500) {
            newError.message = data.message || 'SERVER_ERROR';
            throw newError;
        }
        throw newError;
    }
}

// ─── Normalizar lista de citas ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAppointmentArray(res: any): Appointment[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.appointments)) return res.data.appointments;
    if (Array.isArray(res?.appointments)) return res.appointments;
    return [];
}

// ═══════════════════════════════════════════════════════════════════════════
//  APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function getAppointments(
    token?: string,
    params?: Record<string, string>
): Promise<Appointment[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await request<any>(`/appointments${query}`, { method: 'GET' }, token);
    return extractAppointmentArray(res);
}

export async function getAppointmentById(
    id: string,
    token?: string
): Promise<Appointment | null> {
    const res = await request<AppointmentResponse>(`/appointments/${id}`, { method: 'GET' }, token);
    return res.data ?? null;
}

export async function createAppointment(
    payload: AppointmentRequest,
    token?: string
): Promise<AppointmentResponse> {
    if (!payload.pet_id || !payload.veterinarian_id || !payload.start_time) {
        throw new Error('Payload incompleto');
    }
    try {
        return await request<AppointmentResponse>(
            '/appointments',
            { method: 'POST', body: JSON.stringify(payload) },
            token
        );
    } catch (error: any) {
        console.error("ERROR COMPLETO:", error.response?.data || error.message);
        console.log("RESPONSE ERROR:", error.response);
        throw error;
    }
}

export async function updateAppointment(
    id: string,
    payload: Partial<AppointmentRequest>,
    token?: string
): Promise<AppointmentResponse> {
    return request<AppointmentResponse>(
        `/appointments/${id}`,
        { method: 'PUT', body: JSON.stringify(payload) },
        token
    );
}

export async function deleteAppointment(id: string, token?: string): Promise<void> {
    await request<unknown>(`/appointments/${id}`, { method: 'DELETE' }, token);
}

export async function changeAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    cancelledReason?: string,
    token?: string
): Promise<AppointmentResponse> {
    const body: AppointmentStatusRequest = { status };
    if (cancelledReason) body.cancelled_reason = cancelledReason;
    return request<AppointmentResponse>(
        `/appointments/${id}/status`,
        { method: 'PATCH', body: JSON.stringify(body) },
        token
    );
}

export async function getAvailability(
    clinicId: string,
    date: string,
    veterinarianId?: string,
    token?: string
): Promise<AvailabilitySlot[]> {
    const params = new URLSearchParams({ clinic_id: clinicId, date });
    if (veterinarianId) params.set('veterinarian_id', veterinarianId);
    const res = await request<AvailabilityResponse>(
        `/appointments/availability?${params.toString()}`,
        { method: 'GET' },
        token
    );
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res as unknown as AvailabilitySlot[];
    return [];
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCHEDULES
// ═══════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractScheduleArray(res: any): ClinicSchedule[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.schedules)) return res.data.schedules;
    return [];
}

export async function getSchedules(clinicId: string, token?: string): Promise<ClinicSchedule[]> {
    const res = await request<ScheduleListResponse>(`/schedules/${clinicId}`, { method: 'GET' }, token);
    return extractScheduleArray(res);
}

export async function createSchedule(payload: ScheduleRequest, token?: string): Promise<ScheduleResponse> {
    return request<ScheduleResponse>('/schedules', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function updateSchedule(
    id: string,
    payload: Partial<ScheduleRequest>,
    token?: string
): Promise<ScheduleResponse> {
    return request<ScheduleResponse>(
        `/schedules/${id}`,
        { method: 'PUT', body: JSON.stringify(payload) },
        token
    );
}

export async function deleteSchedule(id: string, token?: string): Promise<void> {
    await request<unknown>(`/schedules/${id}`, { method: 'DELETE' }, token);
}

// ═══════════════════════════════════════════════════════════════════════════
//  VET BLOCKS
// ═══════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractVetBlockArray(res: any): VetBlock[] {
    let arr = [];
    if (Array.isArray(res)) arr = res;
    else if (Array.isArray(res?.data)) arr = res.data;
    else if (Array.isArray(res?.data?.vetblocks)) arr = res.data.vetblocks;
    
    return arr.map((b: any) => ({
        ...b,
        day_of_week: typeof b.day_of_week === 'number' ? REVERSE_DAY_OF_WEEK_MAP[b.day_of_week] : b.day_of_week,
        slot_duration_minutes: b.slot_duration || b.slot_duration_minutes || 30
    }));
}

export async function getVetBlocks(clinicId: string, token?: string): Promise<VetBlock[]> {
    const res = await request<VetBlockListResponse>(`/vetblocks/${clinicId}`, { method: 'GET' }, token);
    return extractVetBlockArray(res);
}

export async function createVetBlock(payload: VetBlockRequest, token?: string): Promise<VetBlockResponse> {
    const mappedPayload = {
        ...payload,
        day_of_week: typeof payload.day_of_week === 'string' ? DAY_OF_WEEK_MAP[payload.day_of_week] : payload.day_of_week,
        slot_duration: payload.slot_duration_minutes
    };
    return request<VetBlockResponse>('/vetblocks', { method: 'POST', body: JSON.stringify(mappedPayload) }, token);
}

export async function updateVetBlock(
    id: string,
    payload: Partial<VetBlockRequest>,
    token?: string
): Promise<VetBlockResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedPayload: any = { ...payload };
    if (payload.day_of_week) {
        mappedPayload.day_of_week = typeof payload.day_of_week === 'string' ? DAY_OF_WEEK_MAP[payload.day_of_week] : payload.day_of_week;
    }
    if (payload.slot_duration_minutes !== undefined) {
        mappedPayload.slot_duration = payload.slot_duration_minutes;
    }
    return request<VetBlockResponse>(
        `/vetblocks/${id}`,
        { method: 'PUT', body: JSON.stringify(mappedPayload) },
        token
    );
}

export async function deleteVetBlock(id: string, token?: string): Promise<void> {
    await request<unknown>(`/vetblocks/${id}`, { method: 'DELETE' }, token);
}

// ═══════════════════════════════════════════════════════════════════════════
//  WAITLIST
// ═══════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractWaitlistArray(res: any): WaitlistEntry[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.entries)) return res.data.entries;
    return [];
}

export async function getWaitlist(clinicId: string, token?: string): Promise<WaitlistEntry[]> {
    const res = await request<WaitlistListResponse>(`/waitlist/${clinicId}`, { method: 'GET' }, token);
    return extractWaitlistArray(res);
}

export async function updateWaitlistStatus(
    id: string,
    status: string,
    token?: string
): Promise<void> {
    await request<unknown>(`/waitlist/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }, token);
}
