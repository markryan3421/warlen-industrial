<?php

namespace App\Models;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Branch extends Model
{
    protected $fillable = [
        'branch_name',
        'branch_address',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'branch_id');
    }

    public function sites(): HasMany
    {
        return $this->hasMany(Site::class, 'branch_id');
    }
    
    // Accessors and Mutators
    protected function branchName():Attribute
    {
        return Attribute::make(
            get: fn ($value) => Str::upper($value),
            set: fn ($value) => strtolower(strip_tags($value)),
        );
    }

    protected function branchAddress():Attribute
    {
        return Attribute::make(
            get: fn ($value) => ucwords($value),
            set: fn ($value) => strtolower(strip_tags($value)),
        );
    }

}
