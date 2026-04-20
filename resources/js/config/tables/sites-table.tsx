import { MapPin, Users, Eye } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

// ─── Local Type Definitions (avoid missing module error) ────────────────────
interface SiteRow {
	id: number;
	site_name: string;
	employees_count: number;
	employees_preview?: any[];
}

export interface ColumnConfig {
	key: string;
	label: string;
	sortable?: boolean;
	align?: 'left' | 'center' | 'right';
	render?: (value: any, row: SiteRow) => React.ReactNode;
}

export interface ActionConfig {
	label: string;
	icon: React.ElementType;
	href?: (row: SiteRow) => string;
	onClick?: (row: SiteRow) => void;
	variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
	size?: 'default' | 'sm' | 'lg' | 'icon';
}

// ─── Table Configuration ───────────────────────────────────────────────────
export const SitesTableConfig: {
	columns: ColumnConfig[];
	actions: ActionConfig[];
} = {
	columns: [
		{
			key: 'site_name',
			label: 'Site Name',
			sortable: true,
			render: (value, row) => (
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1d4791]/10 text-[#1d4791]">
						<MapPin className="h-4 w-4" />
					</div>
					<span className="font-medium text-slate-900">{value}</span>
				</div>
			),
		},
		{
			key: 'employees_count',
			label: 'Employees',
			align: 'right',
			render: (value: number) => (
				<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
					<Users className="h-3.5 w-3.5" />
					{value}
				</span>
			),
		},
	],
	actions: [
		{
			label: 'View Employees',
			icon: Eye,
			href: (row) => `/sites/${row.id}/employees`,
			variant: 'ghost',
			size: 'sm',
		},
	],
};