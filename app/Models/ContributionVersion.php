<?php

namespace App\Models;

use App\Models\ContributionBracket;
use App\Policies\ContributionVersionPolicy;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

#[UsePolicy(ContributionVersionPolicy::class)]
class ContributionVersion extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'type',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'type',
                'effective_from',
                'effective_to',
            ])
            ->logOnlyDirty();
    }

    public function contributionBrackets(): HasMany
    {
        return $this->hasMany(ContributionBracket::class, 'contribution_version_id');
    }



    //// Accessors and Mutators

    protected function type(): Attribute
    {
        return Attribute::make(
            set: fn($value) => trim(strip_tags($value)),
        );
    }

    protected function effectiveFrom(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $value ? Carbon::parse($value)->format('Y-m-d') : null,
        );
    }

    protected function effectiveTo(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $value ? Carbon::parse($value)->format('Y-m-d') : null,
        );
    }
}
