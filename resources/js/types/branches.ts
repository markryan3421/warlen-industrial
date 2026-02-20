export interface Branch {
    id: number;
    branch_name: string;
    branch_address: string;
}

export interface Site {
    id: number;
    site_name: string;
}

export interface BranchWithSites extends Branch {
    sites: Site[];
}