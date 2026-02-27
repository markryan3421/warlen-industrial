import { Link } from '@inertiajs/react';
import { Airplay, CircleMinus, CircleUser, Flag, Landmark, Lock, UserCog, Clipboard } from 'lucide-react';
import BranchController from '@/actions/App/Http/Controllers/BranchController';
import PositionController from '@/actions/App/Http/Controllers/PositionController';
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
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import ContributionController from '@/actions/App/Http/Controllers/ContributionVersionController';
import ApplicationLeaveController from '@/actions/App/Http/Controllers/ApplicationLeaveController';

const ExpendituresItems: NavItem[] = [
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
        title: 'Attendance',
        href: '/coming-soon',
        icon: Flag,
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
    {
        title: 'Permissions',
        href: '/permissions',
        icon: Lock,
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
        <Sidebar collapsible="icon" variant="inset" className ="border-r-1 border-gray-400">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className='py-10' asChild>
                            <Link href={dashboard()} prefetch className='h-8 w-8 '>
                                <AppLogo/>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain label='Expenditures' items={ExpendituresItems} />
                <NavMain label='Access Control' items={AccessControlItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
