<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Branch>
 */
class BranchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $branchName = $this->faker->unique()->city() . ' branch';

        return [
            'branch_name'    => $branchName,
            'branch_slug'    => Str::slug($branchName),
            'branch_address' => $this->faker->address(),
        ];
    }
}
