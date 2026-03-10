import { Link } from '@inertiajs/react';
import { Airplay, CircleMinus, CircleUser, Landmark, UserCog, Clipboard, Calendar, Users, Contact, BookUser, UserRoundCog, ChevronDown, FileBadge, PhilippinePesoIcon } from 'lucide-react';
import ApplicationLeaveController from '@/actions/App/Http/Controllers/ApplicationLeaveController';
import BranchController from '@/actions/App/Http/Controllers/BranchController';
import ContributionController from '@/actions/App/Http/Controllers/ContributionVersionController';
import IncentiveController from '@/actions/App/Http/Controllers/IncentiveController';
// import PositionController from '@/actions/App/Http/Controllers/PositionController';
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
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import PayrollPeriodController from '@/actions/App/Http/Controllers/PayrollPeriodController';
import PayrollController from '@/actions/App/Http/Controllers/PayrollController';

const FinanceItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Airplay,
    },
    {
        title: 'Branches',
        href: BranchController.index(),
        icon: Landmark,
    },
    {
        title: 'Contributions',
        href: ContributionController.index(),
        icon: CircleMinus,
    },
    {
        title: 'Incentives',
        href: '/incentives',
        icon: FileBadge,
    }



];

const AccessControlItems: NavItem[] = [

    {
        title: 'Employees',
        href: '/employees',
        icon: CircleUser,
    },
    {
        title: 'Application Leaves',
        href: ApplicationLeaveController.index(),
        icon: Clipboard,
    },
    {
        title: 'Payroll Periods',
        href: PayrollPeriodController.index(),
        icon: Calendar,
    },
    {
        title: 'Payroll',
        href: PayrollController.index(),
        icon: PhilippinePesoIcon,
    },
    {
        title: 'Positions',
        href: '/positions',
        icon: UserCog,
    },
];

const AttendanceItems: NavItem[] = [
    {
        title: 'Attendance',
        href: '/attendances',
        icon: Users,
    },
    {
        title: 'Attendance Exception Stats',
        href: '/attendance-exception-stats',
        icon: CircleUser,
    },
    {
        title: 'Attendance Logs',
        href: '/attendance-logs',
        icon: Contact,
    },
    {
        title: 'Attendance Period Stats',
        href: '/attendance-period-stats',
        icon: BookUser,
    },
    {
        title: 'Attendance Schedules',
        href: '/attendance-schedules',
        icon: UserRoundCog,
    },
];

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch preserveScroll={true} preserveState={true}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Finance Group */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="text-white">
                                Finance
                                <ChevronDown className="ml-auto flex items-center justify-items-center transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <NavMain items={FinanceItems} />
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                {/* Access Control Group */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="text-white">
                                Access Control
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <NavMain items={AccessControlItems} />
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                {/* Attendance Group */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="text-white">
                                Attendance
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <NavMain items={AttendanceItems} />
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
