<?php

namespace App\Models;

use App\Concerns\LogsActivityTrait;
use App\Models\ContributionVersion;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class EmployeeContributionSetting extends Model
{
    use LogsActivityTrait;
    use LogsActivity;

    protected $table = 'employee_contribution_settings';

    protected $fillable = [
        'employee_id',
        'contribution_version_id',
        'is_exempted',
        'fixed_amount',
        'monthly_cap',
    ];

    protected $casts = [
        'is_exempted' => 'boolean',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'employee.user.name',
                'contributionVersion.type',
                'is_exempted',
                'fixed_amount',
                'monthly_cap',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected function getActivityDisplayNames(): array
    {
        return [
            'employee.user.name' => 'Employee Name',
            'contributionVersion.type' => 'Contribution Type',
            'is_exempted' => 'Is Exempted',
            'fixed_amount' => 'Amount',
            'monthly_cap' => 'Monthly Cap',
        ];
    }


    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function contributionVersion(): BelongsTo
    {
        return $this->belongsTo(ContributionVersion::class, 'contribution_version_id');
    }
}
