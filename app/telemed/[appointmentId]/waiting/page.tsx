'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSessionByAppointmentId, generateToken, startSession } from '@/services/telemedService';
import { getAppointmentById } from '@/services/appointmentService';
import { useAuthContext } from '@/context/AuthContext';
import type { TelemedSession, Appointment } from '@/types';

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusDot({ active }: { active: boolean }) {
    return (
        <span className="relative flex h-3 w-3 shrink-0">
            {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${active ? 'bg-green-500' : 'bg-amber-400'}`} />
        </span>
    );
}

function SpinnerRing({ icon = '💻', size = 'md' }: { icon?: string; size?: 'sm' | 'md' | 'lg' }) {
    const s = size === 'lg' ? 'w-24 h-24 text-3xl' : size === 'sm' ? 'w-12 h-12 text-lg' : 'w-20 h-20 text-2xl';
    return (
        <div className={`relative ${s} flex items-center justify-center`}>
            <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
            <span>{icon}</span>
        </div>
    );
}

function FullscreenOverlay({ text }: { text: string }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-petwell-navy/85 backdrop-blur-md animate-fade-in">
            <div className="bg-white/10 p-8 rounded-3xl border border-white/20 flex flex-col items-center gap-6 shadow-2xl backdrop-blur-xl min-w-[280px]">
                <SpinnerRing icon="🎥" size="lg" />
                <div className="text-center">
                    <div className="text-white text-lg font-bold mb-1">{text}</div>
                    <div className="text-white/60 text-sm">Estableciendo conexión segura</div>
                </div>
            </div>
        </div>
    );
}

// ─── Page: Waiting Room ───────────────────────────────────────────────────────
export default function TelemedWaitingRoom() {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const { user } = useAuthContext();
    const router = useRouter();
    const isVet = user?.role === 'VETERINARIO';

    const [session, setSession] = useState<TelemedSession | null>(null);
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [overlayText, setOverlayText] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // ── Enter room ────────────────────────────────────────────────────────────
    const enterRoom = useCallback(async (s: TelemedSession) => {
        setOverlayText('Conectando a la sala...');
        try {
            const tokenData = await generateToken(s.id);
            await new Promise(r => setTimeout(r, 700));
            window.open(`${tokenData.room_url}?t=${tokenData.token}`, '_blank', 'noopener,noreferrer');
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo obtener acceso a la sala');
        } finally {
            setOverlayText(null);
        }
    }, []);

    // ── Fetch session & appointment ────────────────────────────────────────────
    const fetchSession = useCallback(async (silent = false) => {
        try {
            const [s, appt] = await Promise.all([
                getSessionByAppointmentId(appointmentId),
                getAppointmentById(appointmentId)
            ]);
            setSession(s);
            setAppointment(appt);

            // Auto redirect para dueños cuando la sesión termina
            if (s?.status === 'COMPLETED' || s?.status === 'CANCELLED') {
                if (!isVet) router.replace('/appointments');
            }

            // Para dueños: entrar automáticamente cuando el vet inicia
            if (!isVet && s?.status === 'IN_PROGRESS') {
                if (pollRef.current) clearInterval(pollRef.current);
                await enterRoom(s);
            }
        } catch (err: any) {
            if (!silent) setError(err?.message ?? 'Error al verificar la sala');
        } finally {
            if (!silent) setPageLoading(false);
        }
    }, [appointmentId, isVet, enterRoom, router]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    // ── Owner polling (every 8s) — VETS do NOT poll ───────────────────────────
    useEffect(() => {
        if (isVet) return; // vets don't poll
        if (!session || session.status !== 'CREATED') return;

        pollRef.current = setInterval(() => fetchSession(true), 8000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [session, isVet, fetchSession]);

    // ── Vet: start + enter ────────────────────────────────────────────────────
    const handleVetStart = async () => {
        if (!session) return;
        setError(null);
        setOverlayText('Iniciando consulta...');
        try {
            const started = await startSession(session.id);
            setSession(started);
            await enterRoom(started);
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo iniciar la consulta');
            setOverlayText(null);
        }
    };

    // ── Vet: enter already-in-progress session ────────────────────────────────
    const handleVetEnter = async () => {
        if (!session) return;
        setError(null);
        await enterRoom(session);
    };

    // ── Vet: end session ──────────────────────────────────────────────────────
    // El backend actualiza telemed_session + appointment en una sola llamada.
    const handleVetEnd = async () => {
        if (!session) return;
        setError(null);
        setOverlayText('Finalizando consulta...');
        try {
            const { endSession } = await import('@/services/telemedService');
            const ended = await endSession(session.id);
            // Actualizar UI local con el estado devuelto por el backend
            setSession(ended);
            if (appointment) {
                setAppointment({ ...appointment, status: 'COMPLETED' as any });
            }
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo finalizar la consulta');
        } finally {
            setOverlayText(null);
        }
    };

    // ── Loading state ─────────────────────────────────────────────────────────
    if (pageLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <SpinnerRing />
                    <p className="text-sm text-purple-600 font-medium animate-pulse">Verificando sala...</p>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  VET VIEW
    // ─────────────────────────────────────────────────────────────────────────
    if (isVet) {
        const isSessionEnded = session?.status === 'COMPLETED' || session?.status === 'CANCELLED';
        
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                {overlayText && <FullscreenOverlay text={overlayText} />}
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 overflow-hidden">

                        {/* Header band — indigo for vet */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-1">PetWell · Médico</p>
                            <h1 className="text-xl font-bold">Panel de Consulta Virtual</h1>
                        </div>

                        <div className="px-6 py-8 flex flex-col items-center gap-6 text-center">

                            {/* Status icon */}
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                <span className="text-3xl">
                                    {isSessionEnded ? '🔴' : session?.status === 'IN_PROGRESS' ? '🟢' : '🎥'}
                                </span>
                            </div>

                            {/* Main text */}
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 mb-1">
                                    {isSessionEnded
                                        ? 'Consulta finalizada'
                                        : session?.status === 'IN_PROGRESS'
                                        ? 'Consulta en curso'
                                        : 'Estás listo para iniciar la consulta'}
                                </h2>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {isSessionEnded
                                        ? 'La llamada ha concluido y la sala se ha cerrado.'
                                        : session?.status === 'IN_PROGRESS'
                                        ? 'La consulta ya está en curso. Puedes entrar a la sala.'
                                        : 'El paciente está esperando. Inicia cuando estés listo.'}
                                </p>
                            </div>

                            {/* Session status chip */}
                            <div className="w-full flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <StatusDot active={session?.status === 'IN_PROGRESS'} />
                                    <span className="text-xs font-semibold text-gray-700">Estado de la sala</span>
                                </div>
                                <span className={`text-xs font-bold ${
                                    isSessionEnded ? 'text-gray-500' : session?.status === 'IN_PROGRESS' ? 'text-green-600' : 'text-amber-600'
                                }`}>
                                    {isSessionEnded ? '🔴 Finalizada' : session?.status === 'IN_PROGRESS' ? '🟢 En curso' : '🟡 Pendiente'}
                                </span>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* CTA */}
                            {isSessionEnded ? (
                                <div className="w-full flex flex-col gap-3">
                                    <button
                                        onClick={() => router.replace('/clinic/appointments')}
                                        className="w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm transition-colors border border-gray-200"
                                    >
                                        Volver a mi agenda
                                    </button>
                                </div>
                            ) : session?.status === 'IN_PROGRESS' ? (
                                <div className="w-full flex flex-col gap-3">
                                    <button
                                        onClick={handleVetEnter}
                                        className="w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        <span className="text-xl">🎥</span>
                                        Entrar a consulta
                                    </button>

                                    {appointment && appointment.pet_id && (
                                        appointment.reason_type === 'VACUNACION' ? (
                                            <a
                                                href={`/pets/${appointment.pet_id}/vaccinations`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all duration-200"
                                            >
                                                <span className="text-lg">💉</span>
                                                Registrar vacuna
                                            </a>
                                        ) : (
                                            <a
                                                href={`/pets/${appointment.pet_id}/ehr/add`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-petwell-teal/10 text-petwell-teal hover:bg-petwell-teal/20 border border-petwell-teal/20 transition-all duration-200"
                                            >
                                                <span className="text-lg">🩺</span>
                                                Registrar historia clínica
                                            </a>
                                        )
                                    )}

                                    <div className="w-full border-t border-gray-100 mt-1 pt-4">
                                        <button
                                            onClick={handleVetEnd}
                                            className="w-full py-3 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            🔴 Finalizar consulta
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleVetStart}
                                    className="w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    <span className="text-xl">🎥</span>
                                    Iniciar consulta
                                </button>
                            )}

                            {!isSessionEnded && (
                                <button
                                    onClick={() => router.back()}
                                    className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors mt-2"
                                >
                                    Volver
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-[11px] text-gray-400 mt-4 leading-relaxed">
                        🔒 Conexión segura · PetWell Telemedicina<br/>
                        Para mejor experiencia durante la videollamada, registra<br/>la historia clínica en una ventana secundaria.
                    </p>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  OWNER VIEW
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
            {overlayText && <FullscreenOverlay text={overlayText} />}
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden">

                    {/* Header band — purple for owner */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 text-white text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-1">PetWell</p>
                        <h1 className="text-xl font-bold">Sala de Consulta Virtual</h1>
                    </div>

                    <div className="px-6 py-8 flex flex-col items-center gap-6 text-center">

                        {/* Animated waiting icon */}
                        <SpinnerRing icon="💻" />

                        {/* Main text */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-1">
                                Preparando tu consulta virtual
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                El veterinario iniciará la consulta en breve. Mantén esta ventana abierta.
                            </p>
                        </div>

                        {/* Waiting indicator */}
                        <div className="w-full bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center text-sm">
                                    🐾
                                </div>
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-xs font-semibold text-gray-700">
                                    Sala asignada y lista
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <StatusDot active={false} />
                                    <span className="text-[11px] text-amber-600 font-medium">
                                        Esperando al veterinario
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Disabled waiting button */}
                        <div className="w-full flex flex-col gap-2">
                            <button
                                disabled
                                className="w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 bg-purple-50 text-purple-300 border border-purple-100 cursor-not-allowed"
                            >
                                <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-500 rounded-full animate-spin" />
                                Esperando al veterinario...
                            </button>
                            <p className="text-[11px] text-gray-400 text-center">
                                Esta página se actualizará automáticamente cuando la consulta inicie
                            </p>
                        </div>

                        <button
                            onClick={() => router.back()}
                            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                        >
                            Volver a mis citas
                        </button>
                    </div>
                </div>

                <p className="text-center text-[11px] text-gray-400 mt-4">
                    🔒 Conexión segura · PetWell Telemedicina
                </p>
            </div>
        </div>
    );
}
