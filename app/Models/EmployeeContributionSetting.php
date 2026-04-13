<?php

namespace App\Models;

use App\Models\ContributionVersion;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeContributionSetting extends Model
{
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

    public function employee():BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function contributionVersion():BelongsTo
    {
        return $this->belongsTo(ContributionVersion::class,'contribution_version_id');
    }
}
