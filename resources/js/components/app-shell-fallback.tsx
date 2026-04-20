import { Spinner } from '@/components/ui/spinner';

export function AppShellFallback() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Spinner className="size-5 animate-spin" />
				<span>Loading page…</span>
			</div>
		</div>
	);
}