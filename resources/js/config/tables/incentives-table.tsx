import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateSimple } from "@/utils/formatDateSimple";

export const IncentivesTableConfig = {
	columns: [
		{
			key: 'incentive_name',
			label: 'Incentive Name',
			render: (row: any) => <span className="font-medium">{row.incentive_name}</span>
		},
		{
			key: 'incentive_amount',
			label: 'Amount',
			render: (row: any) => formatCurrency(row.incentive_amount)
		},
		{
			key: 'is_daily',
			label: 'Type',
			render: (row: any) => (
				<Badge variant={row.is_daily ? 'default' : 'secondary'}
					className={row.is_daily ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
					{row.is_daily ? 'Daily' : 'One-time'}
				</Badge>
			)
		},
		{
			key: 'payroll_period',
			label: 'Payroll Period',
			render: (row: any) => row.payroll_period ? (
				<div>
					<div>{formatDateSimple(row.payroll_period.start_date)} - {formatDateSimple(row.payroll_period.end_date)}</div>
					<div className="text-xs text-muted-foreground">Pay: {formatDateSimple(row.payroll_period.pay_date)}</div>
				</div>
			) : <span className="text-muted-foreground">N/A</span>
		},
		{
			key: 'employees',
			label: 'Number of Employees',
			render: (row: any) => {
				const count = row.employees?.length || 0;
				return <Badge>
					{count} {count === 1 ? 'Employee' : 'Employees'}
				</Badge>;
			},
		},
		{ label: '', key: 'actions', isAction: true, className: 'border p-4' },
	],
	actions: [
		{ label: 'View', icon: 'Eye', route: 'IncentiveController.show(id)' },
		{ label: 'Edit', icon: 'Pencil', route: 'IncentiveController.edit(id)' },
		{ label: 'Delete', icon: 'Trash2', route: 'IncentiveController.destroy(id)' }
	]
}