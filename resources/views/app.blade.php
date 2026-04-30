<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? 'system' }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <link rel="icon" href="/images/dekalogo.png" type="image/png">
    <link rel="apple-touch-icon" href="/images/dekalogo.png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap" rel="stylesheet">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia

    <script>
        // Disable developer tools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, right-click)
        (function() {
            // Helper to prevent default action
            function prevent(e) {
                e.preventDefault();
                return false;
            }

            // 1. Disable F12
            window.addEventListener('keydown', function(e) {
                if (e.key === 'F12') {
                    prevent(e);
                }
            });

            // 2. Disable Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+U (View Source)
            window.addEventListener('keydown', function(e) {
                // Ctrl+Shift+I or Cmd+Option+I (Mac)
                if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.keyCode === 73)) ||
                    (e.metaKey && e.altKey && (e.key === 'I' || e.keyCode === 73))) {
                    prevent(e);
                }
                // Ctrl+Shift+J or Cmd+Option+J (Mac)
                if ((e.ctrlKey && e.shiftKey && (e.key === 'J' || e.keyCode === 74)) ||
                    (e.metaKey && e.altKey && (e.key === 'J' || e.keyCode === 74))) {
                    prevent(e);
                }
                // Ctrl+U (view source)
                if ((e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85))) {
                    prevent(e);
                }
            });

            // 3. Disable right-click context menu
            document.addEventListener('contextmenu', function(e) {
                prevent(e);
            });
        })();
    </script>
</body>

</html>
