import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { login } from '@/routes';
import { email } from '@/routes/password';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';

const INTER = "'Inter', sans-serif";
const CARD_BG = '#e4e7ef';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <div
            style={{
                fontFamily: INTER,
                position: 'relative',
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <Head title="Forgot password" />

            {/* Background */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'url(/images/bgdeka.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            {/* Dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,10,22,0.65)' }} />

            {/* DEKA logo */}
            <div style={{ position: 'absolute', top: '20px', left: '24px', zIndex: 20 }}>
                <img
                    src="/images/dekalogo.png"
                    alt="DEKA Logo"
                    style={{
                        width: '64px',
                        height: '64px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                    }}
                />
            </div>

            {/* Centered content */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '100px 24px 60px',
                    boxSizing: 'border-box',
                }}
            >
                {/* Brand header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <h1
                        style={{
                            fontFamily: INTER,
                            fontWeight: 800,
                            fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
                            margin: '0 0 6px',
                            lineHeight: 1.2,
                        }}
                    >
                        <span style={{ color: '#3b82f6' }}>Warlen Industiral Sales Corporation </span>
                        <span style={{ color: '#f97316' }}>DEKA Sales</span>
                    </h1>
                    <p
                        style={{
                            fontFamily: INTER,
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            color: '#ffffff',
                            margin: 0,
                        }}
                    >
                        Payroll Management System
                    </p>
                </div>

                {/* Card */}
                <div
                    style={{
                        background: CARD_BG,
                        borderRadius: '16px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        padding: '44px 44px 36px',
                        width: '100%',
                        maxWidth: '440px',
                        boxSizing: 'border-box',
                    }}
                >
                    {/* Card heading */}
                    <h2
                        style={{
                            fontFamily: INTER,
                            fontWeight: 900,
                            fontSize: '1.5rem',
                            color: '#111827',
                            textAlign: 'center',
                            letterSpacing: '0.06em',
                            margin: '0 0 8px',
                        }}
                    >
                        Forgot Password?
                    </h2>

                    <p
                        style={{
                            fontFamily: INTER,
                            fontSize: '0.84rem',
                            color: '#6b7280',
                            textAlign: 'center',
                            margin: '0 0 28px',
                            lineHeight: 1.6,
                        }}
                    >
                        Enter your email address and we'll send you a link
                        <br />to reset your password.
                    </p>

                    {/* Status message */}
                    {status && (
                        <div
                            style={{
                                fontFamily: INTER,
                                fontSize: '0.85rem',
                                color: '#16a34a',
                                fontWeight: 600,
                                textAlign: 'center',
                                marginBottom: '16px',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px',
                                padding: '10px 14px',
                            }}
                        >
                            {status}
                        </div>
                    )}

                    <Form
                        {...email.form()}
                        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        {({ processing, errors }) => (
                            <>
                                {/* Email field */}
                                <div style={{ position: 'relative', marginTop: '6px' }}>
                                    <label
                                        htmlFor="email"
                                        style={{
                                            fontFamily: INTER,
                                            position: 'absolute',
                                            top: '-9px',
                                            left: '12px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#374151',
                                            background: CARD_BG,
                                            padding: '0 4px',
                                            lineHeight: 1,
                                            zIndex: 10,
                                        }}
                                    >
                                        Email address
                                    </label>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            border: '1.5px solid #9ca3af',
                                            borderRadius: '6px',
                                            background: CARD_BG,
                                            padding: '0 12px',
                                            height: '52px',
                                        }}
                                    >
                                        <Mail
                                            size={17}
                                            style={{ color: '#6b7280', marginRight: '10px', flexShrink: 0 }}
                                        />
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="off"
                                            autoFocus
                                            placeholder="email@example.com"
                                            style={{
                                                fontFamily: INTER,
                                                flex: 1,
                                                background: 'transparent',
                                                border: 'none',
                                                outline: 'none',
                                                fontSize: '0.88rem',
                                                color: '#1f2937',
                                            }}
                                        />
                                    </div>
                                    {errors?.email && (
                                        <InputError message={errors.email} className="text-xs mt-1" />
                                    )}
                                </div>

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                    style={{
                                        fontFamily: INTER,
                                        fontWeight: 800,
                                        fontSize: '0.95rem',
                                        color: '#ffffff',
                                        background: '#1e3fa3',
                                        border: 'none',
                                        borderRadius: '8px',
                                        width: '100%',
                                        height: '52px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 14px rgba(30,63,163,0.4)',
                                        transition: 'filter 0.15s, transform 0.1s',
                                        marginTop: '4px',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.12)')}
                                    onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
                                    onMouseDown={e => (e.currentTarget.style.transform = 'translateY(1px)')}
                                    onMouseUp={e => (e.currentTarget.style.transform = 'translateY(0)')}
                                >
                                    {processing && (
                                        <LoaderCircle
                                            size={16}
                                            style={{ animation: 'spin 1s linear infinite' }}
                                        />
                                    )}
                                    Email password reset link
                                </button>

                                {/* Back to login */}
                                <p
                                    style={{
                                        fontFamily: INTER,
                                        textAlign: 'center',
                                        fontSize: '0.85rem',
                                        color: '#6b7280',
                                        margin: 0,
                                    }}
                                >
                                    Or, return to{' '}
                                    <TextLink
                                        href={login()}
                                        style={{
                                            fontFamily: INTER,
                                            color: '#2563eb',
                                            fontWeight: 600,
                                            textDecoration: 'underline',
                                        }}
                                    >
                                        log in
                                    </TextLink>
                                </p>
                            </>
                        )}
                    </Form>
                </div>
            </div>

            {/* Copyright */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    padding: '0 80px 24px',
                    fontFamily: INTER,
                    fontSize: '0.78rem',
                    color: '#9ca3af',
                }}
            >
                © 2026 Warlen Industrial Sales Corporation, DEKA Sales. All rights reserved.
            </div>

            {/* Spin keyframes for the loader */}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}