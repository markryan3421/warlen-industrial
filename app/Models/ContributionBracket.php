<?php

namespace App\Models;

use App\Concerns\LogsActivityTrait;
use App\Models\ContributionVersion;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Contracts\Activity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ContributionBracket extends Model
{
    use HasFactory, LogsActivity;

    use LogsActivityTrait;

    protected $fillable = [
        'contribution_version_id',
        'salary_from',
        'salary_to',
        'employee_share',
        'employer_share',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'contributionVersion.type',
                'salary_from',
                'salary_to',
                'employee_share',
                'employer_share',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected function getActivityDisplayNames(): array
    {
        return [
            'contributionVersion.type' => 'Contribution Type',
            'salary_from' => 'Salary From',
            'salary_to' => 'Salary To',
            'employee_share' => 'Employee Share',
            'employer_share' => 'Employer Share',
        ];
    }

    #[Scope]
    protected function getContributionBrackets(Builder $query): void
    {
        $query->select(
            'contribution_version_id',
            'salary_from',
            'salary_to',
            'employee_share',
            'employer_share',
        );
    }

    public function contributionVersion(): BelongsTo
    {
        return $this->belongsTo(ContributionVersion::class, 'contribution_version_id');
    }

    // Accessors and Mutators
    protected function salaryFrom(): Attribute
    {
        return Attribute::make(
            set: fn($value) => is_numeric($value) ? (float) $value : 0,
        );
    }

    // Add mutators for other numeric fields
    protected function salaryTo(): Attribute
    {
        return Attribute::make(
            set: fn($value) => is_numeric($value) ? (float) $value : 0,
        );
    }

    protected function employeeShare(): Attribute
    {
        return Attribute::make(
            set: fn($value) => is_numeric($value) ? (float) $value : 0,
        );
    }

    protected function employerShare(): Attribute
    {
        return Attribute::make(
            set: fn($value) => is_numeric($value) ? (float) $value : 0,
        );
    }
}
