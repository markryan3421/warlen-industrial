<?php

namespace App\Models;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Position extends Model
{
    protected $fillable = [
        'pos_name',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'position_id');
    }
}
