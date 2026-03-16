// types/payroll.ts
export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Position {
    id: number;
    pos_name: string;
    deleted_at: string | null;
}

export interface Employee {
    id: number;
    emp_code: string;
    user: User;
    position: Position;
}

export interface PayrollPeriod {
    id: number;
    period_name: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
}

export interface PayrollItem {
    id: number;
    payroll_id: number;
    code: string;
    type: 'earning' | 'deduction';
    amount: number;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface Payroll {
    id: number;
    payroll_period_id: number;
    employee_id: number;
    gross_pay: number;
    total_deduction: number;
    net_pay: number;
    payroll_items?: PayrollItem[];
    payroll_period?: PayrollPeriod;
    employee?: Employee;
    created_at: string;
    updated_at: string;
}

export interface PayrollPagination {
    data: Payroll[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    from: number;
    to: number;
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface PayrollFilters {
    search: string;
    perPage: string;
    page?: number;
}