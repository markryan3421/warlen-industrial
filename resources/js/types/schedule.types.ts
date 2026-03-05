// types/schedule.types.ts
export interface ScheduleInfo {
    id: number;
    employee_id: string;        // e.g., "1444"
    name: string;               // e.g., "AllanB"
    department: string;         // e.g., "WEEKENDER"
    shift_type: string;         // From column C (e.g., "WEEKENDER" or "REGULAR")
    // Daily schedule (Oct 1-6, 2025)
    day1: string;              // WED - Oct 1
    day2: string;              // THU - Oct 2
    day3: string;              // FRI - Oct 3
    day4: string;              // SAT - Oct 4
    day5: string;              // SUN - Oct 5
    day6: string;              // MON - Oct 6
    // Optional: date mapping
    dates: {
        [key: string]: string;   // date -> shift value mapping
    }
}