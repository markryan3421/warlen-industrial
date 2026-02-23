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

<<<<<<< HEAD
    // Accessors and Mutators
=======
>>>>>>> 7520b3d359a76f941d05328b3b126be743e502e8
    protected function posName(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Str::upper($value),
            set: fn($value) => strtolower(strip_tags($value)),
        );
    }


}
