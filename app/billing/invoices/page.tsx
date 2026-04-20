'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { getInvoices, initPayment } from '@/services/billingService';
import type { Invoice } from '@/types';

const STATUS_CONFIG = {
    DRAFT:           { label: 'Borrador',           color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
    PENDING_PAYMENT: { label: 'Pendiente de pago',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    PAID:            { label: 'Pagado',              color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    CANCELLED:       { label: 'Cancelado',           color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

function formatCOP(amount: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function InvoicesPage() {
    const router = useRouter();
    const { user } = useAuthContext();
    const isClinic = ['CLINIC_ADMIN', 'VETERINARIO', 'RECEPCIONISTA'].includes(user?.role ?? '');

    const [invoices, setInvoices]   = useState<Invoice[]>([]);
    const [loading, setLoading]     = useState(true);
    const [paying, setPaying]       = useState<string | null>(null);
    const [toast, setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const load = useCallback(async () => {
        try {
            const data = await getInvoices();
            setInvoices(data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handlePay = async (invoice: Invoice) => {
        setPaying(invoice.id);
        showToast('🔄 Redirigiendo al pago...', 'success');
        try {
            const { redirect_url } = await initPayment(invoice.id);
            window.location.href = redirect_url;
        } catch (e: unknown) {
            showToast((e as Error).message ?? 'Error iniciando pago', 'error');
            setPaying(null);
        }
    };

    // Clinic summary stats
    const totalPaid    = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total_amount, 0);
    const totalPending = invoices.filter(i => i.status === 'PENDING_PAYMENT').reduce((s, i) => s + i.total_amount, 0);

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)', padding: '2rem 1rem', fontFamily: "'Inter',sans-serif" }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {toast && (
                <div style={{
                    position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '1rem 1.5rem',
                    borderRadius: 12, background: toast.type === 'success' ? '#065f46' : '#7f1d1d',
                    color: '#fff', fontWeight: 600, animation: 'fadeIn 0.3s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>{toast.msg}</div>
            )}

            <div style={{ maxWidth: 860, margin: '0 auto' }}>
                <button onClick={() => router.back()}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '1.5rem', fontSize: 14 }}>
                    ← Volver
                </button>

                <h1 style={{ color: '#f1f5f9', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>
                    🧾 {isClinic ? 'Ingresos y Facturas' : 'Mis Facturas'}
                </h1>
                <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: 15 }}>
                    {isClinic ? 'Gestión financiera de la clínica' : 'Historial de pagos y facturas pendientes'}
                </p>

                {/* Clinic summary */}
                {isClinic && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { label: 'Total cobrado', value: formatCOP(totalPaid), color: '#10b981', icon: '✅' },
                            { label: 'Pendiente de cobro', value: formatCOP(totalPending), color: '#f59e0b', icon: '⏳' },
                            { label: 'Total facturas', value: String(invoices.length), color: '#6366f1', icon: '📄' },
                        ].map(stat => (
                            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
                                <div style={{ color: stat.color, fontSize: 22, fontWeight: 800 }}>{stat.value}</div>
                                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Invoice list */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #374151', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                ) : invoices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                        <p style={{ fontSize: 18, fontWeight: 600 }}>No hay facturas aún</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {invoices.map(invoice => {
                            const cfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.DRAFT;
                            const isPending = invoice.status === 'PENDING_PAYMENT';
                            return (
                                <div key={invoice.id} style={{
                                    background: 'rgba(255,255,255,0.05)', borderRadius: 16,
                                    padding: '1.25rem 1.5rem', border: `1px solid ${isPending ? '#f59e0b44' : 'rgba(255,255,255,0.08)'}`,
                                    display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                                }}>
                                    <div style={{ flex: 1, minWidth: 180 }}>
                                        <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                                            {invoice.description ?? 'Consulta veterinaria'}
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: 13 }}>
                                            {formatDate(invoice.created_at)}
                                            {invoice.appointment_id && <span style={{ marginLeft: 8, color: '#475569' }}>• Cita #{invoice.appointment_id.slice(-6)}</span>}
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right', minWidth: 110 }}>
                                        <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 18 }}>
                                            {formatCOP(invoice.total_amount)}
                                        </div>
                                    </div>

                                    <span style={{
                                        background: cfg.bg, color: cfg.color, borderRadius: 20,
                                        padding: '4px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                                    }}>{cfg.label}</span>

                                    {!isClinic && isPending && (
                                        <button
                                            onClick={() => handlePay(invoice)}
                                            disabled={paying === invoice.id}
                                            style={{
                                                background: paying === invoice.id ? '#4b5563' : 'linear-gradient(135deg,#f59e0b,#ef4444)',
                                                color: '#fff', border: 'none', borderRadius: 10,
                                                padding: '0.5rem 1.25rem', fontWeight: 700, cursor: paying === invoice.id ? 'wait' : 'pointer',
                                                fontSize: 13, whiteSpace: 'nowrap',
                                                boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                                            }}
                                        >
                                            {paying === invoice.id ? '⏳ Redirigiendo...' : '💳 Pagar ahora'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
