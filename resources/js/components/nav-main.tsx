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

interface NavMainProps {
    items: NavItem[];
    label: string;
    isCollapsed?: boolean;
}

export function NavMain({ items, label, isCollapsed = false }: NavMainProps) {
    const { isCurrentOrParentUrl, isCurrentUrl } = useCurrentUrl();

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
                    
                    if (item.exactMatch) {
                        // Exact match only (for dashboard)
                        isActive = isCurrentUrl(item.href);
                    } else {
                        // Use pattern if provided, otherwise use href
                        const matchPattern = item.pattern || item.href;
                        isActive = isCurrentOrParentUrl(matchPattern);
                    }
                    
                    // Debug (remove in production)
                    if (process.env.NODE_ENV === 'development') {
                        console.log(`[NavMain] ${item.title}:`, {
                            href: item.href,
                            pattern: item.pattern,
                            matchPattern: item.pattern || item.href,
                            currentUrl: useCurrentUrl().currentUrl,
                            isActive,
                            usingExactMatch: !!item.exactMatch
                        });
                    }
                    
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
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