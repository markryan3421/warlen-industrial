<?php

namespace Database\Seeders;

use App\Models\Position;
use Illuminate\Database\Seeder;

class PositionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // First, create all core positions (these will be unique)
        $corePositions = [
            // Executive & Management
            'Chief Executive Officer',
            'Chief Technology Officer',
            'Chief Financial Officer',
            'Chief Operating Officer',
            'Operations Manager',
            'Project Manager',
            'Product Manager',
            
            // Engineering & IT
            'Software Engineer',
            'Senior Software Engineer',
            'Junior Software Engineer',
            'QA Tester',
            'DevOps Engineer',
            'System Administrator',
            'Database Administrator',
            'IT Support Specialist',
            'Network Engineer',
            'Frontend Developer',
            'Backend Developer',
            'Full Stack Developer',
            'Mobile Developer',
            'Security Specialist',
            
            // Design
            'UI/UX Designer',
            'Graphic Designer',
            
            // Data
            'Data Analyst',
            'Data Scientist',
            'Business Analyst',
            
            // Human Resources
            'HR Manager',
            'HR Associate',
            'Recruiter',
            'Training Coordinator',
            'Payroll Specialist',
            
            // Finance
            'Accountant',
            'Finance Manager',
            'Financial Analyst',
            'Bookkeeper',
            
            // Marketing
            'Marketing Manager',
            'Marketing Specialist',
            'Content Writer',
            'Social Media Manager',
            'SEO Specialist',
            
            // Sales
            'Sales Manager',
            'Sales Representative',
            'Account Executive',
            'Business Development Specialist',
            
            // Customer Support
            'Customer Support Representative',
            'Customer Service Associate',
            'Technical Support Specialist',
            'Client Success Manager',
            
            // Administrative
            'Administrative Assistant',
            'Office Manager',
            'Receptionist',
        ];

        foreach ($corePositions as $posName) {
            Position::factory()
                ->withName($posName)
                ->create();
        }

        // Now create additional positions (these may have duplicates, which is fine)
        // Use faker job titles for more variety instead of limited array
        
        // Create 20 random positions using faker job titles
        for ($i = 0; $i < 20; $i++) {
            Position::factory()
                ->fakerJobTitle()
                ->create();
        }

        // Or if you want department-specific positions with potential duplicates:
        $departments = [
            'engineering' => 5,
            'informationTechnology' => 3,
            'management' => 3,
            'humanResources' => 2,
            'finance' => 2,
            'marketing' => 2,
            'sales' => 2,
            'customerSupport' => 2,
            'executive' => 2,
        ];

        foreach ($departments as $method => $count) {
            Position::factory()
                ->count($count)
                ->$method()
                ->create();
        }

        // Output count
        $count = Position::count();
        $this->command->info("✅ Created {$count} positions successfully.");
    }
}