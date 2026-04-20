export type * from './auth';
export type * from './navigation';
export type * from './ui';
export type * from './branches';
export type * from './position';

export interface BranchWithSites {
	id: number;
	branch_name: string;
	branch_slug: string;
	branch_address: string;
	sites?: {
		id: number;
		site_name: string;
		employees_count?: number;
		employees_preview?: {
			id: number;
			employee_number: string;
			user: {
				id: number;
				name: string;
				email: string;
				avatar?: string;
			};
		}[];
	}[];
}