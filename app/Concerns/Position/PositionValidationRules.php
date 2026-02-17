<?php

namespace App\Concerns\Position;

use Illuminate\Validation\Rule;

trait PositionValidationRules
{
    protected function storeRules(): array
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

    protected function updateRules(): array
    {
        return [
            'pos_name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('positions', 'pos_name')->ignore($this->position->id),
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
}
