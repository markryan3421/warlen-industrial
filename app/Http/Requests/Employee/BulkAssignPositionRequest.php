<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;

class BulkAssignPositionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:employees,id'],
            'position_id' => ['required', 'integer', 'exists:positions,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'Please select at least one employee.',
            'ids.*.exists' => 'One or more selected employees do not exist.',
            'position_id.required' => 'Please select a position to assign.',
            'position_id.exists' => 'The selected position is invalid.',
        ];
    }
}