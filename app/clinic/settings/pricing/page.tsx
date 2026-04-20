"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { getClinicPricing, saveClinicPricing } from "@/services/billingService";
import type { ClinicPricing } from "@/types";

const DEFAULT_PRICING: ClinicPricing = {
    clinic_id: "",
    price_consulta: 0,
    price_urgencia: 0,
    price_telemedicina: 0,
    price_vacunacion: 0,
};

export default function PricingSettingsPage() {
    const { user, loading: isAuthLoading } = useAuthContext();
    const router = useRouter();

    const [form, setForm] = useState<ClinicPricing>(DEFAULT_PRICING);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const loadPricing = useCallback(async () => {
        if (!user?.clinic_id) return;
        
        console.log("[Pricing] Cargando pricing para clinic:", user.clinic_id);
        setLoading(true);
        try {
            const data = await getClinicPricing(user.clinic_id);
            console.log("[Pricing] Pricing recibido:", data);
            setForm(data || { ...DEFAULT_PRICING, clinic_id: user.clinic_id });
        } catch (err: any) {
            console.error("[Pricing] Error cargando pricing:", err);
            setError("Error al cargar los precios. Por favor intente más tarde.");
            setForm({ ...DEFAULT_PRICING, clinic_id: user.clinic_id });
        } finally {
            setLoading(false);
        }
    }, [user?.clinic_id]);

    useEffect(() => {
        if (!user?.clinic_id) return;
        loadPricing();
    }, [user?.clinic_id, loadPricing]);

    // Auto-dismiss success message
    useEffect(() => {
        if (!successMsg) return;
        const t = setTimeout(() => setSuccessMsg(null), 3000);
        return () => clearTimeout(t);
    }, [successMsg]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        if (
            form.price_consulta < 0 ||
            form.price_urgencia < 0 ||
            form.price_telemedicina < 0 ||
            form.price_vacunacion < 0
        ) {
            setError("No se permiten valores negativos.");
            return;
        }

        setSaving(true);
        try {
            const dataToSave = { ...form, clinic_id: user!.clinic_id! };
            const saved = await saveClinicPricing(dataToSave);
            setForm(saved);
            setSuccessMsg("Precios guardados correctamente");
        } catch (err: any) {
            console.error("[Pricing] Error guardando:", err);
            setError(err.message || "Error al guardar los precios");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof ClinicPricing, val: string) => {
        const num = parseInt(val, 10);
        setForm(prev => ({ ...prev, [field]: isNaN(num) ? 0 : Math.max(0, num) }));
    };

    // ── Render returns (ALWAYS AFTER HOOKS) ──────────────────────────────────
    
    if (isAuthLoading || !user) {
        return (
            <div className="max-w-3xl mx-auto py-8 px-4 flex justify-center mt-20 text-gray-500 font-medium">
                Cargando usuario...
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto py-8 px-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-8"></div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-12 bg-gray-100 rounded-xl w-full"></div>
                        </div>
                    ))}
                    <div className="h-12 bg-gray-200 rounded-xl w-44 ml-auto mt-6"></div>
                </div>
            </div>
        );
    }

    // ── Access guard ──────────────────────────────────────────────────────────
    if (!user || user.role !== "CLINIC_ADMIN") {
        return (
            <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-3xl">🚫</div>
                <h2 className="text-2xl font-bold text-gray-800">Acceso restringido</h2>
                <p className="text-gray-500">Solo el administrador de la clínica puede configurar los precios.</p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    // ── Main form ─────────────────────────────────────────────────────────────
    const fields: { key: keyof ClinicPricing; label: string; icon: string; accent: string }[] = [
        { key: "price_consulta",    label: "Consulta Presencial",  icon: "🩺", accent: "indigo" },
        { key: "price_telemedicina",label: "Telemedicina",         icon: "💻", accent: "purple" },
        { key: "price_urgencia",    label: "Urgencia",             icon: "🚨", accent: "red"    },
        { key: "price_vacunacion",  label: "Vacunación",           icon: "💉", accent: "green"  },
    ];

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 relative">

            {/* Toast */}
            <div className={`fixed top-24 right-8 z-50 transition-all duration-500 transform ${successMsg ? "translate-x-0 opacity-100" : "translate-x-40 opacity-0 pointer-events-none"}`}>
                <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-xl font-semibold flex items-center gap-3">
                    <span className="text-xl">✅</span>
                    {successMsg}
                </div>
            </div>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    💰 Configuración de precios
                </h1>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                    Define las tarifas base (en pesos colombianos) que se cobrarán automáticamente al crear citas. Un valor de <code className="bg-gray-100 px-1 rounded">0</code> indica servicio gratuito temporalmente.
                </p>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm">
                    <span>⚠️</span>
                    <p className="font-medium text-red-800">{error}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="space-y-6">
                    {fields.map(({ key, label, icon }) => (
                        <div key={key} className="group">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {icon} {label}
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute left-4 font-bold text-gray-400 select-none">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={form[key] as number || ""}
                                    onChange={e => handleChange(key, e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-8 pr-16 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono font-semibold text-lg"
                                />
                                <span className="absolute right-4 text-sm font-medium text-gray-400 select-none">COP</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center min-w-[200px] disabled:opacity-70 disabled:cursor-wait"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Guardando...
                            </span>
                        ) : (
                            "Guardar precios"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
