<?php

namespace App\Models;

use App\Models\Employee;
use App\Policies\BranchPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[UsePolicy(BranchPolicy::class)]
class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_name',
        'branch_address',
        'branch_slug'
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'branch_id');
    }

    public function sites(): HasMany
    {
        return $this->hasMany(Site::class, 'branch_id');
    }

    public function getRouteKeyName(): string 
    {
        return 'branch_slug';
    }

    
    // Accessors and Mutators
    protected function branchName():Attribute
    {
        return Attribute::make(
            get: fn ($value) => Str::title($value),
            set: fn ($value) => Str::lower(trim(strip_tags($value))),
        );
    }

    protected function branchAddress():Attribute
    {
        return Attribute::make(
            get: fn ($value) => ucwords($value),
            set: fn ($value) => trim(strip_tags($value)),
        );
    }

}
