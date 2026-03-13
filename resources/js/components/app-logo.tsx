import AppLogoIcon from './app-logo-icon';
import { useSidebar } from '@/components/ui/sidebar';

export default function     AppLogo() {
    const { state } = useSidebar();
    const isExpanded = state === 'expanded';

    return (
        <div className="flex items-center gap-2 p-5 hover:bg-transparent">
            <div className={`
                flex items-center justify-center rounded-md hover:bg-transparent
                ${isExpanded ? 'size-11 -ml-5 -mt- transition-all duration-300 ease-in-out' : 'size-7 -ml-7 transition-all duration-200 ease-in-out'}
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
                <span className="mb-0.5 -ml-2 leading-tight tracking-tighter inter-bold text-[13px] text-[#05469D]">
                    Warlen Industrial Sales Corporation
                </span>
                <span className="-mt-1 truncate leading-tight inter-extrabold text-[12px] -ml-2 tracking-tighter text-[#FD0C0B]">
                    DEKA Sales
                </span>
                <span className="truncate leading-tight inter-bold text-[12px] -ml-2 tracking-tighter text-black">
                    Payroll Management System
                </span>
            </div>
        </div>
    );  
}
