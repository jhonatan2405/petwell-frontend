import type {
    Invoice,
    InvoiceListResponse,
    InvoiceResponse,
    ClinicPricing,
    ClinicPricingResponse,
    InitPaymentResponse,
} from '@/types';
import { getToken } from '@/utils/auth';

const BASE = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:3001/api/v1

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const res = await fetch(`${BASE}/${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers as Record<string, string> ?? {}),
        },
    });
    const json = await res.json() as T;
    if (!res.ok) {
        const msg = (json as { message?: string })?.message ?? `Error ${res.status}`;
        throw new Error(msg);
    }
    return json;
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export async function getInvoices(): Promise<Invoice[]> {
    const res = await authFetch<InvoiceListResponse>('billing/invoices');
    return res.data ?? [];
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
    const res = await authFetch<InvoiceResponse>(`billing/invoices/${id}`);
    return res.data ?? null;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function initPayment(invoiceId: string): Promise<{ redirect_url: string; reference: string }> {
    const res = await authFetch<InitPaymentResponse>('billing/payments/init', {
        method: 'POST',
        body: JSON.stringify({ invoice_id: invoiceId }),
    });
    if (!res.data?.redirect_url) throw new Error('No se recibió URL de pago');
    return { redirect_url: res.data.redirect_url, reference: res.data.reference };
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export async function getClinicPricing(clinicId: string): Promise<ClinicPricing | null> {
    const res = await authFetch<ClinicPricingResponse>(`billing/pricing/${clinicId}`);
    return res.data ?? null;
}

export async function saveClinicPricing(pricing: ClinicPricing): Promise<ClinicPricing> {
    const res = await authFetch<ClinicPricingResponse>('billing/pricing', {
        method: 'POST',
        body: JSON.stringify(pricing),
    });
    if (!res.data) throw new Error('Error guardando precios');
    return res.data;
}

// ─── Payment Confirmation ──────────────────────────────────────────────────────

export async function confirmPayment(invoiceId: string, reference: string): Promise<void> {
    await authFetch<{ success: boolean }>('billing/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ invoice_id: invoiceId, reference }),
    });
}
