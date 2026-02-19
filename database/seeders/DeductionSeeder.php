<?php

namespace Database\Seeders;

use App\Models\Deduction;
use App\Models\Position;
use Illuminate\Database\Seeder;

class DeductionSeeder extends Seeder
{
    public function run(): void
    {
        // First, ensure we have positions
        if (Position::count() === 0) {
            $this->call(PositionSeeder::class);
        }

        $positions = Position::all();

        // Create one deduction for each existing position
        foreach ($positions as $position) {
            Deduction::factory()
                ->state(['position_id' => $position->id])
                ->create();
        }

        // If you want additional random deductions, make sure positions exist
        if ($positions->isNotEmpty()) {
            Deduction::factory()
                ->count(5)
                ->lowSalary()
                ->state(function () use ($positions) {
                    return ['position_id' => $positions->random()->id];
                })
                ->create();

            Deduction::factory()
                ->count(5)
                ->mediumSalary()
                ->state(function () use ($positions) {
                    return ['position_id' => $positions->random()->id];
                })
                ->create();

            Deduction::factory()
                ->count(5)
                ->highSalary()
                ->state(function () use ($positions) {
                    return ['position_id' => $positions->random()->id];
                })
                ->create();

            // Specific test data
            Deduction::factory()
                ->withContributions(450.00, 225.00, 100.00)
                ->state([
                    'salary_rate' => 800.00,
                    'reg_overtime_rate' => 1000.00,
                    'special_overtime_rate' => 1040.00,
                    'position_id' => $positions->random()->id,
                ])
                ->create();
        }
    }
}