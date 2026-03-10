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
import { cn } from '@/lib/utils';

export function NavMain({ items = [], label }: { items: NavItem[], label: string }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <>
            <SidebarGroup className="px-2 py-1">
                <SidebarGroupLabel className="px-2 pb-1 text-xs font-regular text-muted-foreground tracking-wider">
                {label}
                </SidebarGroupLabel>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    "transition-colors duration-100",
                                    isCurrentUrl(item.href) && "bg-black text-white border-1 rounded-sm border-white hover:bg-white"
                                )}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon className={cn(
                                        isCurrentUrl(item.href) && "text-white active:text-white",
                                    )} />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </>
    );
}