import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroupLabel
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({ items = [], label, isCollapsed = false }: { items: NavItem[], label: string, isCollapsed?: boolean }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <>
            <SidebarGroup className="px-2 py-1">
                {/* Only show label when not collapsed */}
                {!isCollapsed && (
                    <SidebarGroupLabel className="px-2 pb-1 text-xs font-regular text-muted-foreground tracking-wider">
                        {label}
                    </SidebarGroupLabel>
                )}
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={isCollapsed ? { children: item.title } : undefined}
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    preserveScroll={true}
                                    preserveState={true}
                                >
                                    {item.icon && (
                                        <item.icon className={cn(
                                            "shrink-0 transition-all duration-200 ease-in-oushrink-0 transition-transform duration-200 ease-in-out group-data-[collapsible=icon]:scale-115 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:transition-transform duration-300 ease-in-out",
                                            isCollapsed && "scale-110"
                                        )} />
                                    )}
                                    <span className={cn(
                                        "transition-all duration-200 ease-linear",
                                        isCollapsed && "hidden"
                                    )}>
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