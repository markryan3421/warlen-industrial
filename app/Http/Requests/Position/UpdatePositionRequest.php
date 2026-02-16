<?php

namespace App\Http\Requests\Position;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePositionRequest extends FormRequest
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
            'pos_name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('positions', 'pos_name')->ignore($this->position->id),
                'min:5'
            ],
            'salary_rate' => [
                'required',
                'numeric',
                //'min:0',
                //'regex:/^\d+(\.\d{1,2})?$/'
            ],
            'reg_overtime_rate' => [
                'required',
                'numeric',
                // 'min:0',
                //'regex:/^\d+(\.\d{1,2})?$/'
            ],
            'special_overtime_rate' => [
                'required',
                'numeric',
                //'min:0',
                //'regex:/^\d+(\.\d{1,2})?$/'
            ],
            'sss_rate' => [
                'required',
                'numeric',
                //'min:0',
                // 'max:100',
                // 'regex:/^\d+(\.\d{1,2})?$/'
            ],
            'philhealth_rate' => [
                'required',
                'numeric',
                // 'min:0',
                //'max:100',
                //'regex:/^\d+(\.\d{1,2})?$/'
            ],
            'pagibig_rate' => [
                'required',
                'numeric',
                //'min:0',
                // 'max:100',
                //'regex:/^\d+(\.\d{1,2})?$/'
            ],
        ];
    }
}
