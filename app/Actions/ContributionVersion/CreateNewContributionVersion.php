<?php

namespace App\Actions\ContributionVersion;

use App\Models\ContributionVersion;

class CreateNewContributionVersion
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function create(array $data): ContributionVersion
    {
        $contributionVersion = ContributionVersion::create([
            'type' => $data['type'],
            'effective_from' => $data['effective_from'],
            'effective_to' => $data['effective_to'],
        ]);

        return $contributionVersion;
    }
}
