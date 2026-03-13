<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AttendanceExceptionStat;
use App\Models\AttendanceLog;
use App\Models\AttendancePeriodStat;
use App\Models\AttendanceSchedule;
use App\Services\PaginatedTableService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function attendanceSchedules(Request $request) {
        $schedules = PaginatedTableService::make(
            model:         AttendanceSchedule::class,
            request:       $request,
            columns:       [
                'employee_id', 'employee_name', 'department',
                'date', 'shift_code', 'shift_label',
            ],
            searchColumns: ['employee_name', 'department', 'shift_label'],
        );

        return Inertia::render('attendances/ScheduleInfo/index', [
            'schedules'         => $schedules,
            'filters'       => $request->only(['search', 'perPage']),
            'totalCount'    => $schedules['totalCount'],
            'filteredCount' => $schedules['filteredCount'],
        ]);
    }

    public function attendancePeriodStats(Request $request) {
        $stats = PaginatedTableService::make(
            model:         AttendancePeriodStat::class,
            request:       $request,
            columns:       [
                'employee_id', 'employee_name', 'department',
                'period_start', 'period_end',
                'normal_work_hours', 'real_work_hours',
                'late_times', 'late_minutes',
                'attended_days', 'absent_days',
                'real_pay',
            ],
            searchColumns: ['employee_name', 'department'],
        );

        return Inertia::render('attendances/PeriodStat/index', [
            'stats'         => $stats,
            'filters'       => $request->only(['search', 'perPage']),
            'totalCount'    => $stats['totalCount'],
            'filteredCount' => $stats['filteredCount'],
        ]);
    }

    public function attendanceLogs(Request $request) {
        $logs = PaginatedTableService::make(
            model:         AttendanceLog::class,
            request:       $request,
            columns:       [
                'employee_id', 'employee_name', 'department',
                'date', 'time_in', 'time_out', 'total_hours', 'is_overtime',
            ],
            searchColumns: ['employee_name', 'department'],
        );
        
        // Get exception stats for the second tab
        $exceptionStats = PaginatedTableService::make(
            model:         AttendanceExceptionStat::class,
            request:       $request,
            columns:       [
                'employee_id', 'employee_name', 'department', 'date',
                'am_time_in', 'am_time_out', 'pm_time_in', 'pm_time_out',
                'late_minutes', 'leave_early_minutes', 'absence_minutes',
                'total_exception_minutes',
            ],
            searchColumns: ['employee_name', 'department'],
        );

        return Inertia::render('attendances/AttendanceLogs/index', [
            'logs' => $logs,
            'stats' => $exceptionStats,
            'filters' => $request->only(['search', 'perPage']),
            'totalCount' => $logs['totalCount'],
            'filteredCount' => $logs['filteredCount'],
            'statsTotalCount' => $exceptionStats['totalCount'],
            'statsFilteredCount' => $exceptionStats['filteredCount'],
        ]);
    }

    public function attendanceExceptionStats(Request $request) {
        $stats = PaginatedTableService::make(
            model:         AttendanceExceptionStat::class,
            request:       $request,
            columns:       [
                'employee_id', 'employee_name', 'department', 'date',
                'am_time_in', 'am_time_out', 'pm_time_in', 'pm_time_out',
                'late_minutes', 'leave_early_minutes', 'absence_minutes',
                'total_exception_minutes',
            ],
            searchColumns: ['employee_name', 'department'],
        );

        return Inertia::render('attendances/ExceptionStats/index', [
            'stats' => $stats,
            'logs' => ['data' => [], 'links' => [], 'from' => 0, 'to' => 0, 'total' => 0],
            'filters' => $request->only(['search', 'perPage']),
            'totalCount' => 0,
            'filteredCount' => 0,
            'statsTotalCount' => $stats['totalCount'],
            'statsFilteredCount' => $stats['filteredCount'],
        ]);
    }

    public function attendances(Request $request) {
    // Get attendance logs
    $logs = PaginatedTableService::make(
        model: AttendanceLog::class,
        request: $request,
        columns: [
            'employee_id', 'employee_name', 'department',
            'date', 'time_in', 'time_out', 'total_hours', 'is_overtime',
        ],
        searchColumns: ['employee_name', 'department'],
    );
    
    // Get exception stats
    $exceptions = PaginatedTableService::make(
        model: AttendanceExceptionStat::class,
        request: $request,
        columns: [
            'employee_id', 'employee_name', 'department', 'date',
            'am_time_in', 'am_time_out', 'pm_time_in', 'pm_time_out',
            'late_minutes', 'leave_early_minutes', 'absence_minutes',
            'total_exception_minutes',
        ],
        searchColumns: ['employee_name', 'department'],
    );
    
    // Get schedules
    $schedules = PaginatedTableService::make(
            model:         AttendanceSchedule::class,
            request:       $request,
            columns:       [
                'employee_id', 'employee_name', 'department',
                'date', 'shift_code', 'shift_label',
            ],
            searchColumns: ['employee_name', 'department', 'shift_label'],
        );
    
    // Get period stats
    $periods = PaginatedTableService::make(
        model: AttendancePeriodStat::class,
        request: $request,
        columns: [
            'employee_id', 'employee_name', 'department',
            'period_start', 'period_end',
            'normal_work_hours', 'real_work_hours',
            'late_times', 'late_minutes',
            'attended_days', 'absent_days',
            'real_pay',
        ],
        searchColumns: ['employee_name', 'department'],
    );

    return Inertia::render('attendances/index', [
        'logs' => $logs,
        'exceptions' => $exceptions,
        'schedules' => $schedules,
        'periods' => $periods,
        'filters' => $request->only(['search', 'perPage']),
        'totalCount' => $logs['totalCount'],
        'filteredCount' => $logs['filteredCount'],
        'exceptionsTotalCount' => $exceptions['totalCount'],
        'exceptionsFilteredCount' => $exceptions['filteredCount'],
        'schedulesTotalCount' => $schedules['totalCount'],
        'schedulesFilteredCount' => $schedules['filteredCount'],
        'periodsTotalCount' => $periods['totalCount'],
        'periodsFilteredCount' => $periods['filteredCount'],
    ]);
}
}