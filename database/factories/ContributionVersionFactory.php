<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ContributionVersion>
 */
class ContributionVersionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $effectiveFrom = $this->faker->dateTimeBetween('-3 years', 'now');
        $effectiveTo   = $this->faker->optional(0.7)->dateTimeBetween($effectiveFrom, '+2 years');
    
        return [
            'type'           => $this->faker->randomElement(['sss', 'philhealth', 'pagibig']),
            'effective_from' => $effectiveFrom->format('Y-m-d'),
            'effective_to'   => $effectiveTo ? $effectiveTo->format('Y-m-d') : null,
        ];
    }
}
