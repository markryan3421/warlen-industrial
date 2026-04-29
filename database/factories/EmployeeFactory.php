<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Position;
use App\Models\Site;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
{
    $contractStart = $this->faker->dateTimeBetween('-3 years', 'now');
    $contractEnd   = $this->faker->dateTimeBetween($contractStart, '+2 years');

    return [
        'position_id'              => Position::inRandomOrder()->first()?->id ?? Position::factory(),
        'branch_id'                => Branch::inRandomOrder()->first()?->id ?? Branch::factory(),
        'user_id'                  => User::factory(),
        'site_id'                  => Site::inRandomOrder()->first()?->id ?? Site::factory(),
        'slug_emp'                 => Str::slug('emp-' . $this->faker->unique()->uuid()),
        'employee_number'          => '0917' . $this->faker->unique()->numerify('#######'),
        'emp_code'                 => $this->faker->unique()->numerify('####'),
        'emergency_contact_number' => '0918' . $this->faker->unique()->numerify('#######'),
        'contract_start_date'      => $contractStart->format('Y-m-d'),
        'contract_end_date'        => $contractEnd->format('Y-m-d'),
        'pay_frequency'            => $this->faker->randomElement(['weekender', 'monthly', 'semi_monthly']),
        'employee_status'          => $this->faker->randomElement(['active', 'inactive']),
        'sss_number'               => $this->faker->unique()->numerify('##-#######-#'),
        'pagibig_number'           => $this->faker->unique()->numerify('####-####-####'),
        'philhealth_number'        => $this->faker->unique()->numerify('##-#########-#'),
    ];
}
}
