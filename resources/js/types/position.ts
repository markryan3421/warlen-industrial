export interface Position {
    id: number;
    pos_name: string;
    deduction?: PositionDeduction;
}

export interface PositionDeduction {
    id?: number;
    position_id?: number;
    salary_rate: number | string;
    reg_overtime_rate: number | string;
    special_overtime_rate: number | string;
    sss_rate: number | string;
    philhealth_rate: number | string;
    pagibig_rate: number | string;
}

export interface PositionFormData {
    pos_name: string;
    deduction: {
        salary_rate: number | string;
        reg_overtime_rate: number | string;
        special_overtime_rate: number | string;
        sss_rate: number | string;
        philhealth_rate: number | string;
        pagibig_rate: number | string;
    };
}

export interface PositionResponse {
    positions: Position[];
}

export interface PositionProps {
    position: Position;
}