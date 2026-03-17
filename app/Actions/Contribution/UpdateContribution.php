<?php

namespace App\Actions\Contribution;

class UpdateContribution
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function updateContribution(array $data, $contributionVersion): void
    {
        $contributionVersion->update([
            'type' => $data['type'],
            // 'effective_from' => $data['effective_from'],
            // 'effective_to' => $data['effective_to'],
        ]);

        $contributionVersion->contributionBrackets()->delete();

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
