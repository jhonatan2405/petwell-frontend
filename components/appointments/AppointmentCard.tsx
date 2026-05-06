'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Appointment, AppointmentStatus } from '@/types';
import type { TelemedSession } from '@/types';
import StatusBadge from './StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { getSessionByAppointmentId, generateToken, startSession } from '@/services/telemedService';
import { useAuthContext } from '@/context/AuthContext';
import { getInvoices, initPayment, confirmPayment } from '@/services/billingService';
import type { Invoice } from '@/types';

interface AppointmentCardProps {
    appointment: Appointment;
    onCancel?: (id: string) => void;
    showCancelButton?: boolean;
    onStatusChange?: (id: string, status: AppointmentStatus) => void;
}

// ─── Date Formatter ───────────────────────────────────────────────────────────
function formatDateTimeStr(dateStr?: string, timeStr?: string) {
    if (!dateStr) return 'Fecha no disponible';
    const cleanTime = timeStr?.slice(0, 5) || '00:00';
    try {
        const [year, month, day] = dateStr.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        let formatted = dateObj.toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
        const [h, m] = cleanTime.split(':');
        let hh = parseInt(h);
        const ampm = hh >= 12 ? 'PM' : 'AM';
        hh = hh % 12 || 12;
        return `${formatted} • ${hh}:${m} ${ampm}`;
    } catch {
        return `${dateStr} • ${cleanTime}`;
    }
}

// ─── Session status config — role-aware ───────────────────────────────────────
type SessionStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

function getSessionPanelConfig(status: SessionStatus | undefined, isVet: boolean) {
    if (!status) return { label: 'Sin sesión aún', color: 'text-gray-400', dot: 'bg-gray-300' };
    switch (status) {
        case 'CREATED':
            return isVet
                ? { label: '🟡 Pendiente — tú debes iniciarla', color: 'text-amber-600 font-semibold', dot: 'bg-amber-400' }
                : { label: '🟡 Preparando sala', color: 'text-amber-600', dot: 'bg-amber-400' };
        case 'IN_PROGRESS':
            return { label: '🟢 Consulta en curso', color: 'text-green-600 font-bold', dot: 'bg-green-500 animate-pulse' };
        case 'COMPLETED':
            return { label: '🔴 Consulta finalizada', color: 'text-red-500', dot: 'bg-red-400' };
        case 'CANCELLED':
            return { label: 'Cancelada', color: 'text-gray-400', dot: 'bg-gray-300' };
    }
}

// ─── Connection Overlay ───────────────────────────────────────────────────────
function ConnectionOverlay({ text = 'Conectando a la consulta...' }: { text?: string }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-petwell-navy/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white/10 p-8 rounded-3xl border border-white/20 flex flex-col items-center gap-6 shadow-2xl backdrop-blur-xl">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-white/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-petwell-teal animate-spin" />
                    <span className="text-3xl animate-pulse">🎥</span>
                </div>
                <div className="text-center">
                    <div className="text-white text-lg font-bold mb-1">{text}</div>
                    <div className="text-white/60 text-sm">Estableciendo conexión segura</div>
                </div>
            </div>
        </div>
    );
}

// ─── Telemed Button — fully role-bifurcated ───────────────────────────────────
type BtnState = 'idle' | 'loading' | 'connecting' | 'done' | 'error';

