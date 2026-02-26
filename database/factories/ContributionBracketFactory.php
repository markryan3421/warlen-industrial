<?php

namespace Database\Factories;

use App\Models\ContributionVersion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ContributionBracket>
 */
class ContributionBracketFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $salaryFrom      = $this->faker->randomFloat(2, 1000, 50000);
        $salaryTo        = $salaryFrom + $this->faker->randomFloat(2, 500, 10000);
        $employeeShare   = $this->faker->randomFloat(2, 50, 1500);
        $employerShare   = $this->faker->randomFloat(2, 50, 1500);

        return [
            'contribution_version_id' => ContributionVersion::inRandomOrder()->first()?->id ?? ContributionVersion::factory(),
            'salary_from'             => $salaryFrom,
            'salary_to'               => $salaryTo,
            'employee_share'          => $employeeShare,
            'employer_share'          => $employerShare,
        ];
    }
}
