<?php

namespace App\Models;

use App\Models\ContributionBracket;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ContributionVersion extends Model
{
    use HasFactory;

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



    //// Accessors and Mutators

    protected function type(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => trim(strip_tags($value)),
        );
    }

    protected function effectiveFrom(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Carbon::parse($value)->format('Y-m-d') : null,
        );
    }

    protected function effectiveTo(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Carbon::parse($value)->format('Y-m-d') : null,
        );
    }
}
