// components/settings-modal.tsx
import { Transition } from '@headlessui/react';
import { Form, Link, router, usePage } from '@inertiajs/react';
import { ShieldBan, ShieldCheck, User, Lock, Shield } from 'lucide-react';
import { useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { send } from '@/routes/verification';
import { disable, enable } from '@/routes/two-factor';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'password' | 'two-factor';

type Props = {
    open: boolean;
    onClose: () => void;
    mustVerifyEmail?: boolean;
    status?: string;
};

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',     label: 'Profile',     icon: <User   className="h-4 w-4" /> },
    { id: 'password',    label: 'Password',    icon: <Lock   className="h-4 w-4" /> },
    { id: 'two-factor',  label: 'Two-Factor',  icon: <Shield className="h-4 w-4" /> },
];

export function SettingsModal({
    open,
    onClose,
    mustVerifyEmail = false,
    status,
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    // ✅ Both values come from live Inertia page props (shared via HandleInertiaRequests).
    //    router.reload() refreshes them reactively — no stale prop problem.
    const page = usePage<{
        auth: { user: any };
        twoFactorEnabled: boolean;
        requiresConfirmation: boolean;
    }>();
    const { auth }              = page.props;
    const twoFactorEnabled      = page.props.twoFactorEnabled      ?? false;
    const requiresConfirmation  = page.props.requiresConfirmation  ?? false;
    const user                  = auth?.user;

    // Password refs
    const passwordInput         = useRef<HTMLInputElement>(null);
    const currentPasswordInput  = useRef<HTMLInputElement>(null);

    // 2FA hook
    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors: twoFactorErrors,
    } = useTwoFactorAuth();

    const [showSetupModal, setShowSetupModal] = useState(false);

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent className="min-w-[1000px] p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                        <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
                    </DialogHeader>

                    <div className="flex min-h-[420px]">
                        {/* Sidebar */}
                        <nav className="w-44 shrink-0 border-r border-border bg-muted/30 p-3 space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer',
                                        activeTab === tab.id
                                            ? 'bg-primary text-primary-foreground cursor-default'
                                            : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">

                            {/* ── Profile ── */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6 ">
                                    <div>
                                        <h3 className="text-sm font-semibold">Profile information</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Update your name and email address
                                        </p>
                                    </div>

                                    <Form
                                        {...ProfileController.update.form()}
                                        options={{ preserveScroll: true }}
                                        className="space-y-4"
                                    >
                                        {({ processing, recentlySuccessful, errors }) => (
                                            <>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="profile-name">Name</Label>
                                                    <Input
                                                        id="profile-name"
                                                        className="w-full"
                                                        defaultValue={user?.name}
                                                        name="name"
                                                        required
                                                        autoComplete="name"
                                                        placeholder="Full name"
                                                    />
                                                    <InputError message={errors.name} />
                                                </div>

                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="profile-email">Email address</Label>
                                                    <Input
                                                        id="profile-email"
                                                        type="email"
                                                        className="w-full"
                                                        defaultValue={user?.email}
                                                        name="email"
                                                        required
                                                        autoComplete="username"
                                                        placeholder="Email address"
                                                    />
                                                    <InputError message={errors.email} />
                                                </div>

                                                {mustVerifyEmail && user?.email_verified_at === null && (
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Your email address is unverified.{' '}
                                                            <Link
                                                                href={send()}
                                                                as="button"
                                                                className="text-foreground underline underline-offset-4"
                                                            >
                                                                Resend verification email.
                                                            </Link>
                                                        </p>
                                                        {status === 'verification-link-sent' && (
                                                            <p className="mt-1 text-sm text-green-600">
                                                                A new verification link has been sent.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 pt-1">
                                                    <Button disabled={processing} data-test="update-profile-button" size="sm">
                                                        Save
                                                    </Button>
                                                    <Transition
                                                        show={recentlySuccessful}
                                                        enter="transition ease-in-out"
                                                        enterFrom="opacity-0"
                                                        leave="transition ease-in-out"
                                                        leaveTo="opacity-0"
                                                    >
                                                        <p className="text-sm text-muted-foreground">Saved</p>
                                                    </Transition>
                                                </div>
                                            </>
                                        )}
                                    </Form>

                                    <div className="border-t border-border pt-4">
                                        <DeleteUser />
                                    </div>
                                </div>
                            )}

                            {/* ── Password ── */}
                            {activeTab === 'password' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold">Update password</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Ensure your account is using a long, random password to stay secure
                                        </p>
                                    </div>

                                    <Form
                                        {...PasswordController.update.form()}
                                        options={{ preserveScroll: true }}
                                        resetOnError={['password', 'password_confirmation', 'current_password']}
                                        resetOnSuccess
                                        onError={(errors) => {
                                            if (errors.password)         passwordInput.current?.focus();
                                            if (errors.current_password) currentPasswordInput.current?.focus();
                                        }}
                                        className="space-y-4"
                                    >
                                        {({ errors, processing, recentlySuccessful }) => (
                                            <>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="current_password">Current password</Label>
                                                    <Input
                                                        id="current_password"
                                                        ref={currentPasswordInput}
                                                        name="current_password"
                                                        type="password"
                                                        className="w-full"
                                                        autoComplete="current-password"
                                                        placeholder="Current password"
                                                    />
                                                    <InputError message={errors.current_password} />
                                                </div>

                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="new_password">New password</Label>
                                                    <Input
                                                        id="new_password"
                                                        ref={passwordInput}
                                                        name="password"
                                                        type="password"
                                                        className="w-full"
                                                        autoComplete="new-password"
                                                        placeholder="New password"
                                                    />
                                                    <InputError message={errors.password} />
                                                </div>

                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="password_confirmation">Confirm password</Label>
                                                    <Input
                                                        id="password_confirmation"
                                                        name="password_confirmation"
                                                        type="password"
                                                        className="w-full"
                                                        autoComplete="new-password"
                                                        placeholder="Confirm password"
                                                    />
                                                    <InputError message={errors.password_confirmation} />
                                                </div>

                                                <div className="flex items-center gap-3 pt-1">
                                                    <Button disabled={processing} data-test="update-password-button" size="sm">
                                                        Save password
                                                    </Button>
                                                    <Transition
                                                        show={recentlySuccessful}
                                                        enter="transition ease-in-out"
                                                        enterFrom="opacity-0"
                                                        leave="transition ease-in-out"
                                                        leaveTo="opacity-0"
                                                    >
                                                        <p className="text-sm text-muted-foreground">Saved</p>
                                                    </Transition>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                </div>
                            )}

                            {/* ── Two-Factor ── */}
                            {activeTab === 'two-factor' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold">Two-Factor Authentication</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Manage your two-factor authentication settings
                                        </p>
                                    </div>

                                    {twoFactorEnabled ? (
                                        <div className="flex flex-col items-start space-y-4">
                                            <Badge variant="default">Enabled</Badge>
                                            <p className="text-sm text-muted-foreground">
                                                With two-factor authentication enabled, you will be
                                                prompted for a secure, random pin during login, which
                                                you can retrieve from the TOTP-supported application
                                                on your phone.
                                            </p>

                                            {/* Recovery codes already fetched after confirmation */}
                                            <TwoFactorRecoveryCodes
                                                recoveryCodesList={recoveryCodesList}
                                                fetchRecoveryCodes={fetchRecoveryCodes}
                                                errors={twoFactorErrors}
                                            />

                                            <Form
                                                {...disable.form()}
                                                onSuccess={() =>
                                                    router.reload({ only: ['twoFactorEnabled'] })
                                                }
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        variant="destructive"
                                                        type="submit"
                                                        disabled={processing}
                                                        size="sm"
                                                    >
                                                        <ShieldBan className="mr-2 h-4 w-4" />
                                                        Disable 2FA
                                                    </Button>
                                                )}
                                            </Form>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start space-y-4">
                                            <Badge variant="destructive">Disabled</Badge>
                                            <p className="text-sm text-muted-foreground">
                                                When you enable two-factor authentication, you will
                                                be prompted for a secure pin during login. This pin
                                                can be retrieved from a TOTP-supported application
                                                on your phone.
                                            </p>

                                            <div>
                                                {hasSetupData ? (
                                                    <Button size="sm" onClick={() => setShowSetupModal(true)}>
                                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                                        Continue Setup
                                                    </Button>
                                                ) : (
                                                    <Form
                                                        {...enable.form()}
                                                        onSuccess={() => setShowSetupModal(true)}
                                                    >
                                                        {({ processing }) => (
                                                            <Button type="submit" disabled={processing} size="sm">
                                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                                Enable 2FA
                                                            </Button>
                                                        )}
                                                    </Form>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rendered outside the main Dialog to avoid nested portal issues */}
            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                onSuccess={() => setShowSetupModal(false)}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
                qrCodeSvg={qrCodeSvg}
                manualSetupKey={manualSetupKey}
                clearSetupData={clearSetupData}
                fetchSetupData={fetchSetupData}
                fetchRecoveryCodes={fetchRecoveryCodes}
                errors={twoFactorErrors}
            />
        </>
    );
}

export default SettingsModal;