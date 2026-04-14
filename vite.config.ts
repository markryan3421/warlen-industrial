import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    // setup to access the dev server from the host machine
    server: {
        host: '0.0.0.0',
        port: 5173,
        hmr: {
            host: '10.186.216.116', // Your computer's IP
            protocol: 'ws',
        },
        // Optional: Watch for file changes
        watch: {
            usePolling: true,
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        // Ensure assets are built to public/build
        outDir: 'public/build',
        manifest: true,
        rollupOptions: {
            input: 'resources/js/app.jsx'
        }
    }
});
