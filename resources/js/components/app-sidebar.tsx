import { Link } from '@inertiajs/react';
import { Airplay, CircleMinus, CircleUser, Landmark, UserCog, Clipboard, ChevronDown, Users, Contact, BookUser, UserRoundCog } from 'lucide-react';
import ApplicationLeaveController from '@/actions/App/Http/Controllers/ApplicationLeaveController';
import BranchImportController from '@/actions/App/Http/Controllers/BranchController';
import ContributionController from '@/actions/App/Http/Controllers/ContributionVersionController';
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

const FinanceItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Airplay,
    },
    {
        title: 'Branches',
        href: BranchImportController.index(),
        icon: Landmark,
    },
    {
        title: 'Contributions',
        href: ContributionController.index(),
        icon: CircleMinus,
    },
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
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
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
