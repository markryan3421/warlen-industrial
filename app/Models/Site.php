<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    //

    protected $fillable = [
        'branch_id',
        'site_name'
    ];

    public function branchOrSite()
    {
        return $this->belongsTo(Branch::class, 'site_id');
    }
}
