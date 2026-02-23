<?php

namespace App\Actions\ContributionVersion;

use App\Models\ContributionVersion;

class UpdateContributionVersion
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function update(array $data, ContributionVersion $contributionVersion)
    {
        $contributionVersion->update([
            'type' => $data['type'],
            'effective_from' => $data['effective_from'],
            'effective_to' => $data['effective_to'],
        ]);

        return $contributionVersion;
    }
}
