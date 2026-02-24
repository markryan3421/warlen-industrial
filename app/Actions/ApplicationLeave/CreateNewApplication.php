<?php

namespace App\Actions\ApplicationLeave;

use App\Models\ApplicationLeave;
use App\Models\Employee;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CreateNewApplication
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function createNewApplicationLeave(array $data)
    {
        $employee = Employee::query()->with(['user'])->where('user_id', Auth::id())->firstOrFail();
        

        ApplicationLeave::create([
            'employee_id' => $this->getEmployeeId(),
            'slug_app' => Str::slug($employee->user->name),
            'leave_start' => $data['leave_start'],
            'leave_end' => $data['leave_end'],
            'reason_to_leave' => $data['reason_to_leave'],
            'is_approved' => false,
            'remarks' => null,
        ]);
    }

    private function getEmployeeId(): int
    {
        $employee = Employee::query()->where('user_id', Auth::id())->firstOrFail();
        return $employee->id;
    }
}
