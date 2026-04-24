import { Form, Head } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const INTER = "'Inter', sans-serif";
const ACCENT_COLOR = '#CC570D';
const STEEL_BLUE = '#093B92';
const CARD_BG = '#fefaf5';
const BODY_BG = '#f1ede8';
const BORDER_LIGHT = '#e2dbd1';
const TEXT_DARK = '#2c2b28';
const TEXT_MUTED = '#6b6258';

// Enhanced badges – more features with varied colors
const features = [
    { label: 'Automated Payroll Calculation', color: '#03c283' },
    { label: 'Incentives Sortification', color: '#4c7b33' },
    { label: 'Attendance Filterization', color: '#5d6671' },
    { label: 'Data Archive', color: '#ff6a00' },
    { label: 'Dashboard Optimization', color: '#4799fd' },
    { label: 'Employee Management', color: '#facc15' },
    // { label: 'Report Generation', color: '#f87171' },
    // { label: 'Real-time Analytics', color: '#34d399' },
    // { label: 'Multi-role Access', color: '#a78bfa' },
    // { label: 'Compliance Tracking', color: '#fbbf24' },
    { label: 'Leave Management', color: '#9b4646' },
    { label: 'Overtime Calculations', color: '#f2439d' },
];

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

export default function Login({ status }: Props) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="DEKA Payroll Management System" />
            <style>
                {`
                    /* Base responsive reset */
                    * {
                        box-sizing: border-box;
                    }
                    
                    /* Prevent autofill background color change */
                    input:-webkit-autofill,
                    input:-webkit-autofill:hover,
                    input:-webkit-autofill:focus,
                    input:-webkit-autofill:active {
                        -webkit-box-shadow: 0 0 0 30px ${CARD_BG} inset !important;
                        -webkit-text-fill-color: ${TEXT_DARK} !important;
                        caret-color: ${TEXT_DARK} !important;
                        transition: background-color 5000s ease-in-out 0s;
                    }

                    /* Custom checkbox – always a perfect square */
                    input[type="checkbox"] {
                        appearance: none;
                        -webkit-appearance: none;
                        width: 18px !important;
                        height: 18px !important;
                        min-width: 18px !important;
                        min-height: 18px !important;
                        max-width: 18px !important;
                        max-height: 18px !important;
                        background: #fff;
                        border: 1.5px solid ${BORDER_LIGHT};
                        border-radius: 4px;
                        cursor: pointer;
                        position: relative;
                        transition: all 0.2s ease;
                        flex-shrink: 0;
                        flex-grow: 0;
                        display: inline-block;
                        margin: 0;
                        padding: 0;
                        aspect-ratio: 1 / 1;
                    }
                    
                    input[type="checkbox"]:checked {
                        background: ${ACCENT_COLOR};
                        border-color: ${ACCENT_COLOR};
                    }
                    
                    input[type="checkbox"]:checked::after {
                        content: '✓';
                        position: absolute;
                        color: white;
                        font-size: 12px;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                    }
                    
                    input[type="checkbox"]:hover {
                        border-color: ${ACCENT_COLOR};
                    }
                    
                    /* Ensure no breakpoint overrides the square shape */
                    @media (max-width: 768px) {
                        input[type="checkbox"] {
                            width: 18px !important;
                            height: 18px !important;
                            min-width: 18px !important;
                            min-height: 18px !important;
                            max-width: 18px !important;
                            max-height: 18px !important;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        input[type="checkbox"] {
                            width: 18px !important;
                            height: 18px !important;
                            min-width: 18px !important;
                            min-height: 18px !important;
                            max-width: 18px !important;
                            max-height: 18px !important;
                        }
                    }
                    
                    /* Main layout containers */
                    .login-page {
                        position: relative;
                        min-height: 100vh;
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        background-color: ${BODY_BG};
                        overflow-x: hidden;
                    }
                    
                    .login-content-wrapper {
                        position: relative;
                        z-index: 10;
                        flex: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 100%;
                        padding: 100px 5% 60px;
                        gap: 5%;
                        flex-wrap: wrap;
                    }
                    
                    .login-hero {
                        flex: 1 1 45%;
                        min-width: 280px;
                        margin-bottom: 2rem;
                    }
                    
                    .login-card-container {
                        width: 100%;
                        max-width: 460px;
                        flex-shrink: 0;
                        margin: 0 auto;
                    }
                    
                    .login-card {
                        background: ${CARD_BG};
                        border-radius: 28px;
                        box-shadow: 0 20px 35px -10px rgba(0,0,0,0.08);
                        padding: 2rem;
                        border: 1px solid ${BORDER_LIGHT};
                        transition: padding 0.2s ease;
                    }
                    
                    .logo-wrapper {
                        position: absolute;
                        top: 28px;
                        left: 36px;
                        z-index: 20;
                        transition: all 0.2s ease;
                    }
                    
                    .logo-image {
                        width: 52px;
                        height: 52px;
                        object-fit: contain;
                        opacity: 0.9;
                        transition: width 0.2s ease, height 0.2s ease;
                    }
                    
                    /* Enhanced feature badges container */
                    .features-container {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 12px;
                        margin-top: 8px;
                    }
                    
                    /* Badge styling – fully responsive, text wraps */
                    .feature-tag {
                        font-family: ${INTER};
                        font-weight: 600;
                        font-size: 0.75rem;
                        border-radius: 32px;
                        padding: 6px 14px;
                        background: rgba(255,250,240,0.9);
                        letter-spacing: 0.3px;
                        transition: transform 0.1s ease, box-shadow 0.1s ease;
                        white-space: normal;
                        word-break: break-word;
                        line-height: 1.2;
                        text-align: center;
                        display: inline-block;
                        max-width: 100%;
                        flex: 0 0 auto;
                        cursor: default;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                    }
                    
                    .feature-tag:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.05);
                    }
                    
                    /* Responsive badge adjustments */
                    @media (max-width: 640px) {
                        .feature-tag {
                            font-size: 0.7rem;
                            padding: 5px 12px;
                        }
                        .features-container {
                            gap: 10px;
                        }
                    }
                    
                    /* On very small screens, make badges take full width or two columns */
                    @media (max-width: 480px) {
                        .features-container {
                            gap: 8px;
                        }
                        .feature-tag {
                            flex: 1 0 calc(50% - 8px);
                            min-width: 120px;
                            text-align: center;
                            font-size: 0.7rem;
                            padding: 5px 8px;
                        }
                    }
                    
                    /* Even smaller devices: full width badges */
                    @media (max-width: 380px) {
                        .feature-tag {
                            flex: 1 0 100%;
                        }
                    }
                    
                    @media (max-width: 900px) {
                        .login-content-wrapper {
                            gap: 3rem;
                            padding: 90px 4% 50px;
                        }
                        .login-hero {
                            text-align: center;
                            flex-basis: 100%;
                            margin-bottom: 1rem;
                        }
                        .login-hero p {
                            margin-left: auto;
                            margin-right: auto;
                        }
                        .features-container {
                            justify-content: center;
                        }
                    }
                    
                    @media (max-width: 768px) {
                        .login-content-wrapper {
                            padding: 80px 20px 40px;
                            gap: 2rem;
                        }
                        .login-card {
                            padding: 1.5rem;
                        }
                        .login-hero h1 {
                            font-size: clamp(1.8rem, 6vw, 2.8rem);
                        }
                        .login-hero h2 {
                            font-size: clamp(1.2rem, 4vw, 2rem);
                        }
                        .login-hero p {
                            font-size: 0.85rem;
                            max-width: 90%;
                        }
                        .logo-wrapper {
                            top: 16px;
                            left: 16px;
                        }
                        .logo-image {
                            width: 40px;
                            height: 40px;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .login-content-wrapper {
                            padding: 70px 16px 30px;
                            gap: 1.5rem;
                        }
                        .login-card {
                            padding: 1.25rem;
                            border-radius: 24px;
                        }
                        .login-card h2 {
                            font-size: 1.4rem;
                        }
                        .logo-wrapper {
                            top: 12px;
                            left: 12px;
                        }
                        .logo-image {
                            width: 34px;
                            height: 34px;
                        }
                    }
                    
                    @media (max-width: 640px) {
                        .outlined-field-container {
                            height: 48px;
                        }
                        button[type="submit"] {
                            height: 48px;
                            font-size: 0.9rem;
                        }
                    }
                    
                    @media (max-width: 450px) {
                        .login-actions {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 12px;
                        }
                    }
                    
                    @media (hover: none) and (pointer: coarse) {
                        button, .feature-tag, .text-link {
                            cursor: pointer;
                            min-height: 44px;
                        }
                        button[type="submit"] {
                            min-height: 48px;
                        }
                    }
                `}
            </style>
            
            <div className="login-page">
                <div className="logo-wrapper">
                    <img src="/images/dekalogo.png" className="logo-image" alt="DEKA" />
                </div>

                <div className="login-content-wrapper">
                    {/* Left side - Hero section */}
                    <div className="login-hero">
                        <div style={{ marginBottom: '1rem' }}>
                            <span 
                                style={{ 
                                    fontFamily: INTER, 
                                    fontWeight: 900, 
                                    fontSize: '0.75rem', 
                                    letterSpacing: '2px', 
                                    color: ACCENT_COLOR, 
                                    textTransform: 'uppercase', 
                                    background: 'rgba(0,0,0,0.04)', 
                                    padding: '4px 12px', 
                                    borderRadius: '20px',
                                    display: 'inline-block'
                                }}
                            >
                                Workforce Management Suite
                            </span>
                        </div>
                        <h1 style={{ 
                            fontFamily: INTER, 
                            fontWeight: 1000, 
                            fontSize: 'clamp(2rem, 4vw, 4rem)', 
                            lineHeight: 1.2, 
                            margin: '0 0 0.5rem 0', 
                            color: TEXT_DARK 
                        }}>
                            <span style={{ color: STEEL_BLUE }}>WARLEN INDUSTRIAL SALES CORP.</span>{' '}
                            <span style={{ color: ACCENT_COLOR }}>DEKA Sales</span>
                        </h1>
                        <h2 style={{ 
                            fontFamily: INTER, 
                            fontWeight: 800, 
                            fontSize: 'clamp(1rem, 3vw, 3rem)', 
                            color: '#4a4238', 
                            margin: '0 0 1rem 0' 
                        }}>
                            Payroll Management System
                        </h2>
                        <p style={{ 
                            fontFamily: INTER, 
                            fontSize: '0.95rem', 
                            color: TEXT_MUTED, 
                            lineHeight: 1.6, 
                            margin: '0 0 1.8rem 0', 
                            maxWidth: '520px' 
                        }}>
                            Secure, high‑performance payroll management exclusively for{' '}
                            <strong style={{ color: TEXT_DARK }}>WARLEN INDUSTRIAL SALES CORPORATION, DEKA Sales</strong>.
                        </p>
                        <div className="features-container">
                            {features.map(({ label, color }) => (
                                <span 
                                    key={label} 
                                    className="feature-tag"
                                    style={{ border: `2px solid ${color}`, color: color }}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right side – Login Card (unchanged) */}
                    <div className="login-card-container">
                        <div className="login-card">
                            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
                                <div style={{ 
                                    width: '48px', 
                                    height: '3px', 
                                    background: `linear-gradient(90deg, ${ACCENT_COLOR}, ${STEEL_BLUE})`, 
                                    margin: '0 auto 1rem auto', 
                                    borderRadius: '4px' 
                                }} />
                                <h2 style={{ 
                                    fontFamily: INTER, 
                                    fontWeight: 700, 
                                    fontSize: 'clamp(1.3rem, 5vw, 1.6rem)', 
                                    letterSpacing: '0.2em', 
                                    color: TEXT_DARK, 
                                    margin: 0 
                                }}>
                                    L O G I N
                                </h2>
                                <p style={{ fontSize: '0.75rem', color: TEXT_MUTED, marginTop: '6px' }}>
                                    Secure authentication required
                                </p>
                            </div>

                            {status && (
                                <div style={{ 
                                    fontSize: '0.8rem', 
                                    color: '#10b981', 
                                    textAlign: 'center', 
                                    marginBottom: '20px', 
                                    background: 'rgba(16, 185, 129, 0.1)', 
                                    padding: '8px', 
                                    borderRadius: '12px' 
                                }}>
                                    {status}
                                </div>
                            )}

                            <Form {...store.form()} resetOnSuccess={['password']} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {({ processing, errors }) => (
                                    <>
                                        <div>
                                            <OutlinedField id="email" label="Email Address" icon={<Mail size={18} />}>
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="operations@warlen.com"
                                                    required
                                                    autoFocus
                                                    autoComplete="email"
                                                    style={{
                                                        fontFamily: INTER,
                                                        flex: 1,
                                                        background: 'transparent',
                                                        border: 'none',
                                                        outline: 'none',
                                                        fontSize: '0.9rem',
                                                        color: TEXT_DARK,
                                                        padding: '12px 0',
                                                        width: '100%',
                                                    }}
                                                />
                                            </OutlinedField>
                                            {errors?.email && <InputError message={errors.email} className="text-xs mt-1" />}
                                        </div>

                                        <div>
                                            <OutlinedField id="password" label="Password" icon={<Lock size={18} />}>
                                                <input
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••••••••••"
                                                    required
                                                    autoComplete="current-password"
                                                    style={{
                                                        fontFamily: INTER,
                                                        flex: 1,
                                                        background: 'transparent',
                                                        border: 'none',
                                                        outline: 'none',
                                                        fontSize: '0.9rem',
                                                        color: TEXT_DARK,
                                                        padding: '12px 0',
                                                        width: '100%',
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
                                                        flexShrink: 0,
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.color = ACCENT_COLOR)}
                                                    onMouseLeave={e => (e.currentTarget.style.color = TEXT_MUTED)}
                                                >
                                                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                                </button>
                                            </OutlinedField>
                                            {errors?.password && <InputError message={errors.password} className="text-xs mt-1" />}
                                        </div>

                                        <div 
                                            className="login-actions"
                                            style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center', 
                                                marginTop: '4px',
                                                flexWrap: 'wrap',
                                                gap: '8px'
                                            }}
                                        >
                                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                                <input type="checkbox" name="remember" />
                                                <span style={{ fontSize: '0.8rem', color: TEXT_MUTED }}>Keep session</span>
                                            </label>
                                            <TextLink
                                                href={request()}
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: STEEL_BLUE,
                                                    fontWeight: 500,
                                                    textDecoration: 'none',
                                                    borderBottom: `1px solid ${STEEL_BLUE}80`,
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = ACCENT_COLOR)}
                                                onMouseLeave={e => (e.currentTarget.style.color = STEEL_BLUE)}
                                            >
                                                Forgot Password?
                                            </TextLink>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={processing}
                                            style={{
                                                fontFamily: INTER,
                                                fontWeight: 600,
                                                fontSize: 'clamp(0.85rem, 4vw, 0.95rem)',
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
                                            Access Payroll
                                        </button>
                                    </>
                                )}
                            </Form>

                            <div style={{ 
                                marginTop: '1.8rem', 
                                textAlign: 'center', 
                                fontSize: '0.7rem', 
                                color: TEXT_MUTED, 
                                borderTop: `1px solid ${BORDER_LIGHT}`, 
                                paddingTop: '1.2rem' 
                            }}>
                                <span>Restricted Access</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ 
                    position: 'relative', 
                    zIndex: 10, 
                    textAlign: 'center', 
                    padding: '1rem 1rem 1.5rem', 
                    fontSize: 'clamp(0.6rem, 3vw, 0.7rem)', 
                    color: TEXT_MUTED, 
                    borderTop: `1px solid ${BORDER_LIGHT}`, 
                    marginTop: 'auto' 
                }}>
                    © 2026 Warlen Industrial Sales Corporation, DEKA Sales — All operational data is encrypted and monitored.
                </div>
            </div>
        </>
    );
}