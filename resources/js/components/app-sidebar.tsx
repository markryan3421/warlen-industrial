import { Link } from '@inertiajs/react';
import { LayoutDashboard, History, CircleUser, Building2, Handshake, Coins  , UserCog, Clipboard, Banknote, LayoutDashboardIcon, HandCoins } from 'lucide-react';
import { FileBadge, Calendar, UserRoundCog, Contact, BookUser } from 'lucide-react';
import { Users } from 'lucide-react';
import LogsController from "@/actions/App/Http/Controllers/ActivityLogController";
import ApplicationLeaveController from '@/actions/App/Http/Controllers/ApplicationLeaveController';
import BranchController from '@/actions/App/Http/Controllers/BranchController';
import ContributionVersionController from '@/actions/App/Http/Controllers/ContributionVersionController';
import PayrollController from "@/actions/App/Http/Controllers/PayrollController";
import PayrollPeriodController from '@/actions/App/Http/Controllers/PayrollPeriodController';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
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

const ExpendituresItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        exactMatch: true,
        icon: LayoutDashboard,
    },
    {
        title: 'Branches',
        href: '/branches',
        icon: Building2,
        pattern: '/branches',
    },
    {
        title: 'Contributions',
        href: '/contribution-versions',
        icon: Handshake,
        pattern: '/contribution-versions',
    },
    {
        title: 'Incentives',
        href: '/incentives',
        icon: Coins,
        pattern: '/incentives',
    },
    {
        title: 'Deduction',
        href: '/deductions',
        icon: HandCoins,
        pattern: '/deductions',
    }
];

const AccessControlItems: NavItem[] = [
    {
        title: 'Run Payroll',
        href: '/payrolls',
        icon: Banknote,
        pattern: '/payrolls',
    },
    {
        title: 'Employees',
        href: '/employees',
        icon: CircleUser,
        pattern: '/employees',
    },
    {
        title: 'Application Leaves',
        href: '/application-leave',
        icon: Clipboard,
        pattern: '/application-leave',
    },
    {
        title: 'Payroll Periods',
        href: '/payroll-periods',
        icon: Calendar,
        pattern: '/payroll-periods',
    },
    {
        title: 'Positions',
        href: '/positions',
        icon: UserCog,
        pattern: '/positions',
    },
    {
        title: 'Activity Logs',
        href: '/activity-logs',
        icon: History,
        pattern: '/activity-logs',
    },
];

const AttendanceItems: NavItem[] = [
    {
        title: 'Attendances',
        href: '/attendances',
        icon: Users,
    },
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
                            <Link href={dashboard()} prefetch className="h-8 w-8 hover:bg-transparent">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className={`
                ${isExpanded ? 'px-5 transition-all duration-200 ease-in-out' : 'px-2 transition-all duration-200 ease-in-out'}`}
            >
                <NavMain items={ExpendituresItems} label="Expenditures" isCollapsed={!isExpanded} />
                <NavMain items={AccessControlItems} label="Access Control" isCollapsed={!isExpanded} />
                <NavMain items={AttendanceItems} label="Attendance" isCollapsed={!isExpanded} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}