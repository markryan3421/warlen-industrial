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

        $employeeNumber = strtoupper(Str::random(3)) . '-' . $this->faker->unique()->numerify('######');

        return [
            'position_id'              => Position::inRandomOrder()->first()?->id ?? Position::factory(),
            'branch_id'                => Branch::inRandomOrder()->first()?->id ?? Branch::factory(),
            'user_id'                  => User::factory(),
            'site_id'                  => Site::inRandomOrder()->first()?->id ?? Site::factory(),
            'slug_emp'                 => Str::slug('emp-' . $this->faker->unique()->uuid()),
            'employee_number'          => $employeeNumber,
            'emp_code'                 => $this->faker->unique()->numerify('####'),
            'emergency_contact_number' => $this->faker->phoneNumber(),
            'contract_start_date'      => $contractStart->format('Y-m-d'),
            'contract_end_date'        => $contractEnd->format('Y-m-d'),
            'pay_frequency'            => $this->faker->randomElement(['weekender', 'monthly', 'semi_monthly']),
            'employee_status'          => $this->faker->randomElement(['active', 'inactive']),
        ];
    }
}
