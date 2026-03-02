<?php

namespace App\Actions\ApplicationLeave;

use App\Models\ApplicationLeave;
use App\Models\Employee;
use Illuminate\Support\Facades\App;
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

    public function updateApplicationLeave(array $data, ApplicationLeave $applicationLeave)
    {
        // $employee = Employee::query()->with(['user'])->where('user_id', Auth::id())->firstOrFail();

        $updateData = [
            'app_status' => $data['app_status'],
            'remarks' => $data['remarks'],
        ];

        if ($data['app_status'] == 'approved') {
            $updateData['approved_by'] = Auth::user()->name;
            $updateData['rejected_by'] = null;
        }

        if ($data['app_status'] == 'rejected') {
            $updateData['rejected_by'] = Auth::user()->name;
            $updateData['approved_by'] = null;
        }

        $applicationLeave->update($updateData);
    }
}
