<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AttendanceExceptionStat;
use App\Models\AttendanceLog;
use App\Models\AttendancePeriodStat;
use App\Models\AttendanceSchedule;
use App\Services\AttendanceTabPaginatedService;
use App\Services\PaginatedTableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class AttendanceController extends Controller
{
    /**
     * Display attendance schedules with calendar view
     */
    public function attendanceSchedules(Request $request)
    {
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

        $calendarData = AttendanceSchedule::query()
            ->select([
                'employee_id',
                'employee_name',
                'department',
                'date',
                'shift_code',
                'shift_label',
            ])
            ->orderBy('date')
            ->get();

        return Inertia::render('attendances/ScheduleInfo/index', [
            'schedules'         => $schedules,
            'calendarData'      => $calendarData,
            'filters'           => $request->only(['search', 'perPage']),
            'totalCount'        => $schedules['totalCount'],
            'filteredCount'     => $schedules['filteredCount'],
        ]);
    }

    /**
     * Display attendance period statistics with visual data
     */
    public function attendancePeriodStats(Request $request)
    {
        $stats = PaginatedTableService::make(
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

        $visualData = AttendancePeriodStat::query()
            ->select([
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
                'scheduled_days',
            ])
            ->orderBy('period_start')
            ->get();

        return Inertia::render('attendances/PeriodStat/index', [
            'stats'         => $stats,
            'visualData'    => $visualData,
            'filters'       => $request->only(['search', 'perPage']),
            'totalCount'    => $stats['totalCount'],
            'filteredCount' => $stats['filteredCount'],
        ]);
    }

    /**
     * Display attendance logs with timeline view
     */
    public function attendanceLogs(Request $request)
    {
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

        return Inertia::render('attendances/AttendanceLogs/index', [
            'logs'          => $logs,
            'timelineData'  => $timelineData,
            'filters'       => $request->only(['search', 'perPage']),
            'totalCount'    => $logs['totalCount'],
            'filteredCount' => $logs['filteredCount'],
        ]);
    }

    /**
     * Display attendance exception statistics with calendar view
     */
    public function attendanceExceptionStats(Request $request)
    {
        $stats = PaginatedTableService::make(
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

        return Inertia::render('attendances/ExceptionStats/index', [
            'stats'         => $stats,
            'calendarData'  => $calendarData,
            'filters'       => $request->only(['search', 'perPage']),
            'totalCount'    => $stats['totalCount'],
            'filteredCount' => $stats['filteredCount'],
        ]);
    }

    /**
     * Combined attendance management dashboard
     * Includes all attendance data types with tab navigation
     */
    /**
     * Combined attendance management dashboard
     * Includes all attendance data types with tab navigation
     */
    /**
     * Combined attendance management dashboard
     * Includes all attendance data types with tab navigation
     */
    public function attendanceManagement(Request $request)
    {
        $tab = $request->get('tab', 'logs');

        // Debug: Log the incoming request
        Log::info('AttendanceManagement - Request received', [
            'tab' => $tab,
            'page' => $request->get('page'),
            'perPage' => $request->get('perPage'),
            'search' => $request->get('search'),
            'all_params' => $request->all()
        ]);

        // Get common parameters (page, perPage, search) for all tables
        $commonParams = $request->only(['page', 'perPage', 'search']);

        // Create separate requests WITHOUT the tab parameter
        $logsRequest = Request::create('/attendances', 'GET', $commonParams);
        $exceptionRequest = Request::create('/attendances', 'GET', $commonParams);
        $periodRequest = Request::create('/attendances', 'GET', $commonParams);
        $schedulesRequest = Request::create('/attendances', 'GET', $commonParams);

        // Fetch logs data - ONLY paginate if it's the active tab
        $logs = AttendanceTabPaginatedService::makeForActiveTab(
            model: AttendanceLog::class,
            request: $logsRequest,
            columns: [
                'id',
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
            tabName: 'logs',
            isActiveTab: ($tab === 'logs')
        );

        // Fetch exception statistics - ONLY paginate if it's the active tab
        $exceptionStats = AttendanceTabPaginatedService::makeForActiveTab(
            model: AttendanceExceptionStat::class,
            request: $exceptionRequest,
            columns: [
                'id',
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
            tabName: 'exceptions',
            isActiveTab: ($tab === 'exceptions')
        );

        // Fetch period statistics - ONLY paginate if it's the active tab
        $periodStats = AttendanceTabPaginatedService::makeForActiveTab(
            model: AttendancePeriodStat::class,
            request: $periodRequest,
            columns: [
                'id',
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
            tabName: 'periods',
            isActiveTab: ($tab === 'periods')
        );

        // Fetch schedules - ONLY paginate if it's the active tab
        $schedules = AttendanceTabPaginatedService::makeForActiveTab(
            model: AttendanceSchedule::class,
            request: $schedulesRequest,
            columns: [
                'id',
                'employee_id',
                'employee_name',
                'department',
                'date',
                'shift_code',
                'shift_label',
            ],
            searchColumns: ['employee_name', 'department', 'shift_label'],
            tabName: 'schedules',
            isActiveTab: ($tab === 'schedules')
        );

        // ========================================================================
        // FETCH TIMELINE/CALENDAR DATA (No pagination, always fetch)
        // ========================================================================

        // Debug: Check if there's data in the database
        $totalExceptionStats = AttendanceExceptionStat::count();
        Log::info('Database check', [
            'total_exception_stats_records' => $totalExceptionStats,
            'total_logs_records' => AttendanceLog::count(),
            'total_period_stats_records' => AttendancePeriodStat::count(),
            'total_schedules_records' => AttendanceSchedule::count(),
        ]);

        // Fetch timeline data for logs (ALL data for timeline view)
        $timelineData = [];
        if ($tab === 'logs') {
            $timelineData = AttendanceTabPaginatedService::getAllData(
                model: AttendanceLog::class,
                request: $request,
                searchColumns: ['employee_name', 'department'],
                columns: [
                    'id',
                    'employee_id',
                    'employee_name',
                    'department',
                    'date',
                    'time_in',
                    'time_out',
                    'total_hours',
                    'is_overtime',
                ],
                limit: null,
                orderBy: 'date',
                orderDirection: 'desc'
            );

            Log::info('Timeline data fetched', [
                'count' => $timelineData->count(),
                'sample' => $timelineData->first()
            ]);
        }

        // Fetch calendar data for exception stats (ALL data for calendar view)
        $calendarData = [];
        if ($tab === 'exceptions') {
            Log::info('Fetching calendar data for exceptions tab');

            $calendarData = AttendanceTabPaginatedService::getAllData(
                model: AttendanceExceptionStat::class,
                request: $request,
                searchColumns: ['employee_name', 'department'],
                columns: [
                    'id',
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
                limit: null,
                orderBy: 'date',
                orderDirection: 'desc'
            );

            Log::info('Calendar data fetched', [
                'count' => $calendarData->count(),
                'is_collection' => $calendarData instanceof \Illuminate\Support\Collection,
                'first_record' => $calendarData->first(),
                'has_data' => $calendarData->isNotEmpty()
            ]);
        }

        // Fetch visual data for period stats (ALL data for visual view)
        $visualData = [];
        if ($tab === 'periods') {
            $visualData = AttendanceTabPaginatedService::getAllData(
                model: AttendancePeriodStat::class,
                request: $request,
                searchColumns: ['employee_name', 'department'],
                columns: [
                    'id',
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
                    'scheduled_days',
                ],
                limit: null,
                orderBy: 'period_start',
                orderDirection: 'desc'
            );

            Log::info('Visual data fetched', [
                'count' => $visualData->count()
            ]);
        }

        // Fetch calendar data for schedules (ALL data for schedule calendar view)
        $scheduleCalendarData = [];
        if ($tab === 'schedules') {
            $scheduleCalendarData = AttendanceTabPaginatedService::getAllData(
                model: AttendanceSchedule::class,
                request: $request,
                searchColumns: ['employee_name', 'department', 'shift_label'],
                columns: [
                    'id',
                    'employee_id',
                    'employee_name',
                    'department',
                    'date',
                    'shift_code',
                    'shift_label',
                ],
                limit: null,
                orderBy: 'date',
                orderDirection: 'desc'
            );

            Log::info('Schedule calendar data fetched', [
                'count' => $scheduleCalendarData->count()
            ]);
        }

        // Debug: Log final data being sent to frontend
        Log::info('Final data being sent to frontend', [
            'currentTab' => $tab,
            'logs_total' => $logs['total'] ?? 0,
            'exceptionStats_total' => $exceptionStats['total'] ?? 0,
            'periodStats_total' => $periodStats['total'] ?? 0,
            'schedules_total' => $schedules['total'] ?? 0,
            'timelineData_count' => $timelineData instanceof \Illuminate\Support\Collection ? $timelineData->count() : count($timelineData),
            'calendarData_count' => $calendarData instanceof \Illuminate\Support\Collection ? $calendarData->count() : count($calendarData),
            'visualData_count' => $visualData instanceof \Illuminate\Support\Collection ? $visualData->count() : count($visualData),
            'scheduleCalendarData_count' => $scheduleCalendarData instanceof \Illuminate\Support\Collection ? $scheduleCalendarData->count() : count($scheduleCalendarData),
        ]);

        return Inertia::render('attendances/index', [
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
