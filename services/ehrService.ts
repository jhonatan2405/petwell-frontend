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
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    return data as T;
}

// ════════════════════════════════════════════════════════════════════════════════
// CRUD DE REGISTROS CLÍNICOS
// ════════════════════════════════════════════════════════════════════════════════

// GET /ehr/pet/:petId
export async function getEhrByPet(petId: string, token: string): Promise<EhrRecord[]> {
    const res = await request<EhrListResponse>(`/ehr/pet/${petId}`, { method: 'GET' }, token);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
}

// GET /ehr/:id
export async function getEhrById(id: string, token: string): Promise<EhrRecord | null> {
    const res = await request<EhrResponse>(`/ehr/${id}`, { method: 'GET' }, token);
    return res.data ?? null;
}

// POST /ehr
export async function createEhr(
    petId: string,
    payload: EhrRequest,
    token: string
): Promise<EhrResponse> {
    return request<EhrResponse>('/ehr', {
        method: 'POST',
        body: JSON.stringify({ ...payload, pet_id: petId }),
    }, token);
}

// PUT /ehr/:id
export async function updateEhr(
    id: string,
    payload: Partial<EhrRequest>,
    token: string
): Promise<EhrResponse> {
    return request<EhrResponse>(`/ehr/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }, token);
}

// DELETE /ehr/:id
export async function deleteEhr(
    id: string,
    token: string
): Promise<{ success: boolean; message?: string }> {
    return request(`/ehr/${id}`, { method: 'DELETE' }, token);
}

// ════════════════════════════════════════════════════════════════════════════════
// PERMISOS / CONSENTIMIENTO DE CLÍNICAS  (endpoints reales del backend)
// ════════════════════════════════════════════════════════════════════════════════

// GET /ehr/permissions/:petId → lista de clínicas con permiso
export async function getPermissions(petId: string, token: string): Promise<EhrConsentResponse> {
    return request<EhrConsentResponse>(`/ehr/permissions/${petId}`, { method: 'GET' }, token);
}

// POST /ehr/permissions → otorgar permiso a una clínica
export async function grantPermission(
    petId: string,
    clinicId: string,
    token: string
): Promise<{ success: boolean; message?: string }> {
    return request(`/ehr/permissions`, {
        method: 'POST',
        body: JSON.stringify({ pet_id: petId, clinic_id: clinicId }),
    }, token);
}

// DELETE /ehr/permissions → revocar permiso de una clínica
export async function revokePermission(
    petId: string,
    clinicId: string,
    token: string
): Promise<{ success: boolean; message?: string }> {
    return request(`/ehr/permissions`, {
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

// GET /ehr/audit/:petId → log de auditoría
export async function getAudit(petId: string, token: string): Promise<EhrAuditResponse> {
    return request<EhrAuditResponse>(`/ehr/audit/${petId}`, { method: 'GET' }, token);
}

// ─── Alias de compatibilidad ─────────────────────────────────────────────────
export const getEhrAuditLog = getAudit;

// ════════════════════════════════════════════════════════════════════════════════
// VACUNAS
// ════════════════════════════════════════════════════════════════════════════════

// GET /ehr/:petId/vaccinations
export async function getVaccinations(petId: string, token: string): Promise<Vaccination[]> {
    const res = await request<VaccinationListResponse>(`/ehr/${petId}/vaccinations`, { method: 'GET' }, token);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
}

// POST /ehr/vaccinations
export async function createVaccination(
    payload: VaccinationRequest,
    token: string,
): Promise<Vaccination> {
    const res = await request<{ success: boolean; data: Vaccination }>('/ehr/vaccinations', {
        method: 'POST',
        body: JSON.stringify(payload),
    }, token);
    return res.data;
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORTAR PDF
// ════════════════════════════════════════════════════════════════════════════════

// GET /ehr/:petId/export/pdf  → triggers browser file download
export async function downloadEhrPdf(petId: string, token: string): Promise<void> {
    const url = `${BASE_URL}/ehr/${petId}/export/pdf`;
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
