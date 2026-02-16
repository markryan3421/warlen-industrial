<?php

namespace App\Http\Requests\Deduction;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeductionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
             'salary_rate' => [
                'required',
                'numeric',
                'min:550',
            ],

            'regular_overtime_rate' => [
                'required',
                'numeric',
                'min:0', // ma base sa rot 25%
            ],
            'special_overtime_rate' => [
                'required',
                'numeric',
                'min:0', // ma base sa sot 30%
            ],
            'sss_rate' => [
                'required',
                'numeric',
                'min:0',
            ],
            'philhealth_rate' => [
                'required',
                'numeric',
                'min:0',
            ],
            'pagibig_rate' => [
                'required',
                'numeric',
                'min:0',
            ],
             'position_id' => [
                'required',
                'exists:positions,'. $this->route('position_id')->id
            ],
        ];
    }
}
