<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PayrollItem extends Model
{
    use LogsActivity;

    protected $fillable = [
        'payroll_id',
        'code',
        'type',
        'amount',
    ];

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class, 'payroll_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'payroll.employee.user.name',
                'code',
                'type',
                'amount',
            ])
            ->logOnlyDirty();
    }

    protected function code(): Attribute
    {
        return Attribute::make(
            set: fn($value) => trim(strip_tags($value)),
        );
    }

    
    protected function type(): Attribute
    {
        return Attribute::make(
            set: fn($value) => trim(strip_tags($value)),
        );
    }

    protected function amount(): Attribute
    {
        return Attribute::make(
            set: fn($value) => is_numeric($value) ? (float) $value : 0,
        );
    }
}
