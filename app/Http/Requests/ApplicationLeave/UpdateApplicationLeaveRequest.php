<?php

namespace App\Http\Requests\ApplicationLeave;

use App\Enums\ApplicationLeaveEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationLeaveRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 'leave_start' => 'required|date|after_or_equal:today',
            // 'leave_end' => 'required|date|after:leave_start',
            // 'reason_to_leave' => 'required|string|max:1000',
            'remarks' => 'nullable|string|max:1000',
            'app_status' => ['required', Rule::enum(ApplicationLeaveEnum::class)],
        ];
    }
}
