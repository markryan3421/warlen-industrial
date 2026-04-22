import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroupLabel
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

interface NavMainProps {
    items: NavItem[];
    label: string;
    isCollapsed?: boolean;
}

export function NavMain({ items, label, isCollapsed = false }: NavMainProps) {
    const { isCurrentOrParentUrl, isCurrentUrl, currentUrl, currentPath } = useCurrentUrl();

    return (
        <>
            <SidebarGroup className="px-2 py-1">
                {!isCollapsed && (
                    <SidebarGroupLabel className="px-2 pb-1 text-xs font-regular text-muted-foreground tracking-wider">
                        {label}
                    </SidebarGroupLabel>
                )}
                <SidebarMenu>
                    {items.map((item) => {
                        let isActive = false;
                        
                        // For items with exactMatch (like Dashboard)
                        if (item.exactMatch) {
                            isActive = isCurrentUrl(item.href);
                        } 
                        // For items with custom pattern
                        else if (item.pattern) {
                            isActive = isCurrentOrParentUrl(item.pattern);
                        }
                        // Default: use href as pattern for parent/child matching
                        else {
                            isActive = isCurrentOrParentUrl(item.href);
                        }

                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon className="h-4 w-4 mt-2" />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroup>
        </>
    );
}