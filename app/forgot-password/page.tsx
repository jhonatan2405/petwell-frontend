'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { forgotPassword, resetPassword } from '@/services/authService';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const CODE_LENGTH = 6;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<'email' | 'reset'>('email');

    // Step 1
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    // Step 2
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Common
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // ── Step 1: send reset email ───────────────────────────────────────────────
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email.trim()) { setEmailError('El correo es obligatorio.'); return; }
        if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Ingresa un correo válido.'); return; }
        setEmailError('');
        setLoading(true);
        try {
            await forgotPassword(email.trim());
            setStep('reset');
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch (err: any) {
            setError(err.message || 'No se pudo enviar el código.');
        } finally {
            setLoading(false);
        }
    };

    // ── OTP digit handlers ─────────────────────────────────────────────────────
    const handleDigitChange = (index: number, value: string) => {
        const clean = value.replace(/\D/g, '');
        if (clean.length > 1) {
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
        if (clean && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    };

    const fullCode = digits.join('');

    // ── Step 2: verify code + new password ────────────────────────────────────
    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPasswordError('');

        if (fullCode.length < CODE_LENGTH) { setError('Ingresa el código completo de 6 dígitos.'); return; }
        if (!newPassword.trim() || newPassword.length < 6) { setPasswordError('Mínimo 6 caracteres.'); return; }
        if (newPassword !== confirmPassword) { setPasswordError('Las contraseñas no coinciden.'); return; }

        setLoading(true);
        try {
            await resetPassword(email.trim(), fullCode, newPassword);
            setSuccess(true);
            setTimeout(() => router.push('/auth'), 3000);
        } catch (err: any) {
            setError(err.message || 'Código inválido o expirado.');
        } finally {
            setLoading(false);
        }
    };

    // ── UI ────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-petwell-light/30">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-petwell-blue rounded-2xl shadow-lg mb-5">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-petwell-navy">
                        {step === 'email' ? '¿Olvidaste tu contraseña?' : 'Restablecer contraseña'}
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto">
                        {step === 'email'
                            ? 'Ingresa tu correo y te enviaremos un código de 6 dígitos.'
                            : `Ingresa el código enviado a ${email} y tu nueva contraseña.`
                        }
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-8">

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${step === 'email' || step === 'reset' ? 'bg-petwell-blue' : 'bg-gray-200'}`} />
                        <div className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${step === 'reset' ? 'bg-petwell-teal' : 'bg-gray-200'}`} />
                    </div>

                    {error && (
                        <div className="mb-5">
                            <Alert type="error" message={error} onClose={() => setError(null)} />
                        </div>
                    )}

                    {/* ── ÉXITO ── */}
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-petwell-navy mb-2">¡Contraseña actualizada!</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Tu contraseña fue restablecida exitosamente. Redirigiendo al inicio de sesión...
                            </p>
                        </div>

                    ) : step === 'email' ? (
                        /* ── PASO 1: Email ── */
                        <form onSubmit={handleSendCode} noValidate className="space-y-5">
                            <Input
                                id="forgot-email"
                                label="Correo electrónico"
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={email}
                                onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                                error={emailError}
                                autoComplete="email"
                                autoFocus
                                icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                }
                            />
                            <Button type="submit" fullWidth size="lg" loading={loading} disabled={loading}>
                                {loading ? 'Enviando código...' : 'Enviar código de recuperación'}
                            </Button>
                        </form>

                    ) : (
                        /* ── PASO 2: Código + nueva contraseña ── */
                        <form onSubmit={handleReset} noValidate className="space-y-5">
                            {/* OTP boxes */}
                            <div>
                                <label className="block text-sm font-semibold text-petwell-navy mb-3 text-center">
                                    Código de verificación
                                </label>
                                <div className="flex gap-2 justify-center mb-1">
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
                                            className={`
                                                w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none
                                                transition-all duration-200 caret-transparent py-2
                                                ${d ? 'border-petwell-blue bg-blue-50 text-petwell-navy' : 'border-gray-200 bg-gray-50 text-gray-400'}
                                                focus:border-petwell-blue focus:bg-blue-50 focus:ring-2 focus:ring-petwell-blue/20
                                            `}
                                            aria-label={`Dígito ${i + 1}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-2">
                                    El código expira en 10 minutos
                                </p>
                            </div>

                            <Input
                                id="new-password"
                                label="Nueva contraseña"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={newPassword}
                                onChange={e => { setNewPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                                error={passwordError}
                                autoComplete="new-password"
                            />
                            <Input
                                id="confirm-password"
                                label="Confirmar contraseña"
                                type="password"
                                placeholder="Repite tu nueva contraseña"
                                value={confirmPassword}
                                onChange={e => { setConfirmPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                                autoComplete="new-password"
                            />

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                loading={loading}
                                disabled={loading || fullCode.length < CODE_LENGTH}
                            >
                                {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => { setStep('email'); setDigits(Array(CODE_LENGTH).fill('')); setError(null); }}
                                className="w-full text-sm text-petwell-blue hover:text-petwell-teal transition-colors font-medium text-center"
                            >
                                ← Cambiar correo electrónico
                            </button>
                        </form>
                    )}

                    {!success && (
                        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                            <button
                                type="button"
                                onClick={() => router.push('/auth')}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-petwell-blue hover:text-petwell-teal transition-colors duration-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Volver al inicio de sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
