// components/hr-sidebar.tsx
import { Link } from '@inertiajs/react';
import {
    Airplay,
    Landmark,
    CircleMinus,
    FileBadge,
    Banknote,
    CircleUser,
    Clipboard,
    Calendar,
    UserCog,
    Settings,
    LogOut,
    Users,
    Contact,
    BookUser,
    UserRoundCog,
    Coins,
    LayoutDashboard,
    Building2
} from 'lucide-react';
import AttendanceController from "@/actions/App/Http/Controllers/HrRole/HRAttendanceController";
import HREmployeeController from '@/actions/App/Http/Controllers/HrRole/HREmployeeController';
import IncentiveController from "@/actions/App/Http/Controllers/HrRole/HRIncentiveController";
import PayrollController from "@/actions/App/Http/Controllers/HrRole/PayrollController";
import PayrollPeriodController from "@/actions/App/Http/Controllers/HrRole/PayrollPeriodController";
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

// HR-specific menu items
const hrExpendituresItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/hr/dashboard',
        icon: LayoutDashboard,
    },

    {
        title: 'Branches',
        href: '/hr/branches',
        icon: Building2,
    },
    {
        title: 'Positions',
        href: '/hr/positions',
        icon: UserCog,
    },

    {
        title: 'Incentives',
        href: IncentiveController.index(),
        icon: Coins,
    },
    {
        title: 'Employees',
        href: HREmployeeController.index(),
        icon: CircleUser,
    },
    {
        title: 'Run Payroll',
        href: PayrollController.index(),
        icon: Banknote,
    },
    {
        title: 'Payroll Period',
        href: PayrollPeriodController.index(),
        icon: Calendar,
    },
    {
        title: 'Attendance',
        href: '/hr/attendances',
        icon: Users,
    },
    // {
    //     title: 'Attendance Logs',
    //     href: AttendanceController.attendanceLogs(),
    //     icon: Contact,
    // },
    // {
    //     title: 'Attendance Exception Stats',
    //     href: AttendanceController.attendanceExceptionStats(),
    //     icon: Calendar,
    // },
    // {
    //     title: 'Attendance Period Stats',
    //     href: AttendanceController.attendancePeriodStats(),
    //     icon: BookUser,
    // },

    // {
    //     title: 'Attendance Schedules',
    //     href: AttendanceController.attendanceSchedules(),
    //     icon: UserRoundCog,
    // }

];

const hrAccessControlItems: NavItem[] = [
    //    {
    //     title: 'Employees',
    //     href: '/employees',
    //     icon: CircleUser,
    // },
    // {
    //     title: 'Application Leaves',
    //     href: ApplicationLeaveController.index(),
    //     icon: Clipboard,
    // },
    // {
    //     title: 'Payroll Periods',
    //     href: '/hr/payroll-periods',
    //     icon: Calendar,
    // },
    // {
    //     title: 'Positions',
    //     href: '/hr/positions',
    //     icon: UserCog,
    // },
];

const footerNavItems: NavItem[] = [

];

export function HrSidebar() {
    const { state } = useSidebar(); // This will work because it's inside SidebarProvider
    const isExpanded = state === 'expanded';

    return (
        <Sidebar collapsible="icon" className="border-r bg-white">
            <SidebarHeader className="px-5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="py-10" asChild>
                            <Link href="/hr/dashboard" prefetch className="hover:bg-white">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className={isExpanded ? 'px-5' : '-ml-3 px-5'}>
                <NavMain items={hrExpendituresItems} label="Expenditures" />
                <NavMain items={hrAccessControlItems} label="Access Control" />
            </SidebarContent>

            <SidebarFooter>
                <NavMain items={footerNavItems} /> {/* Use NavMain for footer items */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}