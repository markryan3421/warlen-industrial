import { Form } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import gsap from 'gsap';
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
const ACCENT_COLOR = '#CC570D';   // orange
const STEEL_BLUE = '#093B92';     // solid blue for button
const CARD_BG = '#1e1f2a';
const BORDER_LIGHT = '#3a3c48';

const features = [
    { label: 'Automated Payroll Calculation', color: '#10b981' },
    { label: 'Incentives Sortification',       color: '#c084fc' },
    { label: 'Attendance Filterization',       color: '#94a3b8' },
    { label: 'Data Archive',                   color: '#f97316' },
    { label: 'Dashboard Optimization',         color: '#60a5fa' },
    { label: 'Employee Management',            color: '#facc15' },
    { label: 'Report Generation',              color: '#f87171' },
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
                    color: '#cbd5e1',
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
                <span style={{ color: '#94a3b8', marginRight: '12px' }}>{icon}</span>
                {children}
            </div>
        </div>
    );
}

export default function Login({ status }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showMain, setShowMain] = useState(false);

    const overlayRef = useRef<HTMLDivElement>(null);
    const oldLogoRef = useRef<HTMLImageElement>(null);
    const oldTextRef = useRef<HTMLDivElement>(null);
    const newLogoRef = useRef<HTMLImageElement>(null);
    const newTextRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.to(overlayRef.current, {
                    scale: 0.97,
                    borderRadius: '32px',
                    duration: 0.5,
                    ease: 'power2.inOut',
                });
                gsap.to(overlayRef.current, {
                    opacity: 0,
                    duration: 0.6,
                    delay: 0.1,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        setShowMain(true);
                        document.body.style.overflow = '';
                        gsap.fromTo(mainRef.current,
                            { opacity: 0, y: 20 },
                            { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
                        );
                        if (overlayRef.current) {
                            overlayRef.current.style.display = 'none';
                        }
                    }
                });
            }
        });

        gsap.set([newLogoRef.current, newTextRef.current], { opacity: 0, scale: 0.9 });
        gsap.set([oldLogoRef.current, oldTextRef.current], { opacity: 0, y: 20 });

        tl.fromTo(overlayRef.current,
            { opacity: 0, backgroundColor: '#0a0c10' },
            { opacity: 1, duration: 0.5, ease: 'power2.out' }
        )
        .fromTo(oldLogoRef.current,
            { opacity: 0, scale: 0.7 },
            { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(0.6)' },
            '-=0.2'
        )
        .fromTo(oldTextRef.current,
            { opacity: 0, y: 25 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
            '-=0.4'
        )
        .to({}, { duration: 1.0 })
        .to(oldLogoRef.current, { opacity: 0, scale: 0.6, duration: 0.4, ease: 'power2.in' }, 'transform')
        .to(oldTextRef.current, { opacity: 0, y: -20, duration: 0.35, ease: 'power2.in' }, 'transform')
        .to(overlayRef.current, { backgroundColor: '#1e1f2a', duration: 0.6, ease: 'power2.inOut' }, 'transform+=0.05')
        .fromTo(newLogoRef.current,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' },
            'transform+=0.2'
        )
        .fromTo(newTextRef.current,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
            '-=0.3'
        )
        .to({}, { duration: 0.6 });

        return () => {
            tl.kill();
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <>
            {/* Intro Overlay */}
            <div
                ref={overlayRef}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '2rem',
                    willChange: 'transform, background-color, border-radius',
                }}
            >
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <img
                        ref={oldLogoRef}
                        src="/images/dekalogo.png"
                        style={{ width: '130px', height: '130px', objectFit: 'contain' }}
                        alt="DEKA"
                    />
                    <div
                        ref={oldTextRef}
                        style={{ fontFamily: INTER, fontWeight: 800, fontSize: '2.6rem', letterSpacing: '0.08em', color: ACCENT_COLOR }}
                    >
                        DEKA SALES
                    </div>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', position: 'absolute' }}>
                    <img
                        ref={newLogoRef}
                        src="/images/dekalatestlogo.webp"
                        style={{ width: '140px', height: '140px', objectFit: 'contain' }}
                        alt="Warlen"
                    />
                    <div
                        ref={newTextRef}
                        style={{
                            fontFamily: INTER,
                            fontWeight: 800,
                            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
                            letterSpacing: '0.03em',
                            color: '#e2e8f0',
                            whiteSpace: 'nowrap',
                            padding: '0 1rem',
                        }}
                    >
                        WARLEN INDUSTRIAL SALES CORPORATION
                    </div>
                </div>
            </div>

            {/* Main UI */}
            <div
                ref={mainRef}
                style={{
                    opacity: 0,
                    position: 'relative',
                    minHeight: '100vh',
                    width: '100%',
                    display: showMain ? 'flex' : 'none',
                    flexDirection: 'column',
                    backgroundColor: '#0a0c10',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'url(/images/bgdeka.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'brightness(0.75) contrast(1.1)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 30% 40%, rgba(25, 30, 40, 0.7), rgba(10, 12, 18, 0.85))',
                    }}
                />

                <div style={{ position: 'absolute', top: '28px', left: '36px', zIndex: 20 }}>
                    <img src="/images/dekalogo.png" style={{ width: '52px', height: '52px', objectFit: 'contain', opacity: 0.9 }} alt="DEKA" />
                </div>

                <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '100px 5% 60px', gap: '5%', flexWrap: 'wrap' }}>
                    {/* Left side */}
                    <div style={{ flex: '1 1 45%', minWidth: '280px', marginBottom: '2rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '2px', color: ACCENT_COLOR, textTransform: 'uppercase', background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: '20px' }}>
                                Industrial Enterprise Suite
                            </span>
                        </div>
                        <h1 style={{ fontFamily: INTER, fontWeight: 1000, fontSize: 'clamp(2rem, 4vw, 4rem)', lineHeight: 1.2, margin: '0 0 0.5rem 0', color: '#f1f5f9' }}>
                            <span style={{ color: STEEL_BLUE }}>Warlen Industrial</span><br />
                            <span style={{ color: ACCENT_COLOR }}>DEKA Sales</span>
                        </h1>
                        <h2 style={{ fontFamily: INTER, fontWeight: 800, fontSize: 'clamp(1rem, 3vw, 3rem)', color: '#cbd5e6', margin: '0 0 1rem 0' }}>Payroll Management System</h2>
                        <p style={{ fontFamily: INTER, fontSize: '0.95rem', color: '#a0aec0', lineHeight: 1.6, margin: '0 0 1.8rem 0', maxWidth: '520px' }}>
                            Secure, high‑performance payroll management exclusively for{' '}
                            <strong style={{ color: '#e2e8f0' }}>WARLEN INDUSTRIAL SALES CORPORATION, DEKA Sales</strong>.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {features.map(({ label, color }) => (
                                <span key={label} style={{ fontFamily: INTER, fontWeight: 500, fontSize: '0.75rem', color, border: `1px solid ${color}80`, borderRadius: '32px', padding: '5px 16px', background: 'rgba(0,0,0,0.3)' }}>
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right side – Login Card */}
                    <div style={{ width: '100%', maxWidth: '460px', flexShrink: 0 }}>
                        <div style={{ background: CARD_BG, borderRadius: '28px', boxShadow: '0 25px 45px -12px rgba(0,0,0,0.6)', padding: '2rem', border: '1px solid #3a3c48' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
                                <div style={{ width: '48px', height: '3px', background: `linear-gradient(90deg, ${ACCENT_COLOR}, ${STEEL_BLUE})`, margin: '0 auto 1rem auto', borderRadius: '4px' }} />
                                <h2 style={{ fontFamily: INTER, fontWeight: 700, fontSize: '1.6rem', letterSpacing: '0.2em', color: '#e2e8f0', margin: 0 }}>L O G I N</h2>
                                <p style={{ fontSize: '0.75rem', color: '#8ca3b9', marginTop: '6px' }}>Secure authentication required</p>
                            </div>

                            {status && (
                                <div style={{ fontSize: '0.8rem', color: '#34d399', textAlign: 'center', marginBottom: '20px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '12px' }}>
                                    {status}
                                </div>
                            )}

                            <Form {...store.form()} resetOnSuccess={['password']} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {({ processing, errors }) => (
                                    <>
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
                                                    color: '#f1f5f9',
                                                    padding: '12px 0',
                                                }}
                                            />
                                            {errors?.email && <InputError message={errors.email} className="text-xs mt-1" />}
                                        </OutlinedField>

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
                                                    color: '#f1f5f9',
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
                                                    color: '#94a3b8',
                                                    marginLeft: '8px',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = ACCENT_COLOR)}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                                            >
                                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>
                                            {errors?.password && <InputError message={errors.password} className="text-xs mt-1" />}
                                        </OutlinedField>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" name="remember" style={{ accentColor: ACCENT_COLOR, cursor: 'pointer' }} />
                                                <span style={{ fontSize: '0.8rem', color: '#b9c7d9' }}>Keep session</span>
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

                                        {/* SOLID BLUE BUTTON – NO GRADIENT */}
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
                                                boxShadow: '0 6px 14px rgba(0,0,0,0.3)',
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

                            <div style={{ marginTop: '1.8rem', textAlign: 'center', fontSize: '0.7rem', color: '#6c7a91', borderTop: '1px solid rgba(100,116,139,0.2)', paddingTop: '1.2rem' }}>
                                <span> Restricted Access</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '1rem 1rem 1.5rem', fontSize: '0.7rem', color: '#6a7a8e', borderTop: '1px solid rgba(100,116,139,0.15)', marginTop: 'auto' }}>
                    © 2026 Warlen Industrial Sales Corporation, DEKA Sales — All operational data is encrypted and monitored.
                </div>
            </div>
        </>
    );
}