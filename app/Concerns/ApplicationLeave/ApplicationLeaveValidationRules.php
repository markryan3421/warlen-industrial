<?php

namespace App\Concerns\ApplicationLeave;

use App\Enums\ApplicationLeaveEnum;
use Illuminate\Validation\Rule;

trait ApplicationLeaveValidationRules
{
    protected function applicationLeaveStoreRules(): array
    {
        return [
            'leave_start' => 'required|date|after_or_equal:today',
            'leave_end' => 'required|date|after_or_equal:leave_start',
            'reason_to_leave' => 'required|string|max:1000',
            'remarks' => 'nullable|string|max:1000',
        ];
    }

    protected function applicationLeaveUpdateRules(): array
    {
        return [
            'remarks' => 'nullable|string|max:1000',
            'app_status' => ['required', Rule::enum(ApplicationLeaveEnum::class)],
        ];
    }

    protected function applicatiobLeaveAttributes(): array
    {
        return [
            'leave_start' => 'leave start',
            'leave_end' => 'leave end',
            'reason_to_leave' => 'reason for leave',
            'remarks' => 'remarks',
        ];
    }
}
