<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Position extends Model
{
    //
    use SoftDeletes, HasFactory;

    protected $casts = [
        'deleted_at' => 'datetime',
        'basic_salary' => 'decimal:2',
    ];

    protected $fillable = [
        'pos_name',
        'basic_salary',
        'pos_slug'
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function getRouteKeyName(): string 
    {
        return 'pos_slug';
    }

    // Accessors and Mutators
    protected function posName(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Str::title($value),
            set: fn($value) => strtolower(trim(strip_tags($value))),
        );
    }


}
