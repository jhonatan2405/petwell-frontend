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


// ─── URL base del API Gateway ─────────────────────────────────────────────────
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helper fetch con JWT automático ─────────────────────────────────────────
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

// ════════════════════════════════════════════════════════════════════════════════
// CRUD DE REGISTROS CLÍNICOS
// ════════════════════════════════════════════════════════════════════════════════

// GET /api/v1/ehr/pet/:petId
export async function getEhrByPet(petId: string, token: string): Promise<EhrRecord[]> {
    const res = await request<EhrListResponse>(`/api/v1/ehr/pet/${petId}`, { method: 'GET' }, token);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
}

// GET /api/v1/ehr/:id
export async function getEhrById(id: string, token: string): Promise<EhrRecord | null> {
    const res = await request<EhrResponse>(`/api/v1/ehr/${id}`, { method: 'GET' }, token);
    return res.data ?? null;
}

// POST /api/v1/ehr
export async function createEhr(
    petId: string,
    payload: EhrRequest,
    token: string
): Promise<EhrResponse> {
    return request<EhrResponse>('/api/v1/ehr', {
        method: 'POST',
        body: JSON.stringify({ ...payload, pet_id: petId }),
    }, token);
}

// PUT /api/v1/ehr/:id
export async function updateEhr(
    id: string,
    payload: Partial<EhrRequest>,
    token: string
): Promise<EhrResponse> {
    return request<EhrResponse>(`/api/v1/ehr/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }, token);
}

// DELETE /api/v1/ehr/:id
export async function deleteEhr(
    id: string,
    token: string
): Promise<{ success: boolean; message?: string }> {
    return request(`/api/v1/ehr/${id}`, { method: 'DELETE' }, token);
}

// ════════════════════════════════════════════════════════════════════════════════
// PERMISOS / CONSENTIMIENTO DE CLÍNICAS  (endpoints reales del backend)
// ════════════════════════════════════════════════════════════════════════════════

// GET /api/v1/ehr/permissions/:petId → lista de clínicas con permiso
export async function getPermissions(petId: string, token: string): Promise<EhrConsentResponse> {
    return request<EhrConsentResponse>(`/api/v1/ehr/permissions/${petId}`, { method: 'GET' }, token);
}

// POST /api/v1/ehr/permissions → otorgar permiso a una clínica
export async function grantPermission(
    petId: string,
    clinicId: string,
    token: string
): Promise<{ success: boolean; message?: string }> {
    return request(`/api/v1/ehr/permissions`, {
        method: 'POST',
        body: JSON.stringify({ pet_id: petId, clinic_id: clinicId }),
    }, token);
}

// DELETE /api/v1/ehr/permissions → revocar permiso de una clínica
export async function revokePermission(
    petId: string,
    clinicId: string,
    token: string
): Promise<{ success: boolean; message?: string }> {
    return request(`/api/v1/ehr/permissions`, {
        method: 'DELETE',
        body: JSON.stringify({ pet_id: petId, clinic_id: clinicId }),
    }, token);
}

// ─── Aliases de compatibilidad (mantienen el contrato de los componentes previos)
export const getClinicConsents = getPermissions;
export const grantClinicAccess = (petId: string, clinicId: string, token: string) =>
    grantPermission(petId, clinicId, token);
export const revokeClinicAccess = (petId: string, clinicId: string, token: string) =>
    revokePermission(petId, clinicId, token);

// ════════════════════════════════════════════════════════════════════════════════
// AUDITORÍA DE ACCESOS  (endpoint real del backend)
// ════════════════════════════════════════════════════════════════════════════════

// GET /api/v1/ehr/audit/:petId → log de auditoría
export async function getAudit(petId: string, token: string): Promise<EhrAuditResponse> {
    return request<EhrAuditResponse>(`/api/v1/ehr/audit/${petId}`, { method: 'GET' }, token);
}

// ─── Alias de compatibilidad ─────────────────────────────────────────────────
export const getEhrAuditLog = getAudit;

// ════════════════════════════════════════════════════════════════════════════════
// VACUNAS
// ════════════════════════════════════════════════════════════════════════════════

// GET /api/v1/ehr/:petId/vaccinations
export async function getVaccinations(petId: string, token: string): Promise<Vaccination[]> {
    const res = await request<VaccinationListResponse>(`/api/v1/ehr/${petId}/vaccinations`, { method: 'GET' }, token);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
}

// POST /api/v1/ehr/vaccinations
export async function createVaccination(
    payload: VaccinationRequest,
    token: string,
): Promise<Vaccination> {
    const res = await request<{ success: boolean; data: Vaccination }>('/api/v1/ehr/vaccinations', {
        method: 'POST',
        body: JSON.stringify(payload),
    }, token);
    return res.data;
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORTAR PDF
// ════════════════════════════════════════════════════════════════════════════════

// GET /api/v1/ehr/:petId/export/pdf  → triggers browser file download
export async function downloadEhrPdf(petId: string, token: string): Promise<void> {
    const url = `${BASE_URL}/api/v1/ehr/${petId}/export/pdf`;
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
