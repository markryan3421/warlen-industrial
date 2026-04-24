// components/hr-sidebar.tsx
import { Link } from '@inertiajs/react';
import {
    HandCoins,
    Banknote,
    CircleUser,
    CalendarClock,
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
    Building2,
    Handshake,
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


const HROrganizationItems: NavItem[] = [
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
];

const HRWorkforceManagementItems: NavItem[] = [
    {
        title: 'Employees',
        href: HREmployeeController.index(),
        icon: CircleUser,
    },
    {
        title: 'Attendance',
        href: '/hr/attendances',
        icon: Users,
    },
    {
        title: 'Application Leaves',
        href: '/hr/application-leave',
        icon: CalendarClock,
    },
];

const HRPayrollConfigurationItems: NavItem[] = [
    {
        title: 'Incentives',
        href: IncentiveController.index(),
        icon: Coins,
    },
    {
        title: 'Deductions',
        href: '/hr/deductions',
        icon: HandCoins,
    },
    {
        title: 'Contributions',
        href: '/hr/contribution-versions',
        icon: Handshake,
    },
];

const HRPayrollOperationsItems: NavItem[] = [
    {
        title: 'Payrolls',
        href: PayrollController.index(),
        icon: Banknote,
    },
    {
        title: 'Payroll Periods',
        href: PayrollPeriodController.index(),
        icon: Calendar,
    },
];
// HR-specific menu items
const HRGeneralItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/hr/dashboard',
        icon: LayoutDashboard,
    },
];

export function HrSidebar() {
    const { state } = useSidebar(); // This will work because it's inside SidebarProvider
    const isExpanded = state === 'expanded';

    return (
        <Sidebar collapsible="icon" className="border-r-1 bg-white">
            <SidebarHeader className="px-5 sm:-ml-1 md:px-5 lg:px-2 lg:ml-2">
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

            <SidebarContent className={`
                ${isExpanded ? 'px-5 transition-all duration-200 ease-in-out' : 'px-2 transition-all duration-200 ease-in-out'}
            `}>

                <NavMain items={HRGeneralItems} label="General" />
                <NavMain items={HROrganizationItems} label="Organization" />
                <NavMain items={HRWorkforceManagementItems} label="Workforce Management" />
                <NavMain items={HRPayrollConfigurationItems} label="Payroll Configurations" />
                <NavMain items={HRPayrollOperationsItems} label="Payroll Operations" />

            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}