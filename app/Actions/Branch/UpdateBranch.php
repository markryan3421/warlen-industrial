<?php

namespace App\Actions\Branch;

use App\Models\Branch;

class UpdateBranch
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function update(array $data, Branch $branch): Branch
    {
        $branch->update([
            'branch_name' => $data['branch_name'],
            'branch_address' => $data['branch_address'],
        ]);

        $branch->sites()->delete();
        
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
