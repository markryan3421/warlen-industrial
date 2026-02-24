<?php

namespace App\Actions\ApplicationLeave;

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
        $applicationLeave->update([
            'leave_start' => $data['leave_start'],
            'leave_end' => $data['leave_end'],
            'reason_to_leave' => $data['reason_to_leave'],
            'is_approved' => $data['is_approved'],
            'remarks' => $data['remarks'],
        ]);
    }
}
