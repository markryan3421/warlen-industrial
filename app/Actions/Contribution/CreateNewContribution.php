<?php

namespace App\Actions\Contribution;

use App\Models\ContributionBracket;
use App\Models\ContributionVersion;

class CreateNewContribution
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function createContribution(array $data): void
    {
        $contributionVersion = ContributionVersion::create([
            'type' => $data['type'],
            // 'effective_from' => $data['effective_from'],
            // 'effective_to' => $data['effective_to'],
        ]);
        
        foreach ($data['salary_ranges'] as $range) {
            $contributionVersion->contributionBrackets()->create([
                'salary_from' => $range['salary_from'],
                'salary_to' => $range['salary_to'],
                'employee_share' => $range['employee_share'],
                'employer_share' => $range['employer_share'],
            ]);
        }
    }
}
