<?php

namespace App\Actions\BranchOrSite;

use App\Models\BranchOrSite;

class UpdateBranchOrSite
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function update(array $data, $branchOrSite): BranchOrSite
    {
        $branchOrSite->update([
            'branch_name' => $data['branch_name'],
            'branch_address' => $data['branch_address'],
        ]);

        return $branchOrSite;
    }
}
