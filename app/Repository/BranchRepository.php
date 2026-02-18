<?php

namespace App\Repository;

use App\Models\BranchOrSite;
use Illuminate\Database\Eloquent\Collection;

class BranchRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function getBranches(): Collection
    {
        return BranchOrSite::query()
            ->get(['id', 'branch_name', 'branch_address']);
    }
}
