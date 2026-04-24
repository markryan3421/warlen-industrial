// components/user-menu-content.tsx
import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { useInitials } from '@/hooks/use-initials';
import { SettingsModal } from '@/components/settings-modal';

export function UserMenuContent() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const cleanup = useMobileNavigation();
    const getInitials = useInitials();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    // Fix: Ensure avatarUrl is always a string
    const avatarUrl: string = user?.avatar 
        ? String(user.avatar) 
        : `https://ui-avatars.com/api/?background=1d4791&color=fff&name=${encodeURIComponent(user?.name || 'User')}`;

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-3 py-2 text-left text-sm">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarUrl} alt={user?.name || ''} />
                        <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(user?.name || 'User')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email}
                        </p>
                    </div>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={(e) => {
                        e.preventDefault();
                        cleanup();
                        setSettingsOpen(true);
                    }}
                >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </Link>
            </DropdownMenuItem>

            <SettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </>
    );
}