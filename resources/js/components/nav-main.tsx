import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <>
            <SidebarGroup className="px-2 py-0">
                <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                                className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!px-0"
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    preserveScroll={true}
                                    preserveState={true}
                                >
                                    {item.icon && (
                                        <item.icon className="shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:scale-110" />
                                    )}
                                    <span className="transition-all duration-200 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:opacity-0">
                                        {item.title}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </>
    );
}