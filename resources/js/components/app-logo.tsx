import { useSidebar } from '@/components/ui/sidebar';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const { state } = useSidebar();
    const isExpanded = state === 'expanded';

    return (
        <div className="flex items-center gap-2 p-5 mx-1.5 md:ml-3 lg:mr-5">
            <div className={`
                flex items-center justify-center rounded-md
                ${isExpanded ? 'size-11 -ml-5 transition-all duration-300 ease-in-out' : 'size-7 -ml-6.5 transition-all duration-200 ease-in-out'}
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
                <span className="mb-0.5 -ml-2 leading-tight tracking-tighter inter-extrabold font-black text-[13px] text-[#05469D] [-webkit-text-stroke:0.7px_#05469D]">
    WARLEN INDUSTRIAL SALES
</span>
<span className="mb-0.5 -ml-2 leading-tight tracking-tighter inter-extrabold font-black text-[13px] text-[#05469D] [-webkit-text-stroke:0.7px_#05469D]">
    CORPORATION 
</span>
<span className="truncate leading-tight inter-extrabold text-[12px] -ml-2 tracking-tighter text-black font-black [-webkit-text-stroke:0.5px_black]">
    Payroll Management System
</span>
            </div>
        </div>
    );  
}