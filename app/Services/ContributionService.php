<?php

namespace App\Services;

use App\Models\ContributionVersion;
use Illuminate\Support\Facades\Log;

class ContributionService
{
    /**
     * Calculate government contributions (SSS, Pag-IBIG, PhilHealth) based on salary range
     */
    public function calculateGovernmentContributions(float $grossPay): array
    {
        // Initialize contributions array
        $contributions = [
            'sss' => ['employee' => 0, 'employer' => 0],
            'pagibig' => ['employee' => 0, 'employer' => 0],
            'philhealth' => ['employee' => 0, 'employer' => 0],
        ];

        try {
            // Get the latest contribution versions (without date filtering)
            $sssVersion = ContributionVersion::where('type', 'sss')->first();
            $pagibigVersion = ContributionVersion::where('type', 'pagibig')->first();
            $philhealthVersion = ContributionVersion::where('type', 'philhealth')->first();

            // Calculate SSS (percentage based)
            if ($sssVersion) {
                $contributions['sss'] = $this->calculateContribution($sssVersion, $grossPay, 'SSS');
            }

            // Calculate Pag-IBIG (percentage based)
            if ($pagibigVersion) {
                $contributions['pagibig'] = $this->calculateContribution($pagibigVersion, $grossPay, 'Pag-IBIG');
            }

            // Calculate PhilHealth (percentage based)
            if ($philhealthVersion) {
                $contributions['philhealth'] = $this->calculateContribution($philhealthVersion, $grossPay, 'PhilHealth');
            }

        } catch (\Exception $e) {
            Log::error("Error calculating government contributions: " . $e->getMessage());
        }

        return $contributions;
    }

    /**
     * Calculate contribution for a specific version
     */
    private function calculateContribution($version, float $grossPay, string $type): array
    {
        $result = ['employee' => 0, 'employer' => 0];
        
        $bracket = $version->contributionBrackets()
            ->where('salary_from', '<=', $grossPay)
            ->where('salary_to', '>=', $grossPay)
            ->first();
        
        if ($bracket) {
            // Convert percentage to actual amount
            $employeePercentage = (float) $bracket->employee_share;
            $employerPercentage = (float) $bracket->employer_share;
            
            $result = [
                'employee' => round($grossPay * ($employeePercentage / 100), 2),
                'employer' => round($grossPay * ($employerPercentage / 100), 2),
            ];
        } else {
            // If salary is outside all brackets, use the nearest bracket
            $nearestBracket = $this->findNearestBracket($version, $grossPay);
            if ($nearestBracket) {
                $employeePercentage = (float) $nearestBracket->employee_share;
                $employerPercentage = (float) $nearestBracket->employer_share;
                
                $result = [
                    'employee' => round($grossPay * ($employeePercentage / 100), 2),
                    'employer' => round($grossPay * ($employerPercentage / 100), 2),
                ];
            }
        }
        
        Log::info("{$type} Calculation:", [
            'gross_pay' => $grossPay,
            'employee_amount' => $result['employee'],
            'employer_amount' => $result['employer']
        ]);

        return $result;
    }

    /**
     * Find the nearest contribution bracket for a given salary
     */
    private function findNearestBracket($version, float $salary)
    {
        // Try to find the bracket with salary_to closest to the given salary
        $bracket = $version->contributionBrackets()
            ->orderByRaw('ABS(salary_to - ?)', [$salary])
            ->first();
        
        return $bracket;
    }
}