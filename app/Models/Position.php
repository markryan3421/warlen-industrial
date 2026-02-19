<?php

namespace App\Models;

use App\Models\Deduction;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Position extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'pos_name',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'position_id');
    }

    public function deduction(): HasOne
    {
        return $this->hasOne(Deduction::class, 'position_id');
    }
    // Accessors and Mutators
    protected function posName(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => Str::upper($value),
            set: fn ($value) => strtolower(strip_tags($value)),
        );
    }
}