function TelemedButton({
    appointmentId,
    scheduledAt,
    rawStatus,
    userRole,
    now,
    sessionFromParent,
    onSessionUpdate,
}: {
    appointmentId: string;
    scheduledAt: string;
    rawStatus: string;
    userRole?: string;
    now: Date;
    sessionFromParent: TelemedSession | null;
    onSessionUpdate: (s: TelemedSession | null) => void;
}) {
    const [btnState, setBtnState] = useState<BtnState>('idle');
    const [overlayText, setOverlayText] = useState('Conectando a la consulta...');
    const [toast, setToast] = useState<string | null>(null);
    const hasWarned5Min = useRef(false);
    const router = useRouter();
    const isVet = userRole === 'VETERINARIO';
    const session = sessionFromParent;

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4500);
    };

    const openRoom = async (s: TelemedSession) => {
        setOverlayText('Conectando a la consulta...');
        setBtnState('connecting');
        const tokenData = await generateToken(s.id);
        await new Promise(r => setTimeout(r, 700)); // smooth visual delay
        window.open(`${tokenData.room_url}?t=${tokenData.token}`, '_blank', 'noopener,noreferrer');
        setBtnState('done');
    };

    // ── 5-min warning for owner ───────────────────────────────────────────────
    if (scheduledAt && !isVet) {
        const diffMs = new Date(scheduledAt).getTime() - now.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin <= 5 && diffMin > 0 && !hasWarned5Min.current) {
            hasWarned5Min.current = true;
            showToast('⏰ Tu consulta está por iniciar');
        }
    }

    // ── Derive time status ────────────────────────────────────────────────────
    const diffMinutes = scheduledAt
        ? Math.floor((new Date(scheduledAt).getTime() - now.getTime()) / 60000)
        : null;

    const isFinished =
        rawStatus === 'COMPLETED' || rawStatus === 'CANCELLED' ||
        session?.status === 'COMPLETED' || session?.status === 'CANCELLED';

    // ── Click handler ─────────────────────────────────────────────────────────
    const handleClick = async () => {
        if (btnState === 'loading' || btnState === 'connecting') return;

        setBtnState('loading');
        try {
            const fresh = await getSessionByAppointmentId(appointmentId);
            onSessionUpdate(fresh);

            if (!fresh) {
                showToast('La sesión aún no existe. Intenta de nuevo.');
                setBtnState('idle');
                return;
            }
            if (fresh.status === 'COMPLETED' || fresh.status === 'CANCELLED') {
                setBtnState('done');
                return;
            }

            // ── VETERINARIO FLOW ──────────────────────────────────────────────
            if (isVet) {
                if (fresh.status === 'CREATED') {
                    setOverlayText('Iniciando consulta...');
                    setBtnState('connecting');
                    const started = await startSession(fresh.id);
                    onSessionUpdate(started);
                    await openRoom(started);
                } else if (fresh.status === 'IN_PROGRESS') {
                    await openRoom(fresh);
                }
                return;
            }

            // ── OWNER FLOW ────────────────────────────────────────────────────
            if (fresh.status === 'CREATED') {
                // Redirect to WaitingRoom to wait
                router.push(`/telemed/${appointmentId}/waiting`);
                setBtnState('idle');
                return;
            }
            if (fresh.status === 'IN_PROGRESS') {
                await openRoom(fresh);
            }
        } catch (err: any) {
            setBtnState('error');
            showToast(err?.message || 'Error al conectar con la sala');
        }
    };

    // ── Button config ─────────────────────────────────────────────────────────
    type Cfg = { label: string; cls: string; disabled: boolean };
    let cfg: Cfg;

    if (isFinished) {
        cfg = {
            label: '🔴 Consulta finalizada',
            cls: 'bg-red-50 text-red-400 border border-red-200 cursor-not-allowed opacity-70',
            disabled: true,
        };
    } else if (btnState === 'loading' || btnState === 'connecting') {
        cfg = {
            label: isVet ? '⏳ Iniciando sala...' : '⏳ Conectando...',
            cls: 'bg-purple-50 text-purple-400 cursor-not-allowed',
            disabled: true,
        };
    } else if (btnState === 'error') {
        cfg = {
            label: '⚠️ Reintentar',
            cls: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300',
            disabled: false,
        };
    } else if (session?.status === 'IN_PROGRESS') {
        cfg = {
            label: isVet ? '🎥 Entrar a consulta' : '🟢 Unirse a la consulta',
            cls: 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl animate-pulse',
            disabled: false,
        };
    } else if (isVet) {
        // Vet with CREATED session: always show "Iniciar consulta" — no time lock
        cfg = {
            label: '🎥 Iniciar consulta',
            cls: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-xl',
            disabled: false,
        };
    } else {
        // Owner: time-based idle state
        let label = '💻 Unirse a la consulta';
        let disabled = false;
        let cls = 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg';

        if (diffMinutes !== null && diffMinutes > 0) {
            disabled = true;
            if (diffMinutes <= 5) {
                label = '🟡 Disponible en breve';
                cls = 'bg-amber-50 text-amber-700 border border-amber-300 cursor-not-allowed opacity-80';
            } else if (diffMinutes <= 60) {
                label = `⏳ Inicia en ${diffMinutes} min`;
                cls = 'bg-purple-50 text-purple-400 border border-purple-100 cursor-not-allowed opacity-70';
            } else {
                label = `⏳ Faltan ${Math.floor(diffMinutes / 60)} h`;
                cls = 'bg-purple-50 text-purple-400 border border-purple-100 cursor-not-allowed opacity-70';
            }
        }
        cfg = { label, cls, disabled };
    }

    const handleEndSession = async () => {
        if (!session || btnState === 'loading') return;
        setBtnState('loading');
        try {
            const { endSession } = await import('@/services/telemedService');
            const ended = await endSession(session.id);
            onSessionUpdate(ended);
            setBtnState('done');
            showToast('Consulta finalizada');
        } catch (err: any) {
            setBtnState('error');
            showToast(err?.message || 'Error al finalizar');
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {(btnState === 'connecting') && <ConnectionOverlay text={overlayText} />}
            <div className="flex gap-2">
                <button
                    id={`telemed-btn-${appointmentId}`}
                    onClick={handleClick}
                    disabled={cfg.disabled}
                    className={`
                        flex-1 py-3 px-4 rounded-xl font-semibold text-sm
                        flex items-center justify-center gap-2
                        transition-all duration-200 select-none
                        ${cfg.cls}
                    `}
                >
                    {cfg.label}
                </button>
                {isVet && session?.status === 'IN_PROGRESS' && (
                    <button
                        onClick={handleEndSession}
                        disabled={btnState === 'loading'}
                        className="py-3 px-4 rounded-xl font-bold text-sm bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-colors shadow-sm disabled:opacity-50"
                        title="Finalizar consulta de telemedicina"
                    >
                        🔴 Finalizar
                    </button>
                )}
            </div>
            {toast && (
                <div className="text-[11px] text-center text-gray-500 py-1.5 px-2 bg-gray-50 rounded-lg border border-gray-100">
                    {toast}
                </div>
            )}
        </div>
    );
}

