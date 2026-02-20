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
        $salaryRate = $this->faker->randomFloat(2, 200, 1000);
        
        return [
            'position_id' => function() {
                // This ensures a position exists when creating
                return Position::inRandomOrder()->first()?->id 
                    ?? Position::factory()->create()->id;
            },
            'salary_rate' => $salaryRate, 
            'reg_overtime_rate' => $salaryRate * 1.25,
            'special_overtime_rate' => $salaryRate * 1.30,
            'sss_rate' => $this->faker->randomFloat(2, 100, 500),
            'philhealth_rate' => $this->faker->randomFloat(2, 50, 300),
            'pagibig_rate' => $this->faker->randomFloat(2, 20, 100),
        ];
    }

    /**
     * Use a specific position
     */
    public function forPosition(Position $position)
    {
        return $this->state(function (array $attributes) use ($position) {
            return [
                'position_id' => $position->id,
            ];
        });
    }

    /**
     * Use a random existing position
     */
    public function withRandomPosition()
    {
        return $this->state(function (array $attributes) {
            $position = Position::inRandomOrder()->first();
            
            if (!$position) {
                $position = Position::factory()->create();
            }
            
            return [
                'position_id' => $position->id,
            ];
        });
    }

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