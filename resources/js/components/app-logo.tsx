
export default function AppLogo() {
    return (
        <div className="group relative rounded-lg flex w-full items-center gap-3 overflow-hidden bg-white/5 py-3 transition-all duration-300 hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/10">
            {/* Subtle shine effect */}
            <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

            <div className="relative flex items-center gap-3">
                {/* Logo with elegant hover */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-lg bg-blue-500 opacity-0 blur transition-opacity duration-300 group-hover:opacity-30" />
                    <div className="relative flex aspect-square size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 transition-all duration-300 group-hover:scale-105 group-hover:rounded-xl group-hover:from-blue-400 group-hover:to-blue-500">
                        <img
                            src="/warlen_logo.png"
                            alt="Warlen Industrial Logo"
                            className="size-6 transition-all duration-300 group-hover:scale-110"
                        />
                    </div>
                </div>

                {/* Company info with slide */}
                <div className="grid flex-1 text-left text-sm">
                    <span className="truncate font-semibold text-white transition-all duration-300 group-hover:translate-x-0.5">
                        Warlen Industrial
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-white/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white/70">
                        <span className="h-1 w-1 rounded-full bg-blue-400 transition-all duration-300 group-hover:bg-blue-300" />
                        Sales Corp
                    </span>
                </div>

                {/* Hover indicator */}
                <div className="text-white/0 transition-all duration-300 group-hover:text-white/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