// ─── Main AppointmentCard ─────────────────────────────────────────────────────
export default function AppointmentCard({ appointment, onCancel, showCancelButton = false, onStatusChange }: AppointmentCardProps) {
    const { user } = useAuthContext();

    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(interval);
    }, []);

    const [telemedSession, setTelemedSession] = useState<TelemedSession | null>(null);
    const [sessionLoading, setSessionLoading] = useState(false);

    // ─── Payment state ────────────────────────────────────────────────────────
    const [pendingInvoice, setPendingInvoice] = useState<Invoice | null>(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    
    const isPendingPayment = appointment.status === 'PENDING_PAYMENT';
    const isDueno = user?.role === 'DUENO_MASCOTA';

    // Fetch pending invoice — first try from all invoices, fallback by appointment_id
    useEffect(() => {
        if (!isPendingPayment || !isDueno) return;
        getInvoices()
            .then(invoices => {
                const inv = invoices.find(i => i.appointment_id === appointment.id && i.status !== 'CANCELLED');
                if (inv) {
                    setPendingInvoice(inv);
                } else {
                    // Fallback: the invoice might not be on the list yet (async creation). Retry in 3s.
                    const timer = setTimeout(() => {
                        getInvoices().then(retried => {
                            const found = retried.find(i => i.appointment_id === appointment.id && i.status !== 'CANCELLED');
                            if (found) setPendingInvoice(found);
                        }).catch(() => {});
                    }, 3000);
                    return () => clearTimeout(timer);
                }
            })
            .catch(() => {});
    }, [appointment.id, isPendingPayment, isDueno]);

    const handleCopyRef = () => {
        if (!pendingInvoice?.reference) return;
        navigator.clipboard.writeText(pendingInvoice.reference);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGoToBold = async () => {
        if (!pendingInvoice) return;
        setPaymentLoading(true);
        try {
            const { redirect_url } = await initPayment(pendingInvoice.id);
            window.open(redirect_url, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Error initiating dynamic payment:', error);
            const boldUrl = process.env.NEXT_PUBLIC_BOLD_CHECKOUT_URL ?? '#';
            window.open(boldUrl, '_blank', 'noopener,noreferrer');
        } finally {
            setPaymentLoading(false);
        }
    };

    const safeTime = appointment.start_time?.slice(0, 5) || '00:00';
    const scheduledDateObj = appointment.appointment_date
        ? new Date(`${appointment.appointment_date}T${safeTime}:00`)
        : null;
    
    // An appointment is in the past if its start time has already passed
    const isPastAppointment = scheduledDateObj ? scheduledDateObj.getTime() < now.getTime() : false;


    // Robust type detection
    const rawType = appointment.type || '';
    const upperType = rawType.toUpperCase();
    const isTelemedicina = upperType.includes('TELE');
    const isUrgencia = upperType.includes('URG');
    // Default fallback is CONSULTA if it's neither TELE nor URG
    const isVet = user?.role === 'VETERINARIO';

    console.log('[AppointmentCard] type:', rawType, '→ isTelemedicina:', isTelemedicina, 'isUrgencia:', isUrgencia);

    useEffect(() => {
        if (!isTelemedicina) return;
        setSessionLoading(true);
        getSessionByAppointmentId(appointment.id)
            .then(s => setTelemedSession(s))
            .catch(() => {})
            .finally(() => setSessionLoading(false));
    }, [appointment.id, isTelemedicina]);

    const validEHRStatuses = ['CONFIRMED', 'IN_PROGRESS'];
    const canRegisterEhr = isVet && appointment.pet_id && validEHRStatuses.includes(appointment.status);

    const canCancel = showCancelButton && onCancel &&
        (appointment.status === 'PENDING' || appointment.status === 'PENDING_PAYMENT' || appointment.status === 'CONFIRMED');

    // Universal countdown
    let countdownText = '';
    let countdownColor = 'text-gray-500';
    if (scheduledDateObj && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED') {
        const diffMin = Math.floor((scheduledDateObj.getTime() - now.getTime()) / 60000);
        if (diffMin <= 0) {
            countdownText = '🔴 En curso';
            countdownColor = 'text-red-600 font-bold';
        } else if (diffMin <= 60) {
            countdownText = `⏳ Inicia en ${diffMin} min`;
            countdownColor = 'text-amber-600 font-bold';
        } else {
            const h = Math.floor(diffMin / 60);
            countdownText = h < 24 ? `⏳ Faltan ${h} h` : `📅 Faltan ${Math.floor(h / 24)} días`;
        }
    }

    // ─── Unified Look Configurations ──────────────────────────────────────────
    const getTypeConfig = () => {
        if (isTelemedicina) {
            return {
                bgWrap: 'bg-gradient-to-br from-purple-50 via-white to-white border-purple-200 hover:shadow-lg',
                iconWrap: 'bg-purple-100',
                icon: '💻',
                titleColor: 'text-purple-700',
                subColor: 'text-purple-400',
                title: isVet ? 'Consulta Virtual — Médico' : 'Consulta Virtual',
                subtitle: isVet ? 'Tú controlas el inicio de la sesión' : 'El veterinario inicia la sesión',
                badgeText: '💻 TELEMEDICINA',
                badgeBg: 'bg-purple-600 text-white shadow-sm',
                panelWrap: isVet ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-purple-100',
                panelHeaderBg: isVet ? 'border-indigo-100' : 'border-purple-50',
                panelTitle: isVet ? 'Estado de tu consulta' : 'Sala de consulta virtual',
            };
        }
        if (isUrgencia) {
            return {
                // High contrast, ring emphasize and very sublte glow logic via shadow
                bgWrap: 'bg-gradient-to-br from-red-50 via-white to-white border-red-300 ring-1 ring-red-100 hover:shadow-xl hover:border-red-400',
                iconWrap: 'bg-red-100 animate-pulse',
                icon: '🚨',
                titleColor: 'text-red-700',
                subColor: 'text-red-500 font-medium',
                title: 'Atención Prioritaria',
                subtitle: isVet ? 'Paciente requiere atención urgente' : 'Atención prioritaria — acude lo antes posible',
                badgeText: '🚨 URGENCIA',
                badgeBg: 'bg-red-600 text-white shadow-sm',
                panelWrap: 'bg-red-50/80 border-red-200',
                panelHeaderBg: 'border-red-200/60',
                panelTitle: 'Estado de Urgencia',
            };
        }
        // DEFAULT: CONSULTA (Presencial)
        return {
            bgWrap: 'bg-gradient-to-br from-blue-50 via-white to-white border-blue-200 hover:shadow-md',
            iconWrap: 'bg-blue-100',
            icon: '🏥',
            titleColor: 'text-blue-700',
            subColor: 'text-blue-500',
            title: 'Consulta Presencial',
            subtitle: isVet ? 'Paciente agendado para consulta' : 'Cita confirmada en clínica',
            badgeText: '🏥 PRESENCIAL',
            badgeBg: 'bg-blue-600 text-white shadow-sm',
            panelWrap: 'bg-blue-50/60 border-blue-100',
            panelHeaderBg: 'border-blue-100/60',
            panelTitle: 'Estado de la Cita',
        };
    };

    const config = getTypeConfig();

    // ─── Dynamic Panel State Extraction ───────────────────────────────────────
    let panelDynamicLabel = '';
    let panelDynamicColor = '';
    let panelDynamicDot = '';
    let panelHintNode: React.ReactNode = null;

    if (isTelemedicina) {
        const panelCfg = getSessionPanelConfig(telemedSession?.status as SessionStatus | undefined, isVet);
        panelDynamicLabel = sessionLoading ? 'Verificando...' : panelCfg.label;
        panelDynamicColor = panelCfg.color;
        panelDynamicDot = panelCfg.dot;

        const roleHint = (() => {
            const s = telemedSession?.status;
            if (!s || s === 'COMPLETED' || s === 'CANCELLED') return null;
            if (s === 'IN_PROGRESS') return isVet ? '🎥 La consulta está en curso' : '🔗 Sala lista para ingresar';
            return isVet
                ? '👨‍⚕️ Cuando estés listo, inicia la consulta'
                : '⏳ Espera a que el veterinario inicie';
        })();

        panelHintNode = roleHint ? (
            <p className={`text-[11px] font-medium ${
                telemedSession?.status === 'IN_PROGRESS' ? 'text-green-600' : 'text-gray-500'
                } flex items-center gap-1.5`}>
                {telemedSession?.status === 'IN_PROGRESS' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                )}
                {roleHint}
            </p>
        ) : (
            <p className="text-[11px] text-gray-400 italic">
                {!telemedSession ? 'La sala se creará automáticamente al agendar.' : ''}
            </p>
        );
    } else {
        // Physical/Urgent behavior map
        if (appointment.status === 'COMPLETED') {
            panelDynamicLabel = 'Finalizada';
            panelDynamicColor = 'text-gray-500';
            panelDynamicDot = 'bg-gray-400';
            panelHintNode = <p className="text-[11px] text-gray-500 italic">Esta cita ya concluyó exitosamente.</p>;
        } else if (appointment.status === 'CANCELLED') {
            panelDynamicLabel = 'Cancelada';
            panelDynamicColor = 'text-red-500';
            panelDynamicDot = 'bg-red-500';
            panelHintNode = <p className="text-[11px] text-red-400 italic">La cita fue cancelada.</p>;
        } else {
            // PENDING or CONFIRMED
            panelDynamicColor = isUrgencia ? 'text-red-600 font-bold' : 'text-blue-600 font-semibold';
            panelDynamicDot = isUrgencia ? 'bg-red-500 animate-pulse' : 'bg-blue-400';
            panelDynamicLabel = isUrgencia ? 'Requiere atención' : 'Pendiente de llegada';
            
            const hintText = isUrgencia 
                ? (isVet ? 'Preparar recursos para atención inmediata' : 'Dirígete a la clínica de inmediato. Tu equipo te espera.')
                : (isVet ? 'Esperando llegada del paciente' : 'Recuerda llegar 10 minutos antes de tu cita');

            panelHintNode = (
                <p className={`text-[11px] font-medium flex items-center gap-1.5 ${isUrgencia ? 'text-red-600' : 'text-blue-600/80'}`}>
                    {hintText}
                </p>
            );
        }
    }

    return (
        <div className={`p-4 rounded-2xl flex flex-col gap-3 transition-shadow duration-300 animate-fade-in border shadow-sm ${config.bgWrap}`}>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100/80">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.iconWrap}`}>
                        <span className="text-base">{config.icon}</span>
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-widest leading-none ${config.titleColor}`}>
                            {config.title}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${config.subColor}`}>
                            {config.subtitle}
                        </p>
                    </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${config.badgeBg}`}>
                    {config.badgeText}
                </span>
            </div>

            {/* ── Main Info Block: Vet/Clinic & Status ─────────────────────── */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                    <Avatar src={appointment.clinic_logo_url} name={appointment.clinic_name || 'Clínica'} size="md" className="shadow-sm border border-gray-100" />
                    <div>
                        <p className="font-bold text-petwell-navy text-sm">
                            {appointment.clinic_name ?? `Clínica ${appointment.clinic_id.slice(0, 8)}`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Avatar src={appointment.veterinarian_photo_url} name={appointment.veterinarian_name || 'Vet'} size="sm" />
                            <p className="text-xs text-gray-500 font-medium whitespace-normal">
                                Dr. {appointment.veterinarian_name ?? appointment.veterinarian_id.slice(0, 8)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={appointment.status} size="sm" />
                </div>
            </div>

            {/* ── Info Grid: Pet, Date, Countdown ─────────────────────────── */}
            <div className="grid grid-cols-1 gap-2.5 text-xs bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 mt-1">
                <div className="flex items-center gap-2 text-gray-600 font-medium pb-2 border-b border-gray-200/50">
                    <span className="text-gray-400">🐾</span>
                    <span>Paciente:</span>
                    <span className="text-petwell-navy font-bold">{appointment.pet_name ?? 'Mascota'}</span>
                </div>
                <div className="flex items-center gap-2 text-petwell-navy font-semibold">
                    <span className="text-gray-400">📅</span>
                    <span>{formatDateTimeStr(appointment.appointment_date, safeTime)}</span>
                </div>
                {countdownText && (
                    <div className={`flex items-center gap-2 font-medium ${countdownColor}`}>
                        <span className="text-gray-400">⏱️</span>
                        <span>{countdownText}</span>
                    </div>
                )}
            </div>

            {/* ── PENDING_PAYMENT Banner (owner) ─────────────────────────── */}
            {isPendingPayment && isDueno && (
                <>
                    <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-3 flex items-start gap-3 shadow-sm animate-fade-in">
                        <span className="text-2xl shrink-0 mt-0.5">💳</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-orange-800">Pago pendiente</p>
                            <p className="text-xs text-orange-600 mt-0.5">
                                {pendingInvoice
                                    ? <>Monto: <span className="font-bold">${new Intl.NumberFormat('es-CO').format(pendingInvoice.total_amount)} COP</span> · Ref: <span className="font-mono font-bold">{pendingInvoice.reference ?? '...'}</span></>
                                    : 'Tu cita se confirmará al completar el pago'}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                            {isPastAppointment ? (
                                <button
                                    disabled
                                    className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-200 text-gray-500 shadow-sm cursor-not-allowed"
                                    title="La fecha de la cita ya pasó"
                                >
                                    🚫 Cita expirada
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowPayModal(true)}
                                    disabled={!pendingInvoice}
                                    className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    💳 Pagar ahora
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Pay Modal ───────────────────────────────────────── */}
                    {showPayModal && pendingInvoice && !isPastAppointment && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowPayModal(false)}>
                            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
                                <div className="text-center space-y-1">
                                    <div className="text-3xl">💳</div>
                                    <h3 className="text-lg font-extrabold text-gray-900">Pago de consulta</h3>
                                    <p className="text-sm text-gray-500">${new Intl.NumberFormat('es-CO').format(pendingInvoice.total_amount)} COP</p>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center space-y-2">
                                    <p className="text-xs text-amber-700 font-semibold">Tu referencia de pago es:</p>
                                    <p className="text-2xl font-mono font-extrabold text-amber-900 tracking-widest">{pendingInvoice.reference}</p>
                                    <p className="text-xs text-amber-600">⚠️ Copia este código y pégalo en Bold cuando pagues.</p>
                                </div>

                                <button
                                    onClick={handleCopyRef}
                                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                                        copied ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {copied ? '✅ ¡Copiado!' : '📋 Copiar referencia'}
                                </button>

                                <button
                                    onClick={handleGoToBold}
                                    disabled={paymentLoading}
                                    className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {paymentLoading ? (
                                        <>
                                            <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
                                            Generando enlace...
                                        </>
                                    ) : (
                                        'Ir a pagar →'
                                    )}
                                </button>

                                <button disabled={paymentLoading} onClick={() => setShowPayModal(false)} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 disabled:opacity-50 mt-2">Cancelar</button>
                            </div>
                        </div>
                    )}

                </>
            )}


            {/* ── PENDING_PAYMENT Banner (vet/staff view) ─────────────────── */}
            {isPendingPayment && !isDueno && (
                <div className="rounded-xl border-2 border-red-200 bg-red-50/80 px-3 py-3 flex items-center gap-3">
                    <span className="text-xl">🔒</span>
                    <div>
                        <p className="text-sm font-bold text-red-700">Bloqueado: Esperando pago del cliente</p>
                        <p className="text-xs font-semibold text-red-600 mt-0.5">Las acciones médicas y la sesión no pueden iniciarse aún.</p>
                    </div>
                </div>
            )}

            {/* ── Live Panel State (Dynamic contextual state per type) ────── */}
            <div className={`rounded-xl overflow-hidden border ${config.panelWrap} shadow-sm transition-colors duration-200`}>
                <div className={`flex items-center justify-between px-3 py-2.5 border-b ${config.panelHeaderBg}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${panelDynamicDot}`} />
                        <span className="text-xs font-semibold text-gray-700">
                            {config.panelTitle}
                        </span>
                    </div>
                    {isTelemedicina && sessionLoading ? (
                        <span className="text-[10px] text-gray-400 animate-pulse">Verificando...</span>
                    ) : (
                        <span className={`text-xs font-bold ${panelDynamicColor}`}>
                            {panelDynamicLabel}
                        </span>
                    )}
                </div>
                <div className="px-3 py-2">
                    {panelHintNode}
                </div>
            </div>

            {/* ── Reason / Notes ──────────────────────────────────────────── */}
            {appointment.reason && (
                <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">
                    &ldquo;{appointment.reason}&rdquo;
                </p>
            )}

            {/* ── Action: Telemed specific button ─────────────────────────── */}
            {isTelemedicina && scheduledDateObj && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && telemedSession?.status !== 'COMPLETED' && telemedSession?.status !== 'CANCELLED' && (
                <TelemedButton
                    appointmentId={appointment.id}
                    scheduledAt={scheduledDateObj.toISOString()}
                    rawStatus={appointment.status}
                    userRole={user?.role}
                    now={now}
                    sessionFromParent={telemedSession}
                    onSessionUpdate={setTelemedSession}
                />
            )}

            {/* ── Lower Footer: Standard Actions ──────────────────────────── */}
            <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                <div className="flex gap-2">
                    <Link
                        href={`/appointments/${appointment.id}`}
                        className="flex-1 text-center text-xs font-semibold text-petwell-blue hover:text-petwell-navy transition-colors py-2 rounded-lg bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100"
                    >
                        Ver detalle
                    </Link>
                    
                    {/* Botones de cambio de estado (para el Vet) */}
                    {onStatusChange && (appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
                        <>
                            <button
                                onClick={() => onStatusChange(appointment.id, 'COMPLETED')}
                                className="flex-1 text-center text-xs font-semibold text-green-600 hover:text-green-700 transition-colors py-2 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200"
                                title="Marcar como COMPLETADA"
                            >
                                ✅ Completar
                            </button>
                            <button
                                onClick={() => onStatusChange(appointment.id, 'NO_SHOW')}
                                className="flex-1 text-center text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors py-2 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200"
                                title="Paciente no asistió"
                            >
                                ⚠️ No asistió
                            </button>
                        </>
                    )}

                    {canCancel && (
                        <button
                            onClick={() => onCancel!(appointment.id)}
                            className="flex-1 text-center text-xs font-semibold text-red-500 hover:text-red-700 transition-colors py-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
                        >
                            Cancelar
                        </button>
                    )}
                </div>

                {/* Accesos rápidos de Historia Clínica (Solo VET) */}
                {canRegisterEhr && (
                    <div className="flex mt-1">
                        {appointment.reason_type === 'VACUNACION' ? (
                            <Link
                                href={`/pets/${appointment.pet_id}/vaccinations`}
                                className="w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                            >
                                💉 Registrar vacuna
                            </Link>
                        ) : (
                            <Link
                                href={`/pets/${appointment.pet_id}/ehr/add`}
                                className="w-full text-center bg-petwell-teal/10 hover:bg-petwell-teal/20 text-petwell-teal border border-petwell-teal/20 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                            >
                                🩺 Registrar historia clínica
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
