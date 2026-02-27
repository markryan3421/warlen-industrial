import AppLogoIcon from './app-logo-icon';
import "@fontsource/inter/700.css";
import { useSidebar } from '@/components/ui/sidebar';

export default function AppLogo() {
    const { state } = useSidebar();
    const isExpanded = state === 'expanded';

    return (
        <div className="flex items-center gap-2">
            <div className={`
                flex aspect-square items-center justify-center rounded-md 
                transition-all duration-500 ease-in-out
                ${isExpanded ? 'size-12' : 'size-8 -ml-2'}
            `}>
                <AppLogoIcon/>
            </div>
            <div className={`
                grid text-left text-sm
                transition-all duration-500 ease-in-out
                overflow-hidden whitespace-nowrap
                ${isExpanded 
                    ? 'opacity-100 max-w-[200px] ml-1' 
                    : 'opacity-0 max-w-0 ml-0'
                }
            `}>
                <span className="mb-0.5 truncate leading-tight font-['Inter'] text-base text-[#05469D]">
                    Warlen Industrial <br/> Sales Corporation
                </span>
                <span className="mb-0.5 truncate leading-tight font-['Inter'] text-base text-[#FD0C0B]">
                    DEKA Sales
                </span>
            </div>
        </div>
    );  
}