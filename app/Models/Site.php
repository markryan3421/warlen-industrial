<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Site extends Model
{
    //
    protected $table = 'sites';

    protected $fillable = [
        'branch_id',
        'site_name'
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'site_id');
    }


    // Accessors and Mutators
    protected function siteName():Attribute
    {
        return Attribute::make(
            get: fn($value) => Str::upper($value),
            set: fn($value) => Str::lower(strip_tags($value)),
        );
    }

    #[Scope]
    protected function getSiteName(Builder $query): void
    {
        $query->select(
            'id',
            'branch_id',
            'site_name',
        );
    }
}
