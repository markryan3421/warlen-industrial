<?php

namespace App\Actions\ApplicationLeave;

use App\Models\ApplicationLeave;
use App\Models\Employee;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CreateNewApplication
{
    public function createNewApplicationLeave(array $data): ApplicationLeave
    {
        $employee = $this->getEmployee();

        return ApplicationLeave::create([
            'employee_id' => $this->getEmployeeId(),
            'slug_app' => Str::slug($employee->user->name . '-' . $employee->emp_code . '-' . now()),
            'leave_start' => $data['leave_start'],
            'leave_end' => $data['leave_end'],
            'reason_to_leave' => $data['reason_to_leave'],
        ]);
    }

    private function getEmployee(): Employee
    {
        return Employee::query()->where('user_id', Auth::id())->firstOrFail();
    }

    private function getEmployeeId(): int
    {
        $employee = Employee::query()->where('user_id', Auth::id())->firstOrFail();
        return $employee->id;
    }

    public function approvedLimit(): int
    {
        return $this->countApproved(Auth::id());
    }

    private function countApproved($userId): int
    {
        return ApplicationLeave::whereHas('employee', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->where('app_status', 'approved')
            ->whereYear('created_at', now()->year)
            ->count();
    }
}
