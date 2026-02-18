<?php

namespace App\Actions\Branch;

use App\Models\Branch;

class CreateNewBranch
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function create(array $data): Branch
    {
        return Branch::create([
           'branch_name' => $data['branch_name'],
           'branch_address' => $data['branch_address'],
        ]);
    }
}
