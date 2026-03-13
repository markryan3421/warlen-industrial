<?php

namespace App\Services;

use App\Models\Employee;
use Illuminate\Support\Facades\Log;

class EmployeeLookupService
{
    private $employees = null;
    private $employeeMap = [];

    /**
     * Load all active employees and create a flexible mapping
     */
    public function loadEmployees(): void
    {
        if ($this->employees === null) {
            // Eager load the position relationship
            $this->employees = Employee::with(['user', 'position'])->where('employee_status', 'active')->get();

            // Create a more flexible mapping
            foreach ($this->employees as $emp) {
                // Store by emp_code
                $empCode = (string)$emp->emp_code;
                $this->employeeMap[$empCode] = $emp;

                // Also store by employee_number if available
                if (!empty($emp->employee_number)) {
                    $empNumber = (string)$emp->employee_number;
                    $this->employeeMap[$empNumber] = $emp;
                }

                // Store by the last 3-4 digits (in case attendance uses partial codes)
                if (strlen($empCode) >= 3) {
                    $last3 = substr($empCode, -3);
                    $last4 = substr($empCode, -4);
                    $this->employeeMap[$last3] = $emp;
                    $this->employeeMap[$last4] = $emp;
                }

                // Store by employee name parts if available
                if ($emp->user && !empty($emp->user->name)) {
                    $nameParts = explode(' ', $emp->user->name);
                    foreach ($nameParts as $part) {
                        if (strlen($part) > 2) {
                            $this->employeeMap[strtolower($part)] = $emp;
                        }
                    }
                }
            }

            Log::info("Loaded " . count($this->employees) . " employees with flexible mapping");
        }
    }

    /**
     * Find employee by identifier using multiple strategies
     */
    public function findEmployee(string $identifier, ?string $employeeName = null): ?Employee
    {
        $this->loadEmployees();
        
        $identifier = trim($identifier);
        $originalIdentifier = $identifier;
        $employee = null;

        // Strategy 1: Direct match
        if (isset($this->employeeMap[$identifier])) {
            $employee = $this->employeeMap[$identifier];
            Log::info("Found employee by direct match: {$identifier}");
        }
        // Strategy 2: Try as integer (remove leading zeros)
        elseif (is_numeric($identifier)) {
            $asInt = (int)$identifier;
            $asIntStr = (string)$asInt;
            if (isset($this->employeeMap[$asIntStr])) {
                $employee = $this->employeeMap[$asIntStr];
                Log::info("Found employee by integer conversion: {$asIntStr}");
            }
        }
        // Strategy 3: Try to find by partial match in employee codes
        else {
            foreach ($this->employeeMap as $code => $emp) {
                // Check if identifier contains the code or vice versa
                if (strpos((string)$code, $identifier) !== false || strpos($identifier, (string)$code) !== false) {
                    $employee = $emp;
                    Log::info("Found employee by partial match: {$code} matches identifier {$identifier}");
                    break;
                }
            }
        }

        if (!$employee && !empty($employeeName)) {
            // Last resort: try to find by name from the stats
            $nameIdentifier = strtolower(trim($employeeName));
            foreach ($this->employeeMap as $code => $emp) {
                if ($emp->user && !empty($emp->user->name) && strpos(strtolower($emp->user->name), $nameIdentifier) !== false) {
                    $employee = $emp;
                    Log::info("Found employee by name match: {$emp->user->name} matches {$employeeName}");
                    break;
                }
            }
        }

        if (!$employee) {
            Log::warning("Could not find employee for identifier: '{$originalIdentifier}' (name: " . ($employeeName ?? 'N/A') . ")");
        }

        return $employee;
    }
}