<?php

namespace App\Http\Controllers\HrRole;

use App\Http\Controllers\Controller;
use App\Models\AttendanceExceptionStat;
use App\Models\AttendanceLog;
use App\Models\AttendancePeriodStat;
use App\Models\AttendanceSchedule;
use App\Services\PaginatedTableService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HRAttendanceController extends Controller
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

        return Inertia::render('HR/attendances/ScheduleInfo/index', [
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
                'real_pay', 'scheduled_days',
            ],
            searchColumns: ['employee_name', 'department'],
        );

        $visualData = AttendancePeriodStat::query()
            ->select([
                'employee_id', 'employee_name', 'department',
                'period_start', 'period_end',
                'normal_work_hours', 'real_work_hours',
                'late_times', 'late_minutes',
                'attended_days', 'absent_days',
                'real_pay', 'scheduled_days',
            ])
            ->orderBy('period_start')
            ->get();

        return Inertia::render('HR/attendances/PeriodStat/index', [
            'periodStats'         => $stats,
            'visualData'    => $visualData,
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

        $timelineData = AttendanceLog::query()
            ->select([
                'employee_id', 'employee_name', 'department', 'date',
                'time_in', 'time_out', 'total_hours', 'is_overtime',
            ])
            ->orderBy('date')
            ->get();

        return Inertia::render('HR/attendances/AttendanceLogs/index', [
            'logs'         => $logs,
            'timelineData' => $timelineData,
            'filters'       => $request->only(['search', 'perPage']),
            'totalCount'    => $logs['totalCount'],
            'filteredCount' => $logs['filteredCount'],
        ]);
    }

    public function attendanceExceptionStats(Request $request)
    {
        // Paginated data — for the table view
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


        // Only fetch the columns the calendar actually needs
        $calendarData = AttendanceExceptionStat::query()
            ->select([
                'employee_id', 'employee_name', 'department', 'date',
                'am_time_in', 'am_time_out', 'pm_time_in', 'pm_time_out',
                'absence_minutes', 'total_exception_minutes',
            ])
            ->orderBy('date')
            ->get();

        return Inertia::render('HR/attendances/ExceptionStats/index', [
            'exceptionStats'         => $stats,
            'calendarData'  => $calendarData, 
            'filters'       => $request->only(['search', 'perPage']),
            'totalCount'    => $stats['totalCount'],
            'filteredCount' => $stats['filteredCount'],
        ]);
    }

     public function attendanceManagement(Request $request)
    {
        $tab = $request->get('tab', 'logs');

        // Fetch logs data with pagination
        $logs = PaginatedTableService::make(
            model: AttendanceLog::class,
            request: $request,
            columns: [
                'employee_id',
                'employee_name',
                'department',
                'date',
                'time_in',
                'time_out',
                'total_hours',
                'is_overtime',
            ],
            searchColumns: ['employee_name', 'department'],
        );

        // Fetch exception statistics with pagination
        $exceptionStats = PaginatedTableService::make(
            model: AttendanceExceptionStat::class,
            request: $request,
            columns: [
                'employee_id',
                'employee_name',
                'department',
                'date',
                'am_time_in',
                'am_time_out',
                'pm_time_in',
                'pm_time_out',
                'late_minutes',
                'leave_early_minutes',
                'absence_minutes',
                'total_exception_minutes',
            ],
            searchColumns: ['employee_name', 'department'],
        );

        // Fetch period statistics with pagination
        $periodStats = PaginatedTableService::make(
            model: AttendancePeriodStat::class,
            request: $request,
            columns: [
                'employee_id',
                'employee_name',
                'department',
                'period_start',
                'period_end',
                'normal_work_hours',
                'real_work_hours',
                'late_times',
                'late_minutes',
                'attended_days',
                'absent_days',
                'real_pay',
            ],
            searchColumns: ['employee_name', 'department'],
        );

        // Fetch schedules with pagination
        $schedules = PaginatedTableService::make(
            model: AttendanceSchedule::class,
            request: $request,
            columns: [
                'employee_id',
                'employee_name',
                'department',
                'date',
                'shift_code',
                'shift_label',
            ],
            searchColumns: ['employee_name', 'department', 'shift_label'],
        );

        // Fetch timeline data for logs (only when needed)
        $timelineData = [];
        if ($tab === 'logs') {
            $timelineData = AttendanceLog::query()
                ->select([
                    'employee_id',
                    'employee_name',
                    'department',
                    'date',
                    'time_in',
                    'time_out',
                    'total_hours',
                    'is_overtime',
                ])
                ->orderBy('date')
                ->get();
        }

        // Fetch calendar data for exception stats (only when needed)
        $calendarData = [];
        if ($tab === 'exception_stats') {
            $calendarData = AttendanceExceptionStat::query()
                ->select([
                    'employee_id',
                    'employee_name',
                    'department',
                    'date',
                    'am_time_in',
                    'am_time_out',
                    'pm_time_in',
                    'pm_time_out',
                    'absence_minutes',
                    'total_exception_minutes',
                ])
                ->orderBy('date')
                ->get();
        }

        // Fetch visual data for period stats (only when needed)
        $visualData = [];
        if ($tab === 'period_stats') {
            $visualData = AttendancePeriodStat::query()
                ->select([
                    'employee_id', 'employee_name', 'department',
                    'period_start', 'period_end',
                    'normal_work_hours', 'real_work_hours',
                    'late_times', 'late_minutes',
                    'attended_days', 'absent_days',
                    'real_pay', 'scheduled_days',
                ])
                ->orderBy('period_start')
                ->get();
        }

        // Fetch calendar data for schedules (only when needed)
        $scheduleCalendarData = [];
        if ($tab === 'schedules') {
            $scheduleCalendarData = AttendanceSchedule::query()
                ->select([
                    'employee_id', 'employee_name', 'department',
                    'date', 'shift_code', 'shift_label', 
                ])
                ->orderBy('date')
                ->get();
        }

        return Inertia::render('HR/attendances/index', [
            // Current active tab
            'currentTab' => $tab,
            
            // Logs data
            'logs' => $logs,
            'timelineData' => $timelineData,
            
            // Exception stats data
            'exceptionStats' => $exceptionStats,
            'calendarData' => $calendarData,
            
            // Period stats data
            'periodStats' => $periodStats,
            'visualData' => $visualData,
            
            // Schedules data
            'schedules' => $schedules,
            'scheduleCalendarData' => $scheduleCalendarData,
            
            // Common filters
            'filters' => $request->only(['search', 'perPage']),
            
            // Counts for each data type
            'totalCounts' => [
                'logs' => $logs['totalCount'] ?? 0,
                'exceptionStats' => $exceptionStats['totalCount'] ?? 0,
                'periodStats' => $periodStats['totalCount'] ?? 0,
                'schedules' => $schedules['totalCount'] ?? 0,
            ],
            'filteredCounts' => [
                'logs' => $logs['filteredCount'] ?? 0,
                'exceptionStats' => $exceptionStats['filteredCount'] ?? 0,
                'periodStats' => $periodStats['filteredCount'] ?? 0,
                'schedules' => $schedules['filteredCount'] ?? 0,
            ],
        ]);
    }
}
