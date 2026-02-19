<?php

namespace App\Models;

use App\Models\Position;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deduction extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'position_id',
        'salary_rate',
        'reg_overtime_rate',
        'special_overtime_rate',
        'sss_rate',
        'philhealth_rate',
        'pagibig_rate',
    ];

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class,'position_id');
    }


    #[Scope]
    protected function deductionsOnly(Builder $query): void
    {
         $query->select(
                'id',
                'position_id',
                'salary_rate',
                'reg_overtime_rate',
                'special_overtime_rate',
                'sss_rate',
                'philhealth_rate',
                'pagibig_rate'
        );
    }

    // Accessors and Mutators
    protected function salaryRate(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => number_format($value, 2),
            set: fn ($value) => floatval(str_replace(',', '', $value)),
        );
    }

    protected function regOvertimeRate(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => number_format($value, 2),
            set: fn ($value) => floatval(str_replace(',', '', $value)),
        );
    }    
    protected function specialOvertimeRate(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => number_format($value, 2),
            set: fn ($value) => floatval(str_replace(',', '', $value)),
        );
    }

    protected function sssRate(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => number_format($value, 2),
            set: fn ($value) => floatval(str_replace(',', '', $value)),
        );
    }

    protected function philhealthRate(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => number_format($value, 2),
            set: fn ($value) => floatval(str_replace(',', '', $value)),
        );
    }

    protected function pagibigRate(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => number_format($value, 2),
            set: fn ($value) => floatval(str_replace(',', '', $value)),
        );
    }
}
