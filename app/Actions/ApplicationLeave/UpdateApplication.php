<?php

namespace App\Actions\ApplicationLeave;

use App\Models\Employee;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class UpdateApplication
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function updateApplicationLeave(array $data, $applicationLeave)
    {
        $employee = Employee::query()->with(['user'])->where('user_id', Auth::id())->firstOrFail();
        $applicationLeave->update([
            'slug_app' => Str::slug($employee->user->name),
            'leave_start' => $data['leave_start'],
            'leave_end' => $data['leave_end'],
            'reason_to_leave' => $data['reason_to_leave'],
            'is_approved' => $data['is_approved'],
            'remarks' => $data['remarks'],
        ]);
    }
}
