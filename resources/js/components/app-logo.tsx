import AppLogoIcon from './app-logo-icon';
import "@fontsource/inter/800.css";
import { useSidebar } from '@/components/ui/sidebar';

export default function AppLogo() {
    const { state } = useSidebar();
    const isExpanded = state === 'expanded';

    return (
        <div className="flex items-center gap-2">
            <div className={`
                flex items-center justify-center rounded-md 
                ${isExpanded ? 'size-11 -ml-2 -mt-2 transition-all duration-300 ease-in-out' : 'size-8 -ml-2 transition-all duration-200 ease-in-out'}
            `}>
                <AppLogoIcon/>
            </div>
            <div className={`
                grid text-left text-sm
                transition-all duration-100 ease-in-out
                whitespace-nowrap
                ${isExpanded 
                    ? 'opacity-100 max-w-[200px] ml-1' 
                    : 'opacity-0 max-w-0 ml-0'
                }
            `}>
                <span className="mb-0.5 -ml-2 leading-tight tracking-tighter font-['Inter'] text-[12px] text-[#05469D]">
                    Warlen Industrial Sales Corporation
                </span>
                <span className="mb-0.5 truncate leading-tight font-['Inter'] text-[12px] -ml-2 tracking-tighter text-[#FD0C0B]">
                    DEKA Sales
                </span>
            </div>
        </div>
    );  
}