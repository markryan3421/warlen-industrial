<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PositionFactory extends Factory
{
    public function definition(): array
    {
        $posName = $this->faker->unique()->jobTitle(); // large variety of titles
        return [
            'pos_name'     => $posName,
            'basic_salary' => $this->faker->randomFloat(2, 15000, 120000),
            'pos_slug'     => Str::slug($posName) . '-' . $this->faker->unique()->numberBetween(1, 9999),
        ];
    }
}