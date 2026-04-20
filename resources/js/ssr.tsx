import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Suspense } from 'react';
import ReactDOMServer from 'react-dom/server';
import { AppShellFallback } from './components/app-shell-fallback';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) =>
	createInertiaApp({
		page,
		render: ReactDOMServer.renderToString,
		title: (title) => (title ? `${title} - ${appName}` : appName),
		resolve: (name) =>
			resolvePageComponent(
				`./pages/${name}.tsx`,
				import.meta.glob('./pages/**/*.tsx'),
			),
		setup: ({ App, props }) => {
			return <Suspense fallback={<AppShellFallback />}>
				<App {...props} />
			</Suspense>;
		},
	}),
);
