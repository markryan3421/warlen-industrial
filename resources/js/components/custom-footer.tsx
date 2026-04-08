import { Link } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-slate-200 bg-white shadow-[0_-1px_3px_0_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Subtle gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />

      {/* Background pattern (very light) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231d4791' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Logo + wordmark */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0 w-9 h-9">
              <div className="absolute inset-0 rounded-lg shadow-md shadow-[#1d4791]/20" />
              <AppLogoIcon />
            </div>
            <div className="leading-none">
              <p className="text-[13px] font-bold tracking-tight text-slate-800">
                Warlen Industrial
              </p>
              <p className="text-[10px] tracking-[0.12em] uppercase text-slate-400 font-medium mt-0.5">
                Sales Corporation
              </p>
            </div>
          </div>

          {/* Right: Badge + copyright + back to top */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1d4791]/20 bg-[#1d4791]/5 px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase text-[#1d4791]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1d4791] animate-pulse" />
              Attendance & Payroll
            </span>

            <span className="hidden sm:block h-4 w-px bg-slate-200" />

            <p className="text-[11px] text-slate-400">
              © {currentYear} All rights reserved.
            </p>

            {/* Back to top button */}
            <button
              onClick={scrollToTop}
              className="ml-2 hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 text-slate-400 hover:border-[#1d4791]/30 hover:text-[#1d4791] hover:bg-[#1d4791]/5 transition-all duration-200"
              aria-label="Back to top"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;