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
        $branch = Branch::create([
            'branch_name' => $data['branch_name'],
            'branch_address' => $data['branch_address'],
        ]);

        if (!empty($data['sites'])) {
            foreach ($data['sites'] as $site) {
                $branch->sites()->create([
                    'site_name' => $site['site_name'],
                ]);
            }
        }

        return $branch;
    }
}
