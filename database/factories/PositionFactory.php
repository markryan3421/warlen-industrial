<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Position>
 */
class PositionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $positions = [
            'Electrical Engineer',
            'Civil Engineer',
            'HR Specialist',
            'Accountant',
            'Operations Supervisor',
            'Sales Representative',
            'IT Support Technician',
            'Branch Manager',
            'Mechanical Engineer',
            'Administrative Assistant',
        ];

        $posName = $this->faker->unique()->randomElement($positions);

        return [
            'pos_name'     => $posName,
            'basic_salary' => $this->faker->randomFloat(2, 15000, 120000),
            'pos_slug'     => Str::slug($posName),
        ];
    }
}
