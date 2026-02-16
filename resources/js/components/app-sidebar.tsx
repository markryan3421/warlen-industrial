import { Link } from '@inertiajs/react';
<<<<<<< HEAD
import { BookOpen, CircleMinus, CircleUser, Flag, Folder, Landmark } from 'lucide-react';
=======
import { BookOpen, CircleMinus, Flag, Folder, Landmark,UserCog } from 'lucide-react';
>>>>>>> 7ea0aeb994732ea4a80c27d57a2f189673bbda94
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
import BranchController from '@/actions/App/Http/Controllers/BranchOrSiteController';
import PositionController from '@/actions/App/Http/Controllers/PositionController';

const mainNavItems: NavItem[] = [
    {
        title: 'Branches',
        href: BranchController.index(),
        icon: Landmark,
    },

     {
        title: 'Positions',
        href: PositionController.index(),
        icon: UserCog,
    },
    {
        title: 'Attendance',
        href: '#',
        icon: Flag,
    },
    {
        title: 'Deductions',
        href: '#',
        icon: CircleMinus,
    },

    {
        title: 'Employees',
        href: '/employees',
        icon: CircleUser,
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
