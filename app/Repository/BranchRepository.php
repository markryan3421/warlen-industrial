<?php

namespace App\Repository;

use App\Models\Branch;
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
        return Branch::query()
            ->with(['sites' => fn($query) => $query->getSiteName()])
            ->get(['id', 'branch_name', 'branch_address']);
    }
}
