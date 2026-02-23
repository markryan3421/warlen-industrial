<?php

namespace App\Models;

use App\Models\ContributionVersion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContributionBracket extends Model
{
    protected $fillable = [
        'contribution_version_id',
        'salary_from',
        'salaray_to',
        'employee_share',
        'employer_share',
    ];

    public function contributionVersion(): BelongsTo
    {
        return $this->belongsTo(ContributionVersion::class);
    }

}
