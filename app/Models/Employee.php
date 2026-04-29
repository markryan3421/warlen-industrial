<?php

namespace App\Models;


use App\Concerns\LogsActivityTrait;
use App\Models\Branch;
use App\Models\EmployeeContributionSetting;
use App\Models\Position;
use App\Models\User;
use App\Policies\EmployeePolicy;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Activitylog\Contracts\Activity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Traits\HasRoles;

#[UsePolicy(EmployeePolicy::class)]
class Employee extends Model
{
    use HasRoles, HasFactory, SoftDeletes,  LogsActivity, Notifiable;

    use LogsActivityTrait;

    protected $table = 'employees';


    protected $fillable = [
        'position_id',
        'branch_id',
        'user_id',
        'site_id',
        'slug_emp',
        'avatar',
        'emp_code',
        'employee_number',
        'contract_start_date',
        'contract_end_date',
        'sss_number',
        'pagibig_number',
        'philhealth_number',
        'emergency_contact_number',
        'pay_frequency',
        'employee_status',
    ];

    protected $casts = [
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'sss_number' => 'encrypted',
        'pagibig_number' => 'encrypted',
        'philhealth_number' => 'encrypted',
    ];


    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                // 'position_id',
                // 'branch_id',
                // 'user_id',
                // 'site_id',
                'position.pos_name',
                'branch.branch_name',
                'site.site_name',
                'user.name',
                'user.email',
                //'slug_emp',
                'emp_code',
                'employee_number',
                'contract_start_date',
                'contract_end_date',
                'sss_number',
                'pagibig_number',
                'philhealth_number',
                'emergency_contact_number',
                'pay_frequency',
                'employee_status',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function contributionSettings(): HasMany
    {
        return $this->hasMany(EmployeeContributionSetting::class, 'employee_id');
    }

    protected function getActivityDisplayNames(): array
    {
        return [
            'position.pos_name' => 'Position',
            'branch.branch_name' => 'Branch',
            'site.site_name' => 'Site',
            'user.name' => 'Employee Name',
            'user.email' => 'Email',
            //'slug_emp' => 'Employee Slug',
            'emp_code' => 'Employee Code',
            'employee_number' => 'Employee Number',
            'contract_start_date' => 'Contract Start Date',
            'contract_end_date' => 'Contract End Date',
            'sss_number' => 'SSS Number',
            'pagibig_number' => 'Pag-Ibig Membership ID',
            'philhealth' => 'PhilHealth Identification Number',
            'emergency_contact_number' => 'Emergency Contact Number',
            'pay_frequency' => 'Pay Frequency',
            'employee_status' => 'Employee Status',
        ];
    }

    /**
     * Get status badge color for UI
     */
    public function getStatusColorAttribute(): string
    {
        return $this->employee_status === 'active' ? 'green' : 'gray';
    }

    /**
     * Scope active employees
     */
    public function scopeActive($query)
    {
        return $query->where('employee_status', 'active');
    }

    /**
     * Scope inactive employees
     */
    public function scopeInactive($query)
    {
        return $query->where('employee_status', 'inactive');
    }

    /**
     * Check if employee is active
     */
    public function isActive(): bool
    {
        return $this->employee_status === 'active';
    }

    /**
     * Check if employee is inactive
     */
    public function isInactive(): bool
    {
        return $this->employee_status === 'inactive';
    }

    /**
     * Manually check if employee should be active based on current date
     */
    public function shouldBeActive(): bool
    {
        $today = Carbon::today();

        if (!$this->contract_start_date || !$this->contract_end_date) {
            return false;
        }

        return $today->gte($this->contract_start_date) &&
            $today->lte($this->contract_end_date) &&
            $this->contract_start_date->lte($this->contract_end_date);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(ApplicationLeave::class, 'employee_id');
    }

    public function sites(): BelongsTo
    {
        return $this->belongsTo(Site::class, 'site_id');
    }

    // public function attendances(): HasMany
    // {
    //     return $this->hasMany(Attendance::class, 'employee_id');
    // }

    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class, 'employee_id');
    }

    public function employeeIncentives()
    {
        return $this->belongsToMany(Employee::class, 'employee_incentives', 'employee_id', 'incentive_id');
    }



    // Accessors and Mutators
    protected function employeeStatus(): Attribute
    {
        return Attribute::make(
            //get: fn($value) => Str::title($value),
            set: fn($value) => strtolower(trim(strip_tags($value))),
        );
    }

    protected function employeeNumber(): Attribute
    {
        return Attribute::make(
            set: fn($value) => trim(strip_tags($value)),
        );
    }

    protected function emergencyContactNumber(): Attribute
    {
        return Attribute::make(
            set: fn($value) => trim(strip_tags($value)),
        );
    }

    protected function payFrequency(): Attribute
    {
        return Attribute::make(
            // get: fn($value) => preg_replace('/[^a-zA-Z0-9\s]/', '-', Str::title($value)),
            set: fn($value) => strtolower(trim(strip_tags($value))),
        );
    }

    public function site()
    {
        return $this->belongsTo(Site::class, 'site_id');
    }

    public function getRouteKeyName()
    {
        return 'slug_emp';
    }
}
