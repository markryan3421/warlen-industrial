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
    /**
     * Create users data
     */
    private function createUsers(): array
    {
        $users = [
            // Original users
            [
                'name' => 'Jolisa',
                'email' => 'jolisa@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1100
            ],
            [
                'name' => 'John Eric Dumala',
                'email' => 'john.eric@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 244
            ],
            [
                'name' => 'Arman',
                'email' => 'arman@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1080
            ],
            [
                'name' => 'Lloyd',
                'email' => 'lloyd@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1077
            ],
            [
                'name' => 'Allan',
                'email' => 'allan@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1079
            ],
            [
                'name' => 'Marlon',
                'email' => 'marlon@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1031
            ],
            [
                'name' => 'Joven',
                'email' => 'joven@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1028
            ],
            [
                'name' => 'Francis',
                'email' => 'francis@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 309
            ],
            [
                'name' => 'Ana',
                'email' => 'ana@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 670
            ],
            [
                'name' => 'Rey',
                'email' => 'rey@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1211
            ],
            [
                'name' => 'Jonas',
                'email' => 'jonas@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1082
            ],
            [
                'name' => 'Eugenio',
                'email' => 'eugenio@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1209
            ],
            [
                'name' => 'Ferdinand',
                'email' => 'ferdinand@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1210
            ],
            [
                'name' => 'Jury',
                'email' => 'jury@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1174
            ],
            [
                'name' => 'Ruth',
                'email' => 'ruth@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1234
            ],
            [
                'name' => 'Ryan',
                'email' => 'ryan@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1212
            ],
            [
                'name' => 'Aubrey',
                'email' => 'aubrey@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1047
            ],
            [
                'name' => 'Arnel',
                'email' => 'arnel@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 787
            ],
            [
                'name' => 'Christoval',
                'email' => 'christoval@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1297
            ],
            [
                'name' => 'Philippe',
                'email' => 'philippe@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1120
            ],
            [
                'name' => 'Harold',
                'email' => 'harold@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 789
            ],

            // New employees from the ridge
            [
                'name' => 'AllanB',
                'email' => 'allanb@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1444
            ],
            [
                'name' => 'BenedictoG',
                'email' => 'benedictog@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1333
            ],
            [
                'name' => 'ErenioC',
                'email' => 'erenioc@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1222
            ],
            [
                'name' => 'RyanJayT',
                'email' => 'ryanjayt@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1111
            ],
            [
                'name' => 'DanteM',
                'email' => 'dantem@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1191
            ],
            [
                'name' => 'EdwinJ',
                'email' => 'edwinj@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1262
            ],
            [
                'name' => 'PauloJ',
                'email' => 'pauloj@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1269
            ],
            [
                'name' => 'JohRobertL',
                'email' => 'johrobertl@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1266
            ],
            [
                'name' => 'RichardG',
                'email' => 'richardg@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1284
            ],
            [
                'name' => 'DaniloG',
                'email' => 'danilog@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1034
            ],
            [
                'name' => 'JoebertD',
                'email' => 'joebertd@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 857
            ],
            [
                'name' => 'JuluwieV',
                'email' => 'juluwiev@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 754
            ],
            [
                'name' => 'LhenieJaneS',
                'email' => 'lheniejanes@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1272
            ],
            [
                'name' => 'IrishSandraB',
                'email' => 'irishsandrab@example.com',
                'password' => Hash::make('12345678'),
                'emp_id' => 1264
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
            'slug_emp' => Str::slug($user->name . '-' . $empId),
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
