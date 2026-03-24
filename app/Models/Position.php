<?php

namespace App\Models;

use App\Policies\PositionPolicy;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

#[UsePolicy(PositionPolicy::class)]
class Position extends Model
{
    //
    use SoftDeletes, HasFactory, LogsActivity;

    protected $casts = [
        'deleted_at' => 'datetime',
        'basic_salary' => 'decimal:2',
    ];

    protected $fillable = [
        'pos_name',
        'basic_salary',
        'pos_slug'
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['pos_name', 'basic_salary', 'pos_slug'])
            ->logOnlyDirty();
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function getRouteKeyName(): string
    {
        return 'pos_slug';
    }

    #[Scope]
    protected function getPosition(Builder $query):void
    {
        $this->select(
            'id',
            'pos_name',
            'basic_salary',
            'pos_slug'
        );
    }

    // In App\Models\Position

    // Accessors and Mutators
    protected function posName(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Str::title($value),
            set: fn($value) => strtolower(trim(strip_tags($value))),
        );
    }

    protected function basicSalary(): Attribute
    {
        return Attribute::make(
            set: fn($value) => is_numeric($value) ? (float) $value : 0,
        );
    }
}
