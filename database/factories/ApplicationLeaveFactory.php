<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ApplicationLeave>
 */
class ApplicationLeaveFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $leaveStart = $this->faker->dateTimeBetween('-1 year', '+1 month');
        $leaveEnd   = $this->faker->dateTimeBetween($leaveStart, (clone $leaveStart)->modify('+14 days'));

        return [
            'employee_id'    => Employee::inRandomOrder()->first()?->id ?? Employee::factory(),
            'slug_app'       => Str::slug('leave-' . $this->faker->unique()->uuid()),
            'leave_start'    => $leaveStart->format('Y-m-d'),
            'leave_end'      => $leaveEnd->format('Y-m-d'),
            'reason_to_leave'=> $this->faker->paragraph(),
            'app_status'     => $this->faker->randomElement(['pending', 'approved', 'rejected']),
            'remarks'        => $this->faker->optional()->sentence(),
        ];
    }
}
