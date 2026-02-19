<?php

namespace Database\Seeders;

use App\Models\Deduction;
use App\Models\Position;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DeductionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all positions
        $positions = Position::all();

        if ($positions->isEmpty()) {
            // If no positions exist, create some sample positions first
            $this->call(PositionSeeder::class); // Make sure you have a PositionSeeder
            $positions = Position::all();
        }

        // Create salary rates for each position
        foreach ($positions as $position) {
            Deduction::factory()
                ->state([
                    'position_id' => $position->id,
                ])
                ->create();
        }

        // Alternative: Create additional salary rates with variations
        Deduction::factory()
            ->count(5)
            ->lowSalary()
            ->withExistingPositions()
            ->create();

        Deduction::factory()
            ->count(5)
            ->mediumSalary()
            ->withExistingPositions()
            ->create();

        Deduction::factory()
            ->count(5)
            ->highSalary()
            ->withExistingPositions()
            ->create();

        // Create specific test data
        Deduction::factory()
            ->withContributions(450.00, 225.00, 100.00)
            ->state([
                'salary_rate' => 800.00,
                'reg_overtime_rate' => 1000.00,
                'special_overtime_rate' => 1040.00,
            ])
            ->withExistingPositions()
            ->create();
    }
}
