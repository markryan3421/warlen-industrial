<?php

namespace App\Console\Commands;

use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\Console\Command\Command as SymfonyCommand;

class UpdateEmployeeStatuses extends Command
{
    protected $signature = 'app:update-employee-statuses';
    
    protected $description = 'Update employee statuses based on contract dates';

    public function handle()
    {
        $this->info('Updating employee statuses...');
        
        // $today = Carbon::today();
        
        // // Set employees as active
        // $activated = Employee::whereNotNull('contract_start_date')
        //     ->whereNotNull('contract_end_date')
        //     ->where('contract_start_date', '<=', $today)
        //     ->where('contract_end_date', '>=', $today)
        //     ->where('employee_status', '!=', 'active')
        //     ->update(['employee_status' => 'active']);
        
        // // Set employees as inactive
        // $deactivated = Employee::where(function($query) use ($today) {
        //         $query->whereNull('contract_start_date')
        //             ->orWhereNull('contract_end_date')
        //             ->orWhere('contract_start_date', '>', $today)
        //             ->orWhere('contract_end_date', '<', $today);
        //     })
        //     ->where('employee_status', '!=', 'inactive')
        //     ->update(['employee_status' => 'inactive']);
        
        // // Clear the employees cache
        // Cache::forget('employees');
        
        // $this->info("Activated: {$activated} employees");
        // $this->info("Deactivated: {$deactivated} employees");
        // $this->info("Total updated: " . ($activated + $deactivated) . " employees");
        // $this->info("Employees cache cleared");
        
        // return SymfonyCommand::SUCCESS;
    }
}