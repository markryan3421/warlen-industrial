<?php

namespace Database\Factories;

use App\Models\Deduction;
use App\Models\Position;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeductionFactory extends Factory
{
    protected $model = Deduction::class;

    public function definition(): array
    {
        // Random salary rate between 200 and 1000 (daily rate)
        $salaryRate = $this->faker->randomFloat(2, 200, 1000);
        
        return [
            'position_id' => Position::factory(), // Creates a new position if not provided
            'salary_rate' => $salaryRate,
            'reg_overtime_rate' => $salaryRate * 1.25, // 25% overtime premium
            'special_overtime_rate' => $salaryRate * 1.30, // 30% special overtime premium
            'sss_rate' => $this->faker->randomFloat(2, 100, 500), // Monthly SSS contribution
            'philhealth_rate' => $this->faker->randomFloat(2, 50, 300), // Monthly PhilHealth
            'pagibig_rate' => $this->faker->randomFloat(2, 20, 100), // Monthly Pag-IBIG
        ];
    }

    /**
     * Configure the factory to use existing positions
     */
    public function withExistingPositions()
    {
        return $this->state(function (array $attributes) {
            return [
                'position_id' => Position::inRandomOrder()->first()?->id ?? Position::factory(),
            ];
        });
    }

    /**
     * Create a low salary rate entry
     */
    public function lowSalary()
    {
        return $this->state(function (array $attributes) {
            $salaryRate = $this->faker->randomFloat(2, 200, 350);
            return [
                'salary_rate' => $salaryRate,
                'reg_overtime_rate' => $salaryRate * 1.25,
                'special_overtime_rate' => $salaryRate * 1.30,
                'sss_rate' => $this->faker->randomFloat(2, 100, 200),
                'philhealth_rate' => $this->faker->randomFloat(2, 50, 100),
                'pagibig_rate' => $this->faker->randomFloat(2, 20, 50),
            ];
        });
    }

    /**
     * Create a medium salary rate entry
     */
    public function mediumSalary()
    {
        return $this->state(function (array $attributes) {
            $salaryRate = $this->faker->randomFloat(2, 351, 600);
            return [
                'salary_rate' => $salaryRate,
                'reg_overtime_rate' => $salaryRate * 1.25,
                'special_overtime_rate' => $salaryRate * 1.30,
                'sss_rate' => $this->faker->randomFloat(2, 201, 350),
                'philhealth_rate' => $this->faker->randomFloat(2, 101, 200),
                'pagibig_rate' => $this->faker->randomFloat(2, 51, 75),
            ];
        });
    }

    /**
     * Create a high salary rate entry
     */
    public function highSalary()
    {
        return $this->state(function (array $attributes) {
            $salaryRate = $this->faker->randomFloat(2, 601, 1000);
            return [
                'salary_rate' => $salaryRate,
                'reg_overtime_rate' => $salaryRate * 1.25,
                'special_overtime_rate' => $salaryRate * 1.30,
                'sss_rate' => $this->faker->randomFloat(2, 351, 500),
                'philhealth_rate' => $this->faker->randomFloat(2, 201, 300),
                'pagibig_rate' => $this->faker->randomFloat(2, 76, 100),
            ];
        });
    }

    /**
     * Set specific contribution rates
     */
    public function withContributions(float $sss, float $philhealth, float $pagibig)
    {
        return $this->state(function (array $attributes) use ($sss, $philhealth, $pagibig) {
            return [
                'sss_rate' => $sss,
                'philhealth_rate' => $philhealth,
                'pagibig_rate' => $pagibig,
            ];
        });
    }
}
