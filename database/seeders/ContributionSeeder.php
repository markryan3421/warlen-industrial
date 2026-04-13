<?php

namespace Database\Seeders;

use App\Models\ContributionVersion;
use App\Models\ContributionBracket;
use Illuminate\Database\Seeder;

class ContributionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // First, create or find the SSS contribution version
        $sssVersion = ContributionVersion::firstOrCreate(
            ['type' => 'sss'],
            [
                'type' => 'sss',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // Clear existing brackets for this version to avoid duplicates
        ContributionBracket::where('contribution_version_id', $sssVersion->id)->delete();

        // SSS Contribution brackets data
        $brackets = [
            ['salary_from' => 0, 'salary_to' => 5249.99, 'employee_share' => 250, 'employer_share' => 510],
            ['salary_from' => 5250, 'salary_to' => 5749.99, 'employee_share' => 275, 'employer_share' => 560],
            ['salary_from' => 5750, 'salary_to' => 6249.99, 'employee_share' => 300, 'employer_share' => 610],
            ['salary_from' => 6250, 'salary_to' => 6749.99, 'employee_share' => 325, 'employer_share' => 660],
            ['salary_from' => 6750, 'salary_to' => 7249.99, 'employee_share' => 350, 'employer_share' => 710],
            ['salary_from' => 7250, 'salary_to' => 7749.99, 'employee_share' => 375, 'employer_share' => 760],
            ['salary_from' => 7750, 'salary_to' => 8249.99, 'employee_share' => 400, 'employer_share' => 810],
            ['salary_from' => 8250, 'salary_to' => 8749.99, 'employee_share' => 425, 'employer_share' => 860],
            ['salary_from' => 8750, 'salary_to' => 9249.99, 'employee_share' => 450, 'employer_share' => 910],
            ['salary_from' => 9250, 'salary_to' => 9749.99, 'employee_share' => 475, 'employer_share' => 960],
            ['salary_from' => 9750, 'salary_to' => 10249.99, 'employee_share' => 500, 'employer_share' => 1010],
            ['salary_from' => 10250, 'salary_to' => 10749.99, 'employee_share' => 525, 'employer_share' => 1060],
            ['salary_from' => 10750, 'salary_to' => 11249.99, 'employee_share' => 550, 'employer_share' => 1110],
            ['salary_from' => 11250, 'salary_to' => 11749.99, 'employee_share' => 575, 'employer_share' => 1160],
            ['salary_from' => 11750, 'salary_to' => 12249.99, 'employee_share' => 600, 'employer_share' => 1210],
            ['salary_from' => 12250, 'salary_to' => 12749.99, 'employee_share' => 625, 'employer_share' => 1260],
            ['salary_from' => 12750, 'salary_to' => 13749.99, 'employee_share' => 650, 'employer_share' => 1310],
            ['salary_from' => 13750, 'salary_to' => 14249.99, 'employee_share' => 675, 'employer_share' => 1410],
            ['salary_from' => 14250, 'salary_to' => 14749.99, 'employee_share' => 725, 'employer_share' => 1460],
            ['salary_from' => 14750, 'salary_to' => 15249.99, 'employee_share' => 750, 'employer_share' => 1510],
            ['salary_from' => 15250, 'salary_to' => 15749.99, 'employee_share' => 775, 'employer_share' => 1560],
            ['salary_from' => 15750, 'salary_to' => 16249.99, 'employee_share' => 800, 'employer_share' => 1610],
            ['salary_from' => 16250, 'salary_to' => 16749.99, 'employee_share' => 825, 'employer_share' => 1660],
            ['salary_from' => 16750, 'salary_to' => 17249.99, 'employee_share' => 850, 'employer_share' => 1710],
            ['salary_from' => 17250, 'salary_to' => 17749.99, 'employee_share' => 875, 'employer_share' => 1760],
            ['salary_from' => 17750, 'salary_to' => 18249.99, 'employee_share' => 900, 'employer_share' => 1810],
            ['salary_from' => 18250, 'salary_to' => 18749.99, 'employee_share' => 925, 'employer_share' => 1860],
            ['salary_from' => 18750, 'salary_to' => 19249.99, 'employee_share' => 950, 'employer_share' => 1960],
            ['salary_from' => 19250, 'salary_to' => 19749.99, 'employee_share' => 1005, 'employer_share' => 2010],
            ['salary_from' => 19750, 'salary_to' => 20249.99, 'employee_share' => 1010, 'employer_share' => 2060],
            ['salary_from' => 20250, 'salary_to' => 20749.99, 'employee_share' => 1015, 'employer_share' => 2110],
            ['salary_from' => 20750, 'salary_to' => 21249.99, 'employee_share' => 1020, 'employer_share' => 2160],
            ['salary_from' => 21250, 'salary_to' => 21749.99, 'employee_share' => 1025, 'employer_share' => 2210],
            ['salary_from' => 21750, 'salary_to' => 22249.99, 'employee_share' => 1030, 'employer_share' => 2260],
            ['salary_from' => 22250, 'salary_to' => 22749.99, 'employee_share' => 1035, 'employer_share' => 2310],
            ['salary_from' => 22750, 'salary_to' => 23249.99, 'employee_share' => 1040, 'employer_share' => 2360],
            ['salary_from' => 23250, 'salary_to' => 23749.99, 'employee_share' => 1045, 'employer_share' => 2410],
            ['salary_from' => 23750, 'salary_to' => 24249.99, 'employee_share' => 1050, 'employer_share' => 2450],
            ['salary_from' => 24250, 'salary_to' => 24749.99, 'employee_share' => 1055, 'employer_share' => 2500],
            ['salary_from' => 24750, 'salary_to' => 9999999.99, 'employee_share' => 1060, 'employer_share' => 2550], // Changed to 9,999,999.99
        ];

        // Insert all brackets
        foreach ($brackets as $bracket) {
            ContributionBracket::create([
                'contribution_version_id' => $sssVersion->id,
                'salary_from' => $bracket['salary_from'],
                'salary_to' => $bracket['salary_to'],
                'employee_share' => $bracket['employee_share'],
                'employer_share' => $bracket['employer_share'],
            ]);
        }

        $this->command->info('SSS Contribution brackets seeded successfully!');
    }
}