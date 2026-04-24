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

// ----- Dirty white theme constants (matching login & 2FA) -----
const INTER = "'Inter', sans-serif";
const ACCENT_COLOR = '#CC570D';
const STEEL_BLUE = '#093B92';
const CARD_BG = '#fefaf5';
const BODY_BG = '#f1ede8';
const BORDER_LIGHT = '#e2dbd1';
const TEXT_DARK = '#2c2b28';
const TEXT_MUTED = '#6b6258';
const INPUT_BORDER = '#d6cec3';
const INPUT_FOCUS_BORDER = ACCENT_COLOR;

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot password" />
            <style>{`
                /* Prevent autofill background color change */
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus,
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #fff inset !important;
                    -webkit-text-fill-color: ${TEXT_DARK} !important;
                    caret-color: ${TEXT_DARK} !important;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div
                style={{
                    fontFamily: INTER,
                    minHeight: '100vh',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: BODY_BG,
                    padding: '1rem',
                }}
            >
                {/* Centered container for logo + card */}
                <div style={{ width: '100%', maxWidth: '460px' }}>
                    {/* Logo centered above the card */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <img
                            src="/images/dekalatestlogo.webp"
                            alt="DEKA Sales"
                            style={{
                                width: '100px',
                                height: '100px',
                                objectFit: 'contain',
                                margin: '0 auto',
                            }}
                        />
                    </div>

                    {/* Card */}
                    <div
                        style={{
                            background: CARD_BG,
                            borderRadius: '28px',
                            boxShadow: '0 20px 35px -10px rgba(0,0,0,0.08)',
                            padding: '2rem',
                            border: `1px solid ${BORDER_LIGHT}`,
                        }}
                    >
                        {/* Card heading */}
                        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
                            <div
                                style={{
                                    width: '48px',
                                    height: '3px',
                                    background: `linear-gradient(90deg, ${ACCENT_COLOR}, ${STEEL_BLUE})`,
                                    margin: '0 auto 1rem auto',
                                    borderRadius: '4px',
                                }}
                            />
                            <h2
                                style={{
                                    fontFamily: INTER,
                                    fontWeight: 700,
                                    fontSize: '1.6rem',
                                    letterSpacing: '0.2em',
                                    color: TEXT_DARK,
                                    margin: 0,
                                }}
                            >
                                Forgot Password?
                            </h2>
                            <p
                                style={{
                                    fontSize: '0.75rem',
                                    color: TEXT_MUTED,
                                    marginTop: '6px',
                                }}
                            >
                                Enter your email address and we'll send you a link
                                <br />to reset your password.
                            </p>
                        </div>

                        {/* Status message */}
                        {status && (
                            <div
                                style={{
                                    fontSize: '0.8rem',
                                    color: '#10b981',
                                    textAlign: 'center',
                                    marginBottom: '20px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    padding: '8px',
                                    borderRadius: '12px',
                                }}
                            >
                                {status}
                            </div>
                        )}

                        <Form
                            {...email.form()}
                            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                        >
                            {({ processing, errors }) => (
                                <>
                                    {/* Email field */}
                                    <div>
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
                                                    color: TEXT_MUTED,
                                                    background: CARD_BG,
                                                    padding: '0 6px',
                                                    zIndex: 10,
                                                    borderRadius: '4px',
                                                }}
                                            >
                                                Email address
                                            </label>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    border: `1.5px solid ${INPUT_BORDER}`,
                                                    borderRadius: '10px',
                                                    background: CARD_BG,
                                                    padding: '0 14px',
                                                    height: '54px',
                                                    transition: 'border-color 0.2s ease',
                                                }}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.borderColor = INPUT_FOCUS_BORDER)
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.borderColor = INPUT_BORDER)
                                                }
                                            >
                                                <Mail
                                                    size={18}
                                                    style={{ color: TEXT_MUTED, marginRight: '12px' }}
                                                />
                                                <input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    autoComplete="off"
                                                    autoFocus
                                                    placeholder="operations@warlen.com"
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
                                            </div>
                                        </div>
                                        {errors?.email && (
                                            <InputError message={errors.email} className="text-xs mt-1" />
                                        )}
                                    </div>

                                    {/* Submit button */}
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
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.filter = 'brightness(1.05)')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.filter = 'brightness(1)')
                                        }
                                        onMouseDown={(e) =>
                                            (e.currentTarget.style.transform = 'scale(0.97)')
                                        }
                                        onMouseUp={(e) =>
                                            (e.currentTarget.style.transform = 'scale(1)')
                                        }
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
                                            textAlign: 'center',
                                            fontSize: '0.8rem',
                                            color: TEXT_MUTED,
                                            margin: 0,
                                        }}
                                    >
                                        Or, return to{' '}
                                        <TextLink
                                            href={login()}
                                            style={{
                                                fontFamily: INTER,
                                                color: STEEL_BLUE,
                                                fontWeight: 500,
                                                textDecoration: 'none',
                                                borderBottom: `1px solid ${STEEL_BLUE}80`,
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.color = ACCENT_COLOR)
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.color = STEEL_BLUE)
                                            }
                                        >
                                            log in
                                        </TextLink>
                                    </p>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
}