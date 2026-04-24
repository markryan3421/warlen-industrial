// components/app-sidebar.tsx
import { Link } from '@inertiajs/react';
import { LayoutDashboard, History, CircleUser, Building2, Handshake, Coins, UserCog, CalendarClock, Banknote, LayoutDashboardIcon, HandCoins, ChartSpline } from 'lucide-react';
import { FileBadge, Calendar, UsersRound, Contact, BookUser } from 'lucide-react';
import { Users } from 'lucide-react';
import LogsController from "@/actions/App/Http/Controllers/ActivityLogController";
import ApplicationLeaveController from '@/actions/App/Http/Controllers/ApplicationLeaveController';
import BranchController from '@/actions/App/Http/Controllers/BranchController';
import PayrollController from "@/actions/App/Http/Controllers/PayrollController";
import PayrollPeriodController from '@/actions/App/Http/Controllers/PayrollPeriodController';
import { NavFooter } from '@/components/nav-footer';
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
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const OrganizationItems: NavItem[] = [
    {
        title: 'Branches',
        href: '/branches', // Don't use controller method here, use string
        icon: Building2,
        // No pattern needed - will use href for matching
    },
    {
        title: 'Positions',
        href: '/positions',
        icon: UserCog,
    },
];

const WorkforceManagementItems: NavItem[] = [
    {
        title: 'Employees',
        href: '/employees',
        icon: CircleUser,
    },
    {
     title: 'Positions',
     href: '/positions',
     icon: UserCog,  
    },
    {
        title: 'Application Leaves',
        href: '/application-leave',
        icon: CalendarClock,
    },
];

const PayrollOperationsItems: NavItem[] = [
    {
        title: 'Payrolls',
        href: '/payrolls',
        icon: Banknote,
    },
    {
        title: 'Payroll Periods',
        href: '/payroll-periods',
        icon: Calendar,
    },
];

const PayrollConfigurationItems: NavItem[] = [
    {
        title: 'Incentives',
        href: '/incentives',
        icon: Coins,
    },
    {
        title: 'Deductions',
        href: '/deductions',
        icon: HandCoins,
    },
    {
        title: 'Contributions',
        href: '/Contributions',
        icon: Handshake,
    },
]

const DashboardAndReports: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        exactMatch: true, // Dashboard only active on exact match
    },
    {
        title: 'Analytics',
        href: '/ai/dashboard',
        exactMatch: true,
        icon: ChartSpline,
    },
    {
        title: 'Activity Logs',
        href: '/activity-logs',
        icon: History,
    }
];


const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { state } = useSidebar();
    const { isCurrentUrl } = useCurrentUrl();
    const isExpanded = state === 'expanded';

    return (
        <Sidebar collapsible="icon" className="border-r-1 bg-white border-gray-400">
            <SidebarHeader className="px-0 sm:-ml-1 md:px-5 lg:px-2 lg:ml-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="py-10"
                            asChild
                        >
                            <Link
                                href={dashboard()}
                                prefetch
                                className="h-8 w-8 hover:bg-transparent"
                                preserveScroll={true}
                                preserveState={true}
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className={`
                ${isExpanded ? 'px-5 transition-all duration-200 ease-in-out' : 'px-2 transition-all duration-200 ease-in-out'}
            `}>
                <NavMain items={DashboardAndReports} label="General" isCollapsed={!isExpanded} />
                <NavMain items={OrganizationItems} label="Organization" isCollapsed={!isExpanded} />
                <NavMain items={WorkforceManagementItems} label="Workforce Management" isCollapsed={!isExpanded} />
                <NavMain items={PayrollConfigurationItems} label="Payroll Configuration" isCollapsed={!isExpanded} />
                <NavMain items={PayrollOperationsItems} label="Payroll Operations" isCollapsed={!isExpanded} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}