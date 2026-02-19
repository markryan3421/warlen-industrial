<?php

namespace Database\Factories;

use App\Models\Position;
use Illuminate\Database\Eloquent\Factories\Factory;

class PositionFactory extends Factory
{
    protected $model = Position::class;

    public function definition(): array
    {
        $positionNames = [
            'Software Engineer',
            'Senior Software Engineer',
            'Junior Software Engineer',
            'QA Tester',
            'Project Manager',
            'UI/UX Designer',
            'System Administrator',
            'Database Administrator',
            'DevOps Engineer',
            'IT Support Specialist',
            'Network Engineer',
            'Business Analyst',
            'Product Manager',
            'Scrum Master',
            'Technical Lead',
            'Chief Technology Officer',
            'HR Manager',
            'HR Associate',
            'Accountant',
            'Finance Manager',
            'Marketing Specialist',
            'Sales Representative',
            'Customer Support Representative',
            'Administrative Assistant',
            'Office Manager',
            'Operations Manager',
            'Data Analyst',
            'Security Specialist',
            'Content Writer',
            'Social Media Manager',
        ];

        return [
            // Remove unique() to avoid the error
            'pos_name' => $this->faker->randomElement($positionNames),
            'created_at' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'updated_at' => function (array $attributes) {
                return $this->faker->dateTimeBetween($attributes['created_at'], 'now');
            },
        ];
    }

    // If you really need unique positions, use this method instead
    public function uniqueName()
    {
        return $this->state(function (array $attributes) {
            static $usedNames = [];
            
            $positionNames = [
                'Software Engineer',
                'Senior Software Engineer',
                'Junior Software Engineer',
                // ... rest of your names
            ];
            
            $availableNames = array_diff($positionNames, $usedNames);
            
            if (empty($availableNames)) {
                // If no unique names left, append a number
                $name = $positionNames[array_rand($positionNames)] . ' ' . (count($usedNames) + 1);
            } else {
                $name = $this->faker->randomElement($availableNames);
            }
            
            $usedNames[] = $name;
            
            return ['pos_name' => $name];
        });
    }

    // Alternative: Use fake job titles from faker
    public function fakerJobTitle()
    {
        return $this->state(function (array $attributes) {
            return [
                'pos_name' => $this->faker->jobTitle(),
            ];
        });
    }

    // Engineering positions
    public function engineering()
    {
        return $this->state(function (array $attributes) {
            return [
                'pos_name' => $this->faker->randomElement([
                    'Software Engineer',
                    'Senior Software Engineer',
                    'Junior Software Engineer',
                    'DevOps Engineer',
                    'Frontend Developer',
                    'Backend Developer',
                    'Full Stack Developer',
                    'Mobile Developer',
                ]),
            ];
        });
    }

    // IT positions
    public function informationTechnology()
    {
        return $this->state(function (array $attributes) {
            return [
                'pos_name' => $this->faker->randomElement([
                    'System Administrator',
                    'Network Engineer',
                    'IT Support Specialist',
                    'Database Administrator',
                    'Security Specialist',
                    'Cloud Engineer',
                ]),
            ];
        });
    }

    // Management positions
    public function management()
    {
        return $this->state(function (array $attributes) {
            return [
                'pos_name' => $this->faker->randomElement([
                    'Project Manager',
                    'Product Manager',
                    'Technical Lead',
                    'Department Head',
                    'Operations Manager',
                    'Team Lead',
                ]),
            ];
        });
    }

    // HR positions
    public function humanResources()
    {
        return $this->state(function (array $attributes) {
            return [
                'pos_name' => $this->faker->randomElement([
                    'HR Manager',
                    'HR Associate',
                    'HR Specialist',
                    'Recruiter',
                    'Training Coordinator',
                    'Payroll Specialist',
                ]),
            ];
        });
    }

    // Finance positions
    public function finance()
    {
        return $this->state(function (array $attributes) {
            return [
                'pos_name' => $this->faker->randomElement([
                    'Accountant',
                    'Finance Manager',
                    'Financial Analyst',
                    'Bookkeeper',
                    'Auditor',
                    'Budget Analyst',
                ]),
            ];
        });
    }

    // Marketing positions
    public function marketing()
    {
        return $this->state(function (array $attributes) {
            return [
                'pos_name' => $this->faker->randomElement([
                    'Marketing Specialist',
                    'Marketing Manager',
                    'Content Writer',
                    'Social Media Manager',
                    'SEO Specialist',
                    'Graphic Designer',
                ]),
            ];
        });
    }

    // Sales positions
    public function sales()
    {
        return $this->state(function (array $attributes) {
            return [
                'pos_name' => $this->faker->randomElement([
                    'Sales Representative',
                    'Sales Manager',
                    'Account Executive',
                    'Business Development Specialist',
                    'Sales Associate',
                ]),
            ];
        });
    }

    // Customer Support positions
    public function customerSupport()
    {
        return $this->state(function (array $attributes) {
            return [
                'pos_name' => $this->faker->randomElement([
                    'Customer Support Representative',
                    'Customer Service Associate',
                    'Technical Support Specialist',
                    'Client Success Manager',
                ]),
            ];
        });
    }

    // Executive positions
    public function executive()
    {
        return $this->state(function (array $attributes) {
            return [
                'pos_name' => $this->faker->randomElement([
                    'Chief Technology Officer',
                    'Chief Executive Officer',
                    'Chief Financial Officer',
                    'Chief Operating Officer',
                    'Vice President',
                    'Director',
                ]),
            ];
        });
    }

    // Position with specific name
    public function withName(string $name)
    {
        return $this->state(function (array $attributes) use ($name) {
            return [
                'pos_name' => $name,
            ];
        });
    }
}