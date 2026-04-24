import { Form, Head } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { store } from '@/routes/two-factor/login';

// ----- Dirty white theme constants -----
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

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Recovery Code',
                description:
                    'Please confirm access to your account by entering one of your emergency recovery codes.',
                toggleText: 'login using an authentication code',
            };
        }

        return {
            title: 'Authentication Code',
            description:
                    'Enter the authentication code provided by your authenticator application.',
            toggleText: 'login using a recovery code',
        };
    }, [showRecoveryInput]);

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <>
            <Head title="Two-Factor Authentication" />
            <style>{`
                /* Override any default OTP input styles to match dirty white theme */
                .input-otp-slot {
                    border-color: ${INPUT_BORDER} !important;
                    background-color: #fff !important;
                    color: ${TEXT_DARK} !important;
                    font-family: ${INTER} !important;
                    font-size: 1.25rem !important;
                    transition: border-color 0.2s ease;
                }
                .input-otp-slot:focus-within {
                    border-color: ${INPUT_FOCUS_BORDER} !important;
                }
                .input-otp-slot[data-active="true"] {
                    border-color: ${ACCENT_COLOR} !important;
                }
                /* Keep autofill styling consistent */
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus,
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #fff inset !important;
                    -webkit-text-fill-color: ${TEXT_DARK} !important;
                    caret-color: ${TEXT_DARK} !important;
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
                    fontFamily: INTER,
                    padding: '1rem',
                }}
            >
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

                    {/* Card container */}
                    <div
                        style={{
                            background: CARD_BG,
                            borderRadius: '28px',
                            boxShadow: '0 20px 35px -10px rgba(0,0,0,0.08)',
                            padding: '2rem',
                            border: `1px solid ${BORDER_LIGHT}`,
                        }}
                    >
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
                                {authConfigContent.title}
                            </h2>
                            <p
                                style={{
                                    fontSize: '0.75rem',
                                    color: TEXT_MUTED,
                                    marginTop: '6px',
                                }}
                            >
                                {authConfigContent.description}
                            </p>
                        </div>

                        <Form
                            {...store.form()}
                            className="space-y-4"
                            resetOnError
                            resetOnSuccess={!showRecoveryInput}
                            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                        >
                            {({ errors, processing, clearErrors }) => (
                                <>
                                    {showRecoveryInput ? (
                                        <div>
                                            <input
                                                name="recovery_code"
                                                type="text"
                                                placeholder="Enter recovery code"
                                                autoFocus={showRecoveryInput}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px',
                                                    fontSize: '0.9rem',
                                                    fontFamily: INTER,
                                                    backgroundColor: '#fff',
                                                    border: `1.5px solid ${INPUT_BORDER}`,
                                                    borderRadius: '12px',
                                                    outline: 'none',
                                                    color: TEXT_DARK,
                                                    transition: 'border-color 0.2s ease',
                                                }}
                                                onFocus={(e) =>
                                                    (e.target.style.borderColor = INPUT_FOCUS_BORDER)
                                                }
                                                onBlur={(e) =>
                                                    (e.target.style.borderColor = INPUT_BORDER)
                                                }
                                            />
                                            {errors.recovery_code && (
                                                <InputError
                                                    message={errors.recovery_code}
                                                    className="mt-1"
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '12px',
                                            }}
                                        >
                                            <InputOTP
                                                name="code"
                                                maxLength={OTP_MAX_LENGTH}
                                                value={code}
                                                onChange={(value) => setCode(value)}
                                                disabled={processing}
                                                pattern={REGEXP_ONLY_DIGITS}
                                                containerClassName="justify-center"
                                            >
                                                <InputOTPGroup>
                                                    {Array.from(
                                                        { length: OTP_MAX_LENGTH },
                                                        (_, index) => (
                                                            <InputOTPSlot
                                                                key={index}
                                                                index={index}
                                                                className="input-otp-slot"
                                                            />
                                                        ),
                                                    )}
                                                </InputOTPGroup>
                                            </InputOTP>
                                            {errors.code && (
                                                <InputError message={errors.code} />
                                            )}
                                        </div>
                                    )}

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
                                        Continue
                                    </button>

                                    <div
                                        style={{
                                            textAlign: 'center',
                                            fontSize: '0.8rem',
                                            color: TEXT_MUTED,
                                        }}
                                    >
                                        <span>or you can </span>
                                        <button
                                            type="button"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: STEEL_BLUE,
                                                fontWeight: 500,
                                                textDecoration: 'none',
                                                borderBottom: `1px solid ${STEEL_BLUE}80`,
                                                padding: 0,
                                                font: 'inherit',
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.color = ACCENT_COLOR)
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.color = STEEL_BLUE)
                                            }
                                            onClick={() =>
                                                toggleRecoveryMode(clearErrors)
                                            }
                                        >
                                            {authConfigContent.toggleText}
                                        </button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
}