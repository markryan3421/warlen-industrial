<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Position extends Model
{
    //
    use SoftDeletes;

    protected $casts = [
        'deleted_at' => 'datetime',
        'basic_salary' => 'decimal:2',
    ];

    protected $fillable = [
        'pos_name',
        'basic_salary',
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    // Accessors and Mutators
    protected function posName(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Str::upper($value),
            set: fn($value) => strtolower(strip_tags($value)),
        );
    }


}
