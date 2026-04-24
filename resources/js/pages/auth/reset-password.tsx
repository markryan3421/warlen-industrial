import { Form, Head } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';

type Props = {
    token: string;
    email: string;
};

const INTER = "'Inter', sans-serif";
const ACCENT_COLOR = '#CC570D';
const STEEL_BLUE = '#093B92';
const CARD_BG = '#fefaf5';
const BODY_BG = '#f1ede8';
const BORDER_LIGHT = '#e2dbd1';
const TEXT_DARK = '#2c2b28';
const TEXT_MUTED = '#6b6258';

function OutlinedField({ id, label, icon, children }: any) {
    return (
        <div style={{ position: 'relative', marginTop: '6px' }}>
            <label
                htmlFor={id}
                style={{
                    fontFamily: INTER,
                    position: 'absolute',
                    top: '-9px',
                    left: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: TEXT_MUTED,
                    background: CARD_BG,
                    padding: '0 6px',
                    zIndex: 10,
                    borderRadius: '4px',
                }}
            >
                {label}
            </label>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: `1.5px solid ${BORDER_LIGHT}`,
                    borderRadius: '10px',
                    background: CARD_BG,
                    padding: '0 14px',
                    height: '54px',
                    transition: 'border-color 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT_COLOR)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER_LIGHT)}
            >
                <span style={{ color: TEXT_MUTED, marginRight: '12px' }}>{icon}</span>
                {children}
            </div>
        </div>
    );
}

export default function ResetPassword({ token, email }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <>
            <Head title="Reset Password | DEKA Payroll" />
            <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus,
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px ${CARD_BG} inset !important;
                    -webkit-text-fill-color: ${TEXT_DARK} !important;
                    caret-color: ${TEXT_DARK} !important;
                    transition: background-color 5000s ease-in-out 0s;
                }
            `}</style>
            <div
                style={{
                    minHeight: '100vh',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: BODY_BG,
                    padding: '2rem',
                }}
            >
                <div style={{ width: '100%', maxWidth: '460px' }}>
                    {/* Logo centered above the card */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <img src="/images/dekalogo.png" style={{ width: '64px', height: '64px', objectFit: 'contain', opacity: 0.9 }} alt="DEKA" />
                    </div>

                    <div style={{ background: CARD_BG, borderRadius: '28px', boxShadow: '0 20px 35px -10px rgba(0,0,0,0.08)', padding: '2rem', border: `1px solid ${BORDER_LIGHT}` }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
                            <div style={{ width: '48px', height: '3px', background: `linear-gradient(90deg, ${ACCENT_COLOR}, ${STEEL_BLUE})`, margin: '0 auto 1rem auto', borderRadius: '4px' }} />
                            <h2 style={{ fontFamily: INTER, fontWeight: 700, fontSize: '1.6rem', letterSpacing: '0.2em', color: TEXT_DARK, margin: 0 }}>
                                RESET PASSWORD
                            </h2>
                            <p style={{ fontSize: '0.75rem', color: TEXT_MUTED, marginTop: '6px' }}>
                                Please enter your new password below
                            </p>
                        </div>

                        <Form
                            {...update.form()}
                            transform={(data) => ({ ...data, token, email })}
                            resetOnSuccess={['password', 'password_confirmation']}
                            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                        >
                            {({ processing, errors }) => (
                                <>
                                    {/* Email field (readonly) */}
                                    <div>
                                        <OutlinedField id="email" label="Email Address" icon={<Mail size={18} />}>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={email}
                                                readOnly
                                                style={{
                                                    fontFamily: INTER,
                                                    flex: 1,
                                                    background: 'transparent',
                                                    border: 'none',
                                                    outline: 'none',
                                                    fontSize: '0.9rem',
                                                    color: TEXT_DARK,
                                                    padding: '12px 0',
                                                }}
                                            />
                                        </OutlinedField>
                                        {errors?.email && <InputError message={errors.email} className="text-xs mt-1" />}
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <OutlinedField id="password" label="New Password" icon={<Lock size={18} />}>
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••••••••••"
                                                required
                                                autoFocus
                                                autoComplete="new-password"
                                                style={{
                                                    fontFamily: INTER,
                                                    flex: 1,
                                                    background: 'transparent',
                                                    border: 'none',
                                                    outline: 'none',
                                                    fontSize: '0.9rem',
                                                    color: TEXT_DARK,
                                                    padding: '12px 0',
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: TEXT_MUTED,
                                                    marginLeft: '8px',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = ACCENT_COLOR)}
                                                onMouseLeave={e => (e.currentTarget.style.color = TEXT_MUTED)}
                                            >
                                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>
                                        </OutlinedField>
                                        {errors?.password && <InputError message={errors.password} className="text-xs mt-1" />}
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <OutlinedField id="password_confirmation" label="Confirm Password" icon={<Lock size={18} />}>
                                            <input
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="••••••••••••••••"
                                                required
                                                autoComplete="new-password"
                                                style={{
                                                    fontFamily: INTER,
                                                    flex: 1,
                                                    background: 'transparent',
                                                    border: 'none',
                                                    outline: 'none',
                                                    fontSize: '0.9rem',
                                                    color: TEXT_DARK,
                                                    padding: '12px 0',
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: TEXT_MUTED,
                                                    marginLeft: '8px',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = ACCENT_COLOR)}
                                                onMouseLeave={e => (e.currentTarget.style.color = TEXT_MUTED)}
                                            >
                                                {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>
                                        </OutlinedField>
                                        {errors?.password_confirmation && <InputError message={errors.password_confirmation} className="text-xs mt-1" />}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        style={{
                                            fontFamily: INTER,
                                            fontWeight: 600,
                                            fontSize: '0.95rem',
                                            letterSpacing: '0.5px',
                                            color: '#fff',
                                            background: STEEL_BLUE,
                                            border: 'none',
                                            borderRadius: '40px',
                                            width: '100%',
                                            height: '52px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                            transition: 'transform 0.15s ease, filter 0.2s ease',
                                            marginTop: '8px',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.05)')}
                                        onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
                                        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                                        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        {processing && <Spinner className="h-4 w-4" style={{ borderColor: '#fff' }} />}
                                        Update Password
                                    </button>
                                </>
                            )}
                        </Form>

                        {/* Removed the bottom text line entirely */}
                    </div>
                </div>
            </div>
        </>
    );
}