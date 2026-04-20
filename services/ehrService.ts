import type {
    EhrRecord,
    EhrRequest,
    EhrResponse,
    EhrListResponse,
    EhrAuditResponse,
    EhrConsentResponse,
    Vaccination,
    VaccinationRequest,
    VaccinationListResponse,
} from '@/types';

// BASE_URL ya incluye /api/v1 (definido en .env.local)
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helper fetch con JWT automático ─────────────────────────────────────────
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

// ════════════════════════════════════════════════════════════════════════════════
// CRUD DE REGISTROS CLÍNICOS
// ════════════════════════════════════════════════════════════════════════════════

export async function getEhrByPet(petId: string, token: string): Promise<EhrRecord[]> {
    const res = await request<EhrListResponse>(`ehr/pet/${petId}`, { method: 'GET' }, token);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
}

export async function getEhrById(id: string, token: string): Promise<EhrRecord | null> {
    const res = await request<EhrResponse>(`ehr/${id}`, { method: 'GET' }, token);
    return res.data ?? null;
}

export async function createEhr(
    petId: string,
    payload: EhrRequest,
    token: string
): Promise<EhrResponse> {
    return request<EhrResponse>('ehr', {
        method: 'POST',
        body: JSON.stringify({ ...payload, pet_id: petId }),
    }, token);
}

export async function updateEhr(
    id: string,
    payload: Partial<EhrRequest>,
    token: string
): Promise<EhrResponse> {
    return request<EhrResponse>(`ehr/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }, token);
}

export async function deleteEhr(
    id: string,
    token: string
): Promise<{ success: boolean; message?: string }> {
    return request(`ehr/${id}`, { method: 'DELETE' }, token);
}

// ════════════════════════════════════════════════════════════════════════════════
// PERMISOS / CONSENTIMIENTO DE CLÍNICAS
// ════════════════════════════════════════════════════════════════════════════════

export async function getPermissions(petId: string, token: string): Promise<EhrConsentResponse> {
    return request<EhrConsentResponse>(`ehr/permissions/${petId}`, { method: 'GET' }, token);
}

export async function grantPermission(
    petId: string,
    clinicId: string,
    token: string
): Promise<{ success: boolean; message?: string }> {
    return request('ehr/permissions', {
        method: 'POST',
        body: JSON.stringify({ pet_id: petId, clinic_id: clinicId }),
    }, token);
}

export async function revokePermission(
    petId: string,
    clinicId: string,
    token: string
): Promise<{ success: boolean; message?: string }> {
    return request('ehr/permissions', {
        method: 'DELETE',
        body: JSON.stringify({ pet_id: petId, clinic_id: clinicId }),
    }, token);
}

// ─── Aliases de compatibilidad ─────────────────────────────────────────────────
export const getClinicConsents = getPermissions;
export const grantClinicAccess = (petId: string, clinicId: string, token: string) =>
    grantPermission(petId, clinicId, token);
export const revokeClinicAccess = (petId: string, clinicId: string, token: string) =>
    revokePermission(petId, clinicId, token);

// ════════════════════════════════════════════════════════════════════════════════
// AUDITORÍA DE ACCESOS
// ════════════════════════════════════════════════════════════════════════════════

export async function getAudit(petId: string, token: string): Promise<EhrAuditResponse> {
    return request<EhrAuditResponse>(`ehr/audit/${petId}`, { method: 'GET' }, token);
}

export const getEhrAuditLog = getAudit;

// ════════════════════════════════════════════════════════════════════════════════
// VACUNAS
// ════════════════════════════════════════════════════════════════════════════════

export async function getVaccinations(petId: string, token: string): Promise<Vaccination[]> {
    const res = await request<VaccinationListResponse>(`ehr/${petId}/vaccinations`, { method: 'GET' }, token);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
}

export async function createVaccination(
    payload: VaccinationRequest,
    token: string,
): Promise<Vaccination> {
    const res = await request<{ success: boolean; data: Vaccination }>('ehr/vaccinations', {
        method: 'POST',
        body: JSON.stringify(payload),
    }, token);
    return res.data;
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORTAR PDF
// ════════════════════════════════════════════════════════════════════════════════

export async function downloadEhrPdf(petId: string, token: string): Promise<void> {
    const url = `${BASE_URL}/ehr/${petId}/export/pdf`;
    console.log('🌐 Request URL:', url);

    const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({ message: `Error ${response.status}` }));
        throw new Error((body as { message?: string }).message || `Error ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `historial-${petId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(objectUrl);
}
