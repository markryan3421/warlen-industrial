<?php

namespace Database\Seeders;

use App\Models\ContributionVersion;
use App\Models\ContributionBracket;
use Illuminate\Database\Seeder;

class ContributionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Based on SSS Contribution Table effective January 2025
     * RA 11199 (Social Security Act of 2018)
     * Contribution Rate: 15%
     * Minimum MSC: ₱5,000.00
     * Maximum MSC: ₱35,000.00
     */
    public function run(): void
    {
        // Create SSS Contribution Version
        $sssVersion = ContributionVersion::updateOrCreate(
            ['type' => 'sss'],
            [
                'type' => 'sss',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // Clear existing brackets to avoid duplicates
        ContributionBracket::where('contribution_version_id', $sssVersion->id)->delete();

        // SSS Contribution Brackets based on the PDF
        $brackets = [
            // Range: Below 5,250 -> MSC: 5,000.00
            [
                'salary_from' => 0,
                'salary_to' => 5249.99,
                'employee_share' => 250.00,    // 5% of 5,000
                'employer_share' => 510.00,     // 10.2% of 5,000 (but total is 760, employee 250)
                // Note: Total contribution = 760 (500 SS + 10 EC + 250 MPF?)
                // Based on table: REGULAR SS = 500, EC = 10, MPF = 250, TOTAL = 760
            ],
            [
                'salary_from' => 5250,
                'salary_to' => 5749.99,
                'employee_share' => 275.00,
                'employer_share' => 560.00,
            ],
            [
                'salary_from' => 5750,
                'salary_to' => 6249.99,
                'employee_share' => 300.00,
                'employer_share' => 610.00,
            ],
            [
                'salary_from' => 6250,
                'salary_to' => 6749.99,
                'employee_share' => 325.00,
                'employer_share' => 660.00,
            ],
            [
                'salary_from' => 6750,
                'salary_to' => 7249.99,
                'employee_share' => 350.00,
                'employer_share' => 710.00,
            ],
            [
                'salary_from' => 7250,
                'salary_to' => 7749.99,
                'employee_share' => 375.00,
                'employer_share' => 760.00,
            ],
            [
                'salary_from' => 7750,
                'salary_to' => 8249.99,
                'employee_share' => 400.00,
                'employer_share' => 810.00,
            ],
            [
                'salary_from' => 8250,
                'salary_to' => 8749.99,
                'employee_share' => 425.00,
                'employer_share' => 860.00,
            ],
            [
                'salary_from' => 8750,
                'salary_to' => 9249.99,
                'employee_share' => 450.00,
                'employer_share' => 910.00,
            ],
            [
                'salary_from' => 9250,
                'salary_to' => 9749.99,
                'employee_share' => 475.00,
                'employer_share' => 960.00,
            ],
            [
                'salary_from' => 9750,
                'salary_to' => 10249.99,
                'employee_share' => 500.00,
                'employer_share' => 1010.00,
            ],
            [
                'salary_from' => 10250,
                'salary_to' => 10749.99,
                'employee_share' => 525.00,
                'employer_share' => 1060.00,
            ],
            [
                'salary_from' => 10750,
                'salary_to' => 11249.99,
                'employee_share' => 550.00,
                'employer_share' => 1110.00,
            ],
            [
                'salary_from' => 11250,
                'salary_to' => 11749.99,
                'employee_share' => 575.00,
                'employer_share' => 1160.00,
            ],
            [
                'salary_from' => 11750,
                'salary_to' => 12249.99,
                'employee_share' => 600.00,
                'employer_share' => 1210.00,
            ],
            [
                'salary_from' => 12250,
                'salary_to' => 12749.99,
                'employee_share' => 625.00,
                'employer_share' => 1260.00,
            ],
            [
                'salary_from' => 12750,
                'salary_to' => 13249.99,
                'employee_share' => 650.00,
                'employer_share' => 1310.00,
            ],
            [
                'salary_from' => 13250,
                'salary_to' => 13749.99,
                'employee_share' => 675.00,
                'employer_share' => 1360.00,
            ],
            [
                'salary_from' => 13750,
                'salary_to' => 14249.99,
                'employee_share' => 700.00,
                'employer_share' => 1410.00,
            ],
            [
                'salary_from' => 14250,
                'salary_to' => 14749.99,
                'employee_share' => 725.00,
                'employer_share' => 1460.00,
            ],
            [
                'salary_from' => 14750,
                'salary_to' => 15249.99,
                'employee_share' => 750.00,
                'employer_share' => 1530.00,
            ],
            [
                'salary_from' => 15250,
                'salary_to' => 15749.99,
                'employee_share' => 800.00,
                'employer_share' => 1630.00,
            ],
            [
                'salary_from' => 15750,
                'salary_to' => 16249.99,
                'employee_share' => 825.00,
                'employer_share' => 1680.00,
            ],
            [
                'salary_from' => 16250,
                'salary_to' => 16749.99,
                'employee_share' => 850.00,
                'employer_share' => 1730.00,
            ],
            [
                'salary_from' => 16750,
                'salary_to' => 17249.99,
                'employee_share' => 875.00,
                'employer_share' => 1780.00,
            ],
            [
                'salary_from' => 17250,
                'salary_to' => 17749.99,
                'employee_share' => 900.00,
                'employer_share' => 1830.00,
            ],
            [
                'salary_from' => 17750,
                'salary_to' => 18249.99,
                'employee_share' => 925.00,
                'employer_share' => 1880.00,
            ],
            [
                'salary_from' => 18250,
                'salary_to' => 18749.99,
                'employee_share' => 950.00,
                'employer_share' => 1930.00,
            ],
            [
                'salary_from' => 18750,
                'salary_to' => 19249.99,
                'employee_share' => 975.00,
                'employer_share' => 1980.00,
            ],
            [
                'salary_from' => 19250,
                'salary_to' => 19749.99,
                'employee_share' => 975.00,    // Note: Check if correct
                'employer_share' => 1980.00,
            ],
            [
                'salary_from' => 19750,
                'salary_to' => 20249.99,
                'employee_share' => 1000.00,
                'employer_share' => 2030.00,
            ],
            // For salaries above 20,250 with MPF contributions
            [
                'salary_from' => 20250,
                'salary_to' => 20749.99,
                'employee_share' => 1025.00,   // Regular SS employee share
                'employer_share' => 2080.00,    // Regular SS + EC employer share (2000 + 30 = 2030? Actually 2080 total)
                // Note: MPF adds 25 employee, 500 employer
            ],
            [
                'salary_from' => 20750,
                'salary_to' => 21249.99,
                'employee_share' => 1050.00,
                'employer_share' => 2130.00,
            ],
            [
                'salary_from' => 21250,
                'salary_to' => 21749.99,
                'employee_share' => 1075.00,
                'employer_share' => 2180.00,
            ],
            [
                'salary_from' => 21750,
                'salary_to' => 22249.99,
                'employee_share' => 1100.00,
                'employer_share' => 2230.00,
            ],
            [
                'salary_from' => 22250,
                'salary_to' => 22749.99,
                'employee_share' => 1125.00,
                'employer_share' => 2280.00,
            ],
            [
                'salary_from' => 22750,
                'salary_to' => 23249.99,
                'employee_share' => 1150.00,
                'employer_share' => 2330.00,
            ],
            [
                'salary_from' => 23250,
                'salary_to' => 23749.99,
                'employee_share' => 1175.00,
                'employer_share' => 2380.00,
            ],
            [
                'salary_from' => 23750,
                'salary_to' => 24249.99,
                'employee_share' => 1200.00,
                'employer_share' => 2430.00,
            ],
            [
                'salary_from' => 24250,
                'salary_to' => 24749.99,
                'employee_share' => 1225.00,
                'employer_share' => 2480.00,
            ],
            [
                'salary_from' => 24750,
                'salary_to' => 25249.99,
                'employee_share' => 1250.00,
                'employer_share' => 2530.00,
            ],
            [
                'salary_from' => 25250,
                'salary_to' => 25749.99,
                'employee_share' => 1275.00,
                'employer_share' => 2580.00,
            ],
            [
                'salary_from' => 25750,
                'salary_to' => 26249.99,
                'employee_share' => 1300.00,
                'employer_share' => 2630.00,
            ],
            [
                'salary_from' => 26250,
                'salary_to' => 26749.99,
                'employee_share' => 1325.00,
                'employer_share' => 2680.00,
            ],
            [
                'salary_from' => 26750,
                'salary_to' => 27249.99,
                'employee_share' => 1350.00,
                'employer_share' => 2730.00,
            ],
            [
                'salary_from' => 27250,
                'salary_to' => 27749.99,
                'employee_share' => 1375.00,
                'employer_share' => 2780.00,
            ],
            [
                'salary_from' => 27750,
                'salary_to' => 28249.99,
                'employee_share' => 1400.00,
                'employer_share' => 2830.00,
            ],
            [
                'salary_from' => 28250,
                'salary_to' => 28749.99,
                'employee_share' => 1425.00,
                'employer_share' => 2880.00,
            ],
            [
                'salary_from' => 28750,
                'salary_to' => 29249.99,
                'employee_share' => 1450.00,
                'employer_share' => 2930.00,
            ],
            [
                'salary_from' => 29250,
                'salary_to' => 29749.99,
                'employee_share' => 1475.00,
                'employer_share' => 2980.00,
            ],
            [
                'salary_from' => 29750,
                'salary_to' => 30249.99,
                'employee_share' => 1500.00,
                'employer_share' => 3030.00,
            ],
            [
                'salary_from' => 30250,
                'salary_to' => 30749.99,
                'employee_share' => 1525.00,
                'employer_share' => 3080.00,
            ],
            [
                'salary_from' => 30750,
                'salary_to' => 31249.99,
                'employee_share' => 1550.00,
                'employer_share' => 3130.00,
            ],
            [
                'salary_from' => 31250,
                'salary_to' => 31749.99,
                'employee_share' => 1575.00,
                'employer_share' => 3180.00,
            ],
            [
                'salary_from' => 31750,
                'salary_to' => 32249.99,
                'employee_share' => 1600.00,
                'employer_share' => 3230.00,
            ],
            [
                'salary_from' => 32250,
                'salary_to' => 32749.99,
                'employee_share' => 1625.00,
                'employer_share' => 3280.00,
            ],
            [
                'salary_from' => 32750,
                'salary_to' => 33249.99,
                'employee_share' => 1650.00,
                'employer_share' => 3330.00,
            ],
            [
                'salary_from' => 33250,
                'salary_to' => 33749.99,
                'employee_share' => 1675.00,
                'employer_share' => 3380.00,
            ],
            [
                'salary_from' => 33750,
                'salary_to' => 34249.99,
                'employee_share' => 1700.00,
                'employer_share' => 3430.00,
            ],
            [
                'salary_from' => 34250,
                'salary_to' => 34749.99,
                'employee_share' => 1725.00,
                'employer_share' => 3480.00,
            ],
            [
                'salary_from' => 34750,
                'salary_to' => null,
                'employee_share' => 1750.00,
                'employer_share' => 3530.00,
            ],
            // Maximum bracket: 35,000 MSC
            
        ];

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
        $this->command->info('Total brackets created: ' . count($brackets));
    }
}