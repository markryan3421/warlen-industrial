<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Position;
use App\Models\Employee;
use App\Models\User;
use App\Models\Site;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmployeeSeeder extends Seeder
{
    /**
     * Generate a unique 11-digit employee number starting with 9
     */
    private function generateEmployeeNumber(): string
    {
        do {
            // Generate 11-digit number starting with 9
            // First digit is 9, remaining 10 digits are random
            $number = '9' . str_pad(rand(0, 9999999999), 10, '0', STR_PAD_LEFT);
        } while (Employee::where('employee_number', $number)->exists());

        return $number;
    }

    /**
     * Create branch
     */
    private function createBranch(): Branch
    {
        return Branch::create([
            'branch_name' => 'Bacolod branch',
            'branch_slug' => Str::slug('Bacolod branch'),
            'branch_address' => 'Alijis'
        ]);
    }

    /**
     * Create position
     */
    private function createPosition(): Position
    {
        return Position::create([
            'pos_name' => 'Regular employee',
            'pos_slug' => Str::slug('Regular employee'),
            'basic_salary' => 1000
        ]);
    }

    /**
     * Create site
     */
    private function createSite(Branch $branch): Site
    {
        return Site::create([
            'site_name' => 'UPHD',
            'branch_id' => $branch->id,
        ]);
    }

    /**
     * Create users data
     */
    private function createUsers(): array
    {
        $users = [
            // ID: 1100
            [
                'name' => 'Jolisa',
                'email' => 'jolisa@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1100
            ],
            // ID: 244
            [
                'name' => 'John Eric Dumala',
                'email' => 'john.eric@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 244
            ],
            // ID: 1080
            [
                'name' => 'Arman',
                'email' => 'arman@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1080
            ],
            // ID: 1077
            [
                'name' => 'Lloyd',
                'email' => 'lloyd@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1077
            ],
            // ID: 1079
            [
                'name' => 'Allan',
                'email' => 'allan@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1079
            ],
            // ID: 1031
            [
                'name' => 'Marlon',
                'email' => 'marlon@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1031
            ],
            // ID: 1028
            [
                'name' => 'Joven',
                'email' => 'joven@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1028
            ],
            // ID: 309
            [
                'name' => 'Francis',
                'email' => 'francis@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 309
            ],
            // ID: 670
            [
                'name' => 'Ana',
                'email' => 'ana@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 670
            ],
            // ID: 1211
            [
                'name' => 'Rey',
                'email' => 'rey@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1211
            ],
            // ID: 1082
            [
                'name' => 'Jonas',
                'email' => 'jonas@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1082
            ],
            // ID: 1209
            [
                'name' => 'Eugenio',
                'email' => 'eugenio@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1209
            ],
            // ID: 1210
            [
                'name' => 'Ferdinand',
                'email' => 'ferdinand@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1210
            ],
            // ID: 1174
            [
                'name' => 'Jury',
                'email' => 'jury@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1174
            ],
            // ID: 1234
            [
                'name' => 'Ruth',
                'email' => 'ruth@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1234
            ],
            // ID: 1212
            [
                'name' => 'Ryan',
                'email' => 'ryan@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1212
            ],
            // ID: 1047
            [
                'name' => 'Aubrey',
                'email' => 'aubrey@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1047
            ],
            // ID: 787
            [
                'name' => 'Arnel',
                'email' => 'arnel@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 787
            ],
            // ID: 1297
            [
                'name' => 'Christoval',
                'email' => 'christoval@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1297
            ],
            // ID: 1120
            [
                'name' => 'Philippe',
                'email' => 'philippe@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1120
            ],
            // ID: 789
            [
                'name' => 'Harold',
                'email' => 'harold@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 789
            ],
        ];

        return $users;
    }

    private function createEmployee(Position $position, User $user, Branch $branch, $empId, ?Site $site = null): Employee
    {
        return Employee::create([
            'position_id' => $position->id,
            'branch_id' => $branch->id,
            'user_id' => $user->id,
            'site_id' => $site?->id,
            'slug_emp' => Str::slug($user->name.'-'.$empId),
            'emp_code' => $empId,
            'employee_number' => $this->generateEmployeeNumber(),
            'contract_start_date' => now(),
            'contract_end_date' => now()->addYear(),
            'emergency_contact_number' => '09123456789',
            'pay_frequency' => 'weekender',
            'employee_status' => 'active',
        ]);
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branch = $this->createBranch();
        $position = $this->createPosition();
        $site = $this->createSite($branch);

        $users = $this->createUsers();
        $createdUsers = [];

        foreach ($users as $userData) {
            // Extract emp_id before creating user
            $empId = $userData['emp_id'];
            unset($userData['emp_id']);

            // Create user
            $user = User::create($userData);
            $createdUsers[] = [
                'user' => $user,
                'emp_id' => $empId
            ];

            // Assign role
            $user->assignRole('employee');
        }

        // Create employees using the created users
        foreach ($createdUsers as $item) {
            $user = $item['user'];
            $empId = $item['emp_id'];

            $this->createEmployee($position, $user, $branch, $empId, $site);
        }
    }
}
