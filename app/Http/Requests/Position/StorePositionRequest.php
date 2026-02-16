<?php

namespace App\Http\Requests\Position;

use Illuminate\Foundation\Http\FormRequest;

class StorePositionRequest extends FormRequest
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
                'unique:positions,pos_name',
                'min:3'
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

    public function attributes(): array
    {
        return [
            'pos_name' => 'position name',
            'salary_rate' => 'salary rate',
            'reg_overtime_rate' => 'regular overtime rate',
            'special_overtime_rate' => 'special overtime rate',
            'sss_rate' => 'SSS rate',
            'philhealth_rate' => 'PhilHealth rate',
            'pagibig_rate' => 'Pag-IBIG rate',
        ];
    }
}
