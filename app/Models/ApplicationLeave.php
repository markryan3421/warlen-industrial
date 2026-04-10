<?php

namespace App\Models;

use App\Policies\ApplicationLeavePolicy;
use App\Concerns\LogsActivityTrait;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

#[UsePolicy(ApplicationLeavePolicy::class)]
class ApplicationLeave extends Model
{

    use HasFactory, LogsActivity;

    use LogsActivityTrait;

    protected $fillable = [
        'employee_id',
        'slug_app',
        'leave_start',
        'leave_end',
        'reason_to_leave',
        'app_status',
        'approved_by',
        'rejected_by',
        'remarks',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'leave_start' => 'date',
        'leave_end' => 'date',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'employee.user.name',
                //'slug_app',
                'leave_start',
                'leave_end',
                'reason_to_leave',
                'app_status',
                'approved_by',
                'rejected_by',
                'remarks',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected function getActivityDisplayNames(): array
    {
        return [
            'employee.user.name' => 'Employee Name',
            //'slug_app' => 'Application Slug',
            'leave_start' => 'Leave Start Date',
            'leave_end' => 'Leave End Date',
            'reason_to_leave' => 'Reason for Leave',
            'app_status' => 'Application Status',
            'approved_by' => 'Approved By',
            'rejected_by' => 'Rejected By',
            'remarks' => 'Remarks',
        ];
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    protected function approvedBy(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Str::title($value),
            set: fn($value) => trim(strip_tags($value))
        );
    }

    protected function rejectedBy(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Str::title($value),
            set: fn($value) => trim(strip_tags($value))
        );
    }

    protected function appStatus(): Attribute
    {
        return Attribute::make(
            set: fn($value) => trim(strip_tags($value)),
        );
    }

    protected function leaveStart(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Carbon::parse($value)->format('Y-m-d')
        );
    }

    protected function leaveEnd(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Carbon::parse($value)->format('Y-m-d')
        );
    }

    protected function reasonToLeave(): Attribute
    {
        return Attribute::make(
            set: fn($value) => trim(strip_tags($value)),
        );
    }

    public function getRouteKeyName()
    {
        return 'slug_app';
    }
}
