<?php

namespace App\Actions\BranchOrSite;

use App\Models\BranchOrSite;

class CreateNewBranchOrSite
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function create(array $data): BranchOrSite
    {
        return BranchOrSite::create([
           'branch_name' => $data['branch_name'],
           'branch_address' => $data['branch_address'],
        ]);
    }
}
