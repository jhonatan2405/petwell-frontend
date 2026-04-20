'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { verifyAccount, resendVerificationCode } from '@/services/authService';
import { useAuthContext } from '@/context/AuthContext';
import Alert from '@/components/ui/Alert';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function VerifyAccountPage() {
    const router = useRouter();
    const { login } = useAuthContext();
    const searchParams = useSearchParams();
    const emailFromQuery = searchParams.get('email') ?? '';

    // ── State ──────────────────────────────────────────────────────────────────
    const [email, setEmail] = useState(emailFromQuery);
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [infoMsg, setInfoMsg] = useState<string | null>(null);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const cooldownRef = useRef<NodeJS.Timeout | null>(null);

    // Focus first digit on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // Countdown timer
    const startCooldown = useCallback(() => {
        setCooldown(RESEND_COOLDOWN);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

    // ── OTP digit handlers ─────────────────────────────────────────────────────
    const handleDigitChange = (index: number, value: string) => {
        // Accept only numbers; handle paste of full code
        const clean = value.replace(/\D/g, '');

        if (clean.length > 1) {
            // Paste scenario – distribute across remaining boxes
            const chars = clean.slice(0, CODE_LENGTH - index).split('');
            const next = [...digits];
            chars.forEach((ch, i) => { next[index + i] = ch; });
            setDigits(next);
            const focusIdx = Math.min(index + chars.length, CODE_LENGTH - 1);
            inputRefs.current[focusIdx]?.focus();
            return;
        }

        const next = [...digits];
        next[index] = clean;
        setDigits(next);
        if (clean && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    };

    const fullCode = digits.join('');
    const isCodeComplete = fullCode.length === CODE_LENGTH;

    // ── Submit verification ────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError(null);
        setSuccessMsg(null);

        if (!email.trim()) {
            setServerError('Ingresa tu correo electrónico.');
            return;
        }
        if (!isCodeComplete) {
            setServerError('Por favor ingresa el código completo de 6 dígitos.');
            return;
        }

        setLoading(true);
        try {
            const res = await verifyAccount(email.trim(), fullCode);
            if (res.success && res.data?.token && res.data?.user) {
                // Auto-login!
                login(res.data.token, res.data.user);
                setSuccessMsg('¡Cuenta verificada exitosamente! Entrando...');
                setTimeout(() => router.push('/dashboard'), 2000);
            } else if (res.success) {
                // Fallback (old backend behavior)
                setSuccessMsg('¡Cuenta verificada exitosamente! Redirigiendo...');
                setTimeout(() => router.push('/auth'), 2000);
            } else {
                setServerError(res.message || 'Código inválido.');
            }
        } catch (err: any) {
            setServerError(err.message || 'Código inválido. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // ── Resend code ───────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (cooldown > 0 || resendLoading) return;
        setServerError(null);
        setInfoMsg(null);

        if (!email.trim()) {
            setServerError('Ingresa tu correo para reenviar el código.');
            return;
        }

        setResendLoading(true);
        try {
            await resendVerificationCode(email.trim());
            setInfoMsg('Código enviado al correo. Revisa tu bandeja de entrada.');
            setDigits(Array(CODE_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
            startCooldown();
        } catch (err: any) {
            setServerError(err.message || 'No se pudo reenviar el código.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF7F0] via-white to-[#FFF3E6] flex items-center justify-center px-4 py-12">

            {/* Decorative blobs */}
            <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#F86F03]/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-[440px] h-[440px] rounded-full bg-[#FFA41B]/10 blur-3xl" />
            </div>

            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 shadow-lg"
                        style={{ background: 'linear-gradient(-45deg, #F86F03 0%, #FFA41B 100%)' }}>
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-petwell-navy">Verificación de cuenta</h1>
                    <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto">
                        Ingresa el código de 6 dígitos que enviamos a tu correo electrónico.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl p-8">

                    {/* Alerts */}
                    {serverError && (
                        <div className="mb-5">
                            <Alert type="error" message={serverError} onClose={() => setServerError(null)} />
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-5">
                            <Alert type="success" message={successMsg} />
                        </div>
                    )}
                    {infoMsg && !serverError && (
                        <div className="mb-5">
                            <Alert type="info" message={infoMsg} onClose={() => setInfoMsg(null)} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Email field (editable in case they arrive without query param) */}
                        {!emailFromQuery && (
                            <div className="mb-5">
                                <label htmlFor="verify-email" className="block text-sm font-semibold text-petwell-navy mb-1.5">
                                    Correo electrónico
                                </label>
                                <input
                                    id="verify-email"
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#F86F03]/30 focus:border-[#F86F03] transition-all"
                                />
                            </div>
                        )}
                        {emailFromQuery && (
                            <p className="text-center text-sm text-gray-500 mb-6">
                                Enviado a: <span className="font-semibold text-petwell-navy">{emailFromQuery}</span>
                            </p>
                        )}

                        {/* 6-digit OTP input */}
                        <div className="flex gap-3 justify-center mb-7">
                            {digits.map((d, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={d}
                                    onChange={(e) => handleDigitChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    onFocus={(e) => e.target.select()}
                                    disabled={!!successMsg}
                                    className={`
                                        w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none
                                        transition-all duration-200 caret-transparent
                                        ${d ? 'border-[#F86F03] bg-[#FFF7F0] text-petwell-navy shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-400'}
                                        focus:border-[#F86F03] focus:bg-[#FFF7F0] focus:ring-2 focus:ring-[#F86F03]/20
                                        disabled:opacity-50
                                    `}
                                    aria-label={`Dígito ${i + 1}`}
                                />
                            ))}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading || !isCodeComplete || !!successMsg}
                            className={`
                                w-full h-12 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all duration-200
                                ${isCodeComplete && !loading && !successMsg
                                    ? 'shadow-md hover:shadow-lg hover:opacity-90 active:scale-[0.98] cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed'
                                }
                            `}
                            style={{ background: 'linear-gradient(-45deg, #F86F03 0%, #FFA41B 100%)' }}
                        >
                            {loading && (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {loading ? 'Verificando...' : 'Verificar cuenta'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-400 font-medium">¿No recibiste el código?</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Resend button */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={cooldown > 0 || resendLoading || !!successMsg}
                            className={`
                                text-sm font-semibold transition-all duration-200 px-5 py-2.5 rounded-xl border-2
                                ${cooldown > 0 || resendLoading || !!successMsg
                                    ? 'text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                                    : 'text-[#F86F03] border-[#F86F03] hover:bg-[#F86F03]/5 cursor-pointer'
                                }
                            `}
                        >
                            {resendLoading
                                ? 'Enviando...'
                                : cooldown > 0
                                    ? `Reenviar código (${cooldown}s)`
                                    : 'Reenviar código'
                            }
                        </button>
                    </div>
                </div>

                {/* Back link */}
                <p className="text-center text-sm text-gray-400 mt-6">
                    ¿Ya tienes cuenta?{' '}
                    <button
                        type="button"
                        onClick={() => router.push('/auth')}
                        className="font-semibold text-[#F86F03] hover:underline"
                    >
                        Iniciar sesión
                    </button>
                </p>
            </div>
        </div>
    );
}
