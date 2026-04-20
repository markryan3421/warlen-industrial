        import { Link, usePage } from '@inertiajs/react';
        import { BookOpen, Folder, LayoutGrid, Menu, Search, CalendarClock } from 'lucide-react';
        import ApplicationLeaveController from '@/actions/App/Http/Controllers/EmployeeRole/ApplicationLeaveController';
        import { Breadcrumbs } from '@/components/breadcrumbs';
        import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
        import { Button } from '@/components/ui/button';
        import {
            DropdownMenu,
            DropdownMenuContent,
            DropdownMenuTrigger,
        } from '@/components/ui/dropdown-menu';
        import {
            NavigationMenu,
            NavigationMenuItem,
            NavigationMenuList,
            navigationMenuTriggerStyle,
        } from '@/components/ui/navigation-menu';
        import {
            Sheet,
            SheetContent,
            SheetHeader,
            SheetTitle,
            SheetTrigger,
        } from '@/components/ui/sheet';
        import {
            Tooltip,
            TooltipContent,
            TooltipProvider,
            TooltipTrigger,
        } from '@/components/ui/tooltip';
        import { UserMenuContent } from '@/components/user-menu-content';
        import { useCurrentUrl } from '@/hooks/use-current-url';
        import { useInitials } from '@/hooks/use-initials';
        import { cn, toUrl } from '@/lib/utils';
        import { dashboard } from '@/routes';
        import type { BreadcrumbItem, NavItem } from '@/types';
        import AppLogo from './app-logo';
        import AppLogoIcon from './app-logo-icon';

        type Props = {
            breadcrumbs?: BreadcrumbItem[];
        };

        const mainNavItems: NavItem[] = [
            {
                title: 'Dashboard',
                href: '/employee/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Application Leave',
                href: ApplicationLeaveController.index(),
                icon: CalendarClock,
            },
        ];

        const activeItemStyles =
            'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

        export function AppHeader({ breadcrumbs = [] }: Props) {
            const page = usePage();
            const { auth, user: pageUser } = page.props;
            const getInitials = useInitials();
            const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();

            // Get user data from either auth.user or direct user prop
            const userData = auth?.user || pageUser || {};
            const userName = userData.name || 'User';
            const userEmail = userData.email || '';
            
            // Get avatar URL - handle different possible field names
            let userAvatar = userData.avatar || userData.avatar_url || null;
            
            // If no avatar, generate fallback
            if (!userAvatar) {
                userAvatar = `https://ui-avatars.com/api/?background=1d4791&color=fff&name=${encodeURIComponent(userName)}`;
            }

            return (
                <>
                    <div className="border-b border-sidebar-border/80">
                        <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                            {/* Mobile Menu */}
                            <div className="lg:hidden">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="mr-2 h-[34px] w-[34px]"
                                        >
                                            <Menu className="h-5 w-5" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent
                                        side="left"
                                        className="w-[280px] sm:w-[320px] p-0"
                                    >
                                        <SheetTitle className="sr-only">
                                            Navigation Menu
                                        </SheetTitle>
                                        <div className="flex h-full flex-col">
                                            {/* Sidebar Header */}
                                            <div className="border-b border-sidebar-border px-4 pt-2 -ml-5">
                                                <Link 
                                                    href="/employee/dashboard" 
                                                    className="flex items-center gap-2"
                                                >
                                                    <AppLogo className="h-8 w-8" />
                                                </Link>
                                            </div>

                                            {/* Sidebar Navigation Items */}
                                            <div className="flex-1 overflow-y-auto p-4">
                                                <div className="flex flex-col space-y-1">
                                                    {mainNavItems.map((item) => (
                                                        <Link
                                                            key={item.title}
                                                            href={item.href}
                                                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                        >
                                                            {item.icon && (
                                                                <item.icon className="h-5 w-5" />
                                                            )}
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* User Info in Sidebar Footer */}
                                            <div className="border-t border-sidebar-border p-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage 
                                                            src={userAvatar} 
                                                            alt={userName}
                                                        />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {getInitials(userName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {userName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {userEmail}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>

                            {/* Desktop Logo */}
                            <Link
                                href='/employee/dashboard'
                                prefetch
                                className="hidden items-center space-x-2 lg:flex"
                            >
                                <AppLogo />
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
                                <NavigationMenu className="flex h-full items-stretch">
                                    <NavigationMenuList className="flex h-full items-stretch space-x-2">
                                        {mainNavItems.map((item, index) => (
                                            <NavigationMenuItem
                                                key={index}
                                                className="relative flex h-full items-center"
                                            >
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        navigationMenuTriggerStyle(),
                                                        whenCurrentUrl(
                                                            item.href,
                                                            activeItemStyles,
                                                        ),
                                                        'h-9 cursor-pointer px-3',
                                                    )}
                                                >
                                                    {item.icon && (
                                                        <item.icon className="mr-2 h-4 w-4" />
                                                    )}
                                                    {item.title}
                                                </Link>
                                                {isCurrentUrl(item.href) && (
                                                    <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                                                )}
                                            </NavigationMenuItem>
                                        ))}
                                    </NavigationMenuList>
                                </NavigationMenu>
                            </div>

                            {/* User Avatar Dropdown - Desktop */}
                            <div className="ml-auto flex items-center space-x-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="size-10 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <Avatar className="size-11 overflow-hidden rounded-full">
                                                <AvatarImage
                                                    src={userAvatar}
                                                    alt={userName}
                                                />
                                                <AvatarFallback className="rounded-lg bg-blue-600 text-white">
                                                    {getInitials(userName)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end">
                                        <UserMenuContent user={userData} />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                    
                    {/* Breadcrumbs */}
                    {breadcrumbs && breadcrumbs.length > 1 && (
                        <div className="flex w-full border-b border-sidebar-border/70">
                            <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                                <Breadcrumbs breadcrumbs={breadcrumbs} />
                            </div>
                        </div>
                    )}
                </>
            );
        }