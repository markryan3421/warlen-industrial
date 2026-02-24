<?php

namespace App\Models;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\Permission\Traits\HasRoles;

class Employee extends Model
{
    use HasRoles;
    
    protected $table = 'employees';


    protected $fillable = [
        'position_id',
        'branch_id',
        'user_id',
        'site_id',
        'slug_emp',
        'emp_code',
        'employee_number',
        'contract_start_date',
        'contract_end_date',
        'emergency_contact_number',
        'pay_frequency',
        'employee_status',
    ];

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(ApplicationLeave::class, 'employee_id');
    }

    public function sites(): BelongsTo
    {
        return $this->belongsTo(Site::class, 'site_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'employee_id');
    }


    
    // Accessors and Mutators
    protected function employeeStatus(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Str::title($value),
            set: fn($value) => strtolower(strip_tags($value)),
        );
    }

    protected function employeeNumber(): Attribute
    {
        return Attribute::make(
            set: fn($value) => strip_tags($value),
        );
    }

    protected function emergencyContactNumber(): Attribute
    {
        return Attribute::make(
            set: fn($value) => strip_tags($value),
        );
    }

    protected function payFrequency(): Attribute
    {
        return Attribute::make(
           // get: fn($value) => preg_replace('/[^a-zA-Z0-9\s]/', '-', Str::title($value)),
            set: fn($value) => strtolower(strip_tags($value)),
        );
    }

    public function site()
    {
        return $this->belongsTo(Site::class, 'site_id');
    }

    public function getRouteKeyName()
    {
        return 'slug_emp';
    }
}
