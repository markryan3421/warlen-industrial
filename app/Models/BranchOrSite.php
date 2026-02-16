<?php

namespace App\Models;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BranchOrSite extends Model
{
    protected $fillable = [
        'branch_name',
        'branch_address',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'branch_or_site_id');
    }
}
