<?php

namespace App\Models;

use App\Models\BranchOrSite;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employee extends Model
{
    protected $table = 'employees';

    protected $fillable = [
        'position_id',
        'branch_or_site_id',
        'user_id',
        'employee_number',
        'emergency_contact_number',
        'department',
        'employee_status',
    ];

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

    public function branchOrSite(): BelongsTo
    {
        return $this->belongsTo(BranchOrSite::class, 'branch_or_site_id');
    } 

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
