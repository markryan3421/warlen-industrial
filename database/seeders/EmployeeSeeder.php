<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Position;
use App\Models\Employee;
use App\Models\User;
use App\Models\Site;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class EmployeeSeeder extends Seeder
{
    /**
     * Generate a unique 11-digit employee number starting with 9
     */
    private function generateEmployeeNumber(): string
    {
        do {
            $number = '9' . str_pad(rand(0, 9999999999), 10, '0', STR_PAD_LEFT);
        } while (Employee::where('employee_number', $number)->exists());

        return $number;
    }

    /**
     * Create or get branch
     */
    private function getBranch(): Branch
    {
        return Branch::firstOrCreate(
            ['branch_name' => 'Bacolod branch'],
            [
                'branch_slug' => Str::slug('Bacolod branch'),
                'branch_address' => 'Alijis'
            ]
        );
    }

    /**
     * Create or get position
     */
    private function getPosition(): Position
    {
        return Position::firstOrCreate(
            ['pos_name' => 'Regular employee'],
            [
                'pos_slug' => Str::slug('Regular employee'),
                'basic_salary' => 550
            ]
        );
    }

    /**
     * Create or get site
     */
    private function getSite(Branch $branch): Site
    {
        return Site::firstOrCreate(
            ['site_name' => 'UPHD', 'branch_id' => $branch->id],
            ['branch_id' => $branch->id]
        );
    }

    /**
     * Get all users data
     */
    private function getUsersData(): array
    {
        return [
            // Admin Users
            ['name' => 'Warlito', 'email' => 'warlito@gmail.com', 'emp_id' => 1000, 'role' => 'admin'],
            ['name' => 'Elena', 'email' => 'elena@gmail.com', 'emp_id' => 1001, 'role' => 'admin'],
            
            // HR User
            ['name' => 'Jona', 'email' => 'jona@gmail.com', 'emp_id' => 2222, 'role' => 'hr_head'],
            ['name' => 'Rica', 'email' => 'rica@gmail.com', 'emp_id' => 3333, 'role' => 'hr_head'],
            
            // from uphd
            ['name' => 'Jolisa', 'email' => 'jolisa@example.com', 'emp_id' => 1100, 'role' => 'employee'],
            ['name' => 'John Eric Dumala', 'email' => 'john.eric@example.com', 'emp_id' => 244, 'role' => 'employee'],
            ['name' => 'Arman', 'email' => 'arman@example.com', 'emp_id' => 1080, 'role' => 'employee'],
            ['name' => 'Lloyd', 'email' => 'lloyd@example.com', 'emp_id' => 1077, 'role' => 'employee'],
            ['name' => 'Allan', 'email' => 'allan@example.com', 'emp_id' => 1079, 'role' => 'employee'],
            ['name' => 'Marlon', 'email' => 'marlon@example.com', 'emp_id' => 1031, 'role' => 'employee'],
            ['name' => 'Joven', 'email' => 'joven@example.com', 'emp_id' => 1028, 'role' => 'employee'],
            ['name' => 'Francis', 'email' => 'francis@example.com', 'emp_id' => 309, 'role' => 'employee'],
            ['name' => 'Ana', 'email' => 'ana@example.com', 'emp_id' => 670, 'role' => 'employee'],
            ['name' => 'Rey', 'email' => 'rey@example.com', 'emp_id' => 1211, 'role' => 'employee'],
            ['name' => 'Jonas', 'email' => 'jonas@example.com', 'emp_id' => 1082, 'role' => 'employee'],
            ['name' => 'Eugenio', 'email' => 'eugenio@example.com', 'emp_id' => 1209, 'role' => 'employee'],
            ['name' => 'Ferdinand', 'email' => 'ferdinand@example.com', 'emp_id' => 1210, 'role' => 'employee'],
            ['name' => 'Jury', 'email' => 'jury@example.com', 'emp_id' => 1174, 'role' => 'employee'],
            ['name' => 'Ruth', 'email' => 'ruth@example.com', 'emp_id' => 1234, 'role' => 'employee'],
            ['name' => 'Ryan', 'email' => 'ryan@example.com', 'emp_id' => 1212, 'role' => 'employee'],
            ['name' => 'Aubrey', 'email' => 'aubrey@example.com', 'emp_id' => 1047, 'role' => 'employee'],
            ['name' => 'Arnel', 'email' => 'arnel@example.com', 'emp_id' => 787, 'role' => 'employee'],
            ['name' => 'Christoval', 'email' => 'christoval@example.com', 'emp_id' => 1297, 'role' => 'employee'],
            ['name' => 'Philippe', 'email' => 'philippe@example.com', 'emp_id' => 1120, 'role' => 'employee'],
            ['name' => 'Harold', 'email' => 'harold@example.com', 'emp_id' => 789, 'role' => 'employee'],
            
            // from ridge
            ['name' => 'AllanB', 'email' => 'allanb@example.com', 'emp_id' => 1444, 'role' => 'employee'],
            ['name' => 'BenedictoG', 'email' => 'benedictog@example.com', 'emp_id' => 1333, 'role' => 'employee'],
            ['name' => 'ErenioC', 'email' => 'erenioc@example.com', 'emp_id' => 1222, 'role' => 'employee'],
            ['name' => 'RyanJayT', 'email' => 'ryanjayt@example.com', 'emp_id' => 1111, 'role' => 'employee'],
            ['name' => 'DanteM', 'email' => 'dantem@example.com', 'emp_id' => 1191, 'role' => 'employee'],
            ['name' => 'EdwinJ', 'email' => 'edwinj@example.com', 'emp_id' => 1262, 'role' => 'employee'],
            ['name' => 'PauloJ', 'email' => 'pauloj@example.com', 'emp_id' => 1269, 'role' => 'employee'],
            ['name' => 'JohRobertL', 'email' => 'johrobertl@example.com', 'emp_id' => 1266, 'role' => 'employee'],
            ['name' => 'RichardG', 'email' => 'richardg@example.com', 'emp_id' => 1284, 'role' => 'employee'],
            ['name' => 'DaniloG', 'email' => 'danilog@example.com', 'emp_id' => 1034, 'role' => 'employee'],
            ['name' => 'JoebertD', 'email' => 'joebertd@example.com', 'emp_id' => 857, 'role' => 'employee'],
            ['name' => 'JuluwieV', 'email' => 'juluwiev@example.com', 'emp_id' => 754, 'role' => 'employee'],
            ['name' => 'LhenieJaneS', 'email' => 'lheniejanes@example.com', 'emp_id' => 1272, 'role' => 'employee'],
            ['name' => 'IrishSandraB', 'email' => 'irishsandrab@example.com', 'emp_id' => 1264, 'role' => 'employee'],
        ];
    }

    /**
     * Create or get user with role
     */
    private function getOrCreateUser(array $userData, array $roles): User
    {
        $user = User::where('email', $userData['email'])->first();
        
        if (!$user) {
            $user = User::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make('12345678'),
                'email_verified_at' => now(),
            ]);
            
            $user->assignRole($roles[$userData['role']]);
        } elseif (!$user->hasRole($userData['role'])) {
            $user->assignRole($userData['role']);
        }
        
        return $user;
    }

    /**
     * Create employee record (exclude only admin users)
     */
    private function createEmployeeRecord(Position $position, User $user, Branch $branch, int $empId, ?Site $site = null): void
    {
        // Only skip if user is admin - HR and employees will get employee records
        if ($user->hasRole('admin')) {
            $this->command->info("Skipping employee record for admin: {$user->name} ({$user->email})");
            return;
        }
        
        Employee::firstOrCreate(
            ['user_id' => $user->id],
            [
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
            ]
        );
    }

    /**
     * Display statistics
     */
    private function displayStatistics(): void
    {
        $this->command->newLine();
        $this->command->info('========================================');
        $this->command->info('Employee Seeder completed successfully!');
        $this->command->info('========================================');
        $this->command->info("Admin users: " . User::role('admin')->count());
        $this->command->info("HR users: " . User::role('hr_head')->count());
        $this->command->info("Employee users: " . User::role('employee')->count());
        $this->command->info("Total employee records: " . Employee::count());
        $this->command->info('========================================');
        
        // List users by role
        $this->command->info("\nAdmin Users (No employee records):");
        foreach (User::role('admin')->get() as $admin) {
            $employeeRecord = Employee::where('user_id', $admin->id)->first();
            $hasEmployeeRecord = $employeeRecord ? '⚠️ Has employee record' : '✓ No employee record';
            $this->command->info("  - {$admin->name} ({$admin->email}) - {$hasEmployeeRecord}");
        }
        
        $this->command->info("\nHR Users (With employee records):");
        foreach (User::role('hr_head')->get() as $hr) {
            $employeeRecord = Employee::where('user_id', $hr->id)->first();
            $hasEmployeeRecord = $employeeRecord ? '✓ Has employee record' : '✗ Missing employee record';
            $this->command->info("  - {$hr->name} ({$hr->email}) - {$hasEmployeeRecord}");
        }
        
        $this->command->info("\nEmployee Users (first 5):");
        foreach (User::role('employee')->limit(5)->get() as $employee) {
            $employeeRecord = Employee::where('user_id', $employee->id)->first();
            $hasEmployeeRecord = $employeeRecord ? '✓' : '✗';
            $this->command->info("  - {$employee->name} ({$employee->email}) - Employee Record: {$hasEmployeeRecord}");
        }
        
        // Show only admins that were skipped
        $this->command->info("\nSkipped Users (Admins only):");
        $admins = User::role('admin')->get();
        if ($admins->count() > 0) {
            foreach ($admins as $admin) {
                $this->command->info("  - {$admin->name} ({$admin->email}) - Admin (No employee record created)");
            }
        } else {
            $this->command->info("  No admin users found");
        }
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles
        $roles = [
            'admin' => Role::firstOrCreate(['name' => 'admin']),
            'employee' => Role::firstOrCreate(['name' => 'employee']),
            'hr_head' => Role::firstOrCreate(['name' => 'hr_head']),
        ];
        
        $roleMap = [
            'admin' => $roles['admin'],
            'hr_head' => $roles['hr_head'],
            'employee' => $roles['employee'],
        ];

        // Create branch, position, and site
        $branch = $this->getBranch();
        $position = $this->getPosition();
        $site = $this->getSite($branch);

        $usersData = $this->getUsersData();
        $totalUsers = count($usersData);
        
        // Progress bar for creating users
        $this->command->info('Starting Employee Seeder...');
        $this->command->info("Total users to process: {$totalUsers}");
        $progressBar = $this->command->getOutput()->createProgressBar($totalUsers);
        $progressBar->start();

        $processedUsers = [];

        foreach ($usersData as $data) {
            $user = $this->getOrCreateUser($data, $roleMap);
            $processedUsers[] = ['user' => $user, 'emp_id' => $data['emp_id'], 'role' => $data['role']];
            $progressBar->advance();
        }
        
        $progressBar->finish();
        $this->command->newLine(2);
        
        // Create employee records (exclude only admin users)
        $this->command->info('Creating employee records (excluding admin users)...');
        
        // Count non-admin users for progress bar
        $nonAdminUsers = array_filter($processedUsers, function($item) {
            return $item['role'] !== 'admin';
        });
        
        $nonAdminCount = count($nonAdminUsers);
        $this->command->info("Creating employee records for {$nonAdminCount} non-admin users...");
        
        $employeeProgressBar = $this->command->getOutput()->createProgressBar($nonAdminCount);
        $employeeProgressBar->start();

        foreach ($processedUsers as $item) {
            $this->createEmployeeRecord($position, $item['user'], $branch, $item['emp_id'], $site);
            if ($item['role'] !== 'admin') {
                $employeeProgressBar->advance();
            }
        }
        
        $employeeProgressBar->finish();
        
        // Display statistics
        $this->displayStatistics();
    }
}