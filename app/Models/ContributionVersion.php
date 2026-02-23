<?php

namespace App\Models;

use App\Models\ContributionBracket;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContributionVersion extends Model
{
    protected $fillable = [
        'type',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function contributionBrackets(): HasMany
    {
        return $this->hasMany(ContributionBracket::class, 'contribution_version_id');
    }
}
