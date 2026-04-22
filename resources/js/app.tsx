import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { AppShellFallback } from './components/app-shell-fallback';

// Declare global window interface for Echo
declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

// Initialize Pusher and Echo
window.Pusher = Pusher;

// Configure Echo with Reverb
const echoConfig = {
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: import.meta.env.VITE_REVERB_PORT || '8080',
    wssPort: import.meta.env.VITE_REVERB_PORT || '8080',
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        },
    },
};

// Only initialize Echo if the app key is available
if (import.meta.env.VITE_REVERB_APP_KEY) {
    window.Echo = new Echo(echoConfig);
} else {
    console.warn('VITE_REVERB_APP_KEY is not defined. Real-time updates disabled.');
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Track authentication state globally
let isAuthenticated = false;

// Update auth state from Inertia page props
function updateAuthState(pageProps: any) {
    // Adjust the path to match where your user object is shared
    isAuthenticated = !!pageProps.auth?.user;
}

// Check if current URL is a settings page
function isSettingsPage(): boolean {
    const currentPath = window.location.pathname;
    // Check if the current path starts with /settings
    return currentPath.startsWith('/settings');
}

// Create a custom confirmation modal
function showLogoutConfirmation(onConfirm: () => void) {
    // Create modal elements
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        backdrop-filter: blur(4px);
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        font-family: system-ui, -apple-system, sans-serif;
    `;

    modal.innerHTML = `
        <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #111827;">Confirm Logout</h3>
        <p style="margin: 0 0 20px 0; color: #4B5563; font-size: 14px; line-height: 1.5;">
           This action will immediately log you out for security purposes.
            Are you sure you want to continue?
        </p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="logout-cancel" style="
                padding: 8px 16px;
                border: 1px solid #D1D5DB;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: #374151;
            ">Cancel</button>
            <button id="logout-confirm" style="
                padding: 8px 16px;
                border: none;
                background: #DC2626;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: white;
            ">Yes, Logout</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Handle button clicks
    const confirmBtn = modal.querySelector('#logout-confirm');
    const cancelBtn = modal.querySelector('#logout-cancel');

    const cleanup = () => {
        overlay.remove();
    };

    confirmBtn?.addEventListener('click', () => {
        cleanup();
        onConfirm();
    });

    cancelBtn?.addEventListener('click', () => {
        cleanup();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            cleanup();
        }
    });

    // Close on escape key
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            cleanup();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Set up back‑button logout listener with confirmation
const handleBackButton = (event: PopStateEvent) => {
    // Only show modal if authenticated AND not on a settings page
    if (isAuthenticated && !isSettingsPage()) {
        event.stopImmediatePropagation();
        event.preventDefault();

        // Push state forward to prevent immediate navigation
        window.history.pushState(null, '', window.location.href);

        // Show confirmation modal
        showLogoutConfirmation(() => {
            router.post('/logout');
        });
    }
    // If on settings page, do nothing - allow normal back button behavior
};

window.addEventListener('popstate', handleBackButton, true);

// REMOVED: The beforeunload event listener that was causing the "Reload site?" popup

createInertiaApp({
    title: (title) => (title ? `${title}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        // Set initial auth state from the first page load
        updateAuthState(props.initialPage.props);

        // Listen to subsequent Inertia navigations to keep auth state updated
        router.on('navigate', (event) => {
            updateAuthState(event.detail.page.props);
        });

        const root = createRoot(el);
        root.render(
            <StrictMode>
                <Suspense fallback={<AppShellFallback />}>
                    <App {...props} />
                </Suspense>
            </StrictMode>,
        );
    },
    progress: {
        color: 'oklch(0.488 0.243 264.376)',
    },
});

// This will set light / dark mode on load...
initializeTheme();