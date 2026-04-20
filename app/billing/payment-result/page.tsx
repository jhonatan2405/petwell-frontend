"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function PaymentResultContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get("status"); // "success" | "failed" | null

    const isSuccess = status === "success";
    const isFailed = status === "failed";

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center space-y-6">

            {!status && (
                <>
                    <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-4xl">🔗</div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Regresaste de Bold</h2>
                    <p className="text-gray-500 text-sm">
                        Usa el botón <strong>"🔍 Verificar"</strong> en tu cita e ingresa tu referencia para confirmar el pago.
                    </p>
                </>
            )}

            {isSuccess && (
                <>
                    <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center text-4xl">✅</div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Pago realizado</h2>
                    <p className="text-gray-500 text-sm">
                        Usa el botón <strong>"🔍 Verificar"</strong> en tu cita e ingresa tu referencia para confirmar.
                    </p>
                </>
            )}

            {isFailed && (
                <>
                    <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center text-4xl">❌</div>
                    <h2 className="text-2xl font-extrabold text-gray-900">El pago no se completó</h2>
                    <p className="text-gray-500 text-sm">
                        Puedes intentarlo de nuevo desde tus citas.
                    </p>
                </>
            )}

            <Link
                href="/appointments"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-md"
            >
                Volver a mis citas
            </Link>
        </div>
    );
}

export default function PaymentResultPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <Suspense fallback={<LoadingSpinner text="Cargando estado del pago..." />}>
                <PaymentResultContent />
            </Suspense>
        </div>
    );
}
