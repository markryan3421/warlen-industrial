<?php

namespace App\Actions\Branch;

use App\Models\Branch;
use Illuminate\Support\Str;

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
        'branch_slug' => Str::slug($data['branch_name']),
        'branch_address' => $data['branch_address'],
    ]);

    // Handle sites if provided
    if (!empty($data['sites'])) {
        foreach ($data['sites'] as $site) {
            // Check if site has an ID (existing site)
            if (isset($site['id'])) {
                // Update existing site ONLY - employees remain associated
                $branch->sites()->where('id', $site['id'])->update([
                    'site_name' => $site['site_name'],
                ]);
            } else {
                // Create new site
                $branch->sites()->create([
                    'site_name' => $site['site_name'],
                ]);
            }
        }
    }

    return $branch;
}
}
