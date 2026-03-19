<?php

namespace App\Concerns\Position;

use Illuminate\Validation\Rule;

trait PositionValidationRules
{
    protected function storePositionRules(): array
    {
        return [
            'pos_name' => 'required|unique:positions|string|regex:/^[a-zA-Z\s\'-]+$/|min:3|max:80',
            'basic_salary' => 'required|numeric|min:550|max:9999999.99',
        ];
    }

    protected function updatePositionRules(): array
    {
        return [
            'pos_name' => [
                'required',
                'string',
                'min:3',
                'max:80',
                'regex:/^[a-zA-Z\s\'-]+$/',
                Rule::unique('positions', 'pos_name')->ignore($this->position->id),
            ],
            'basic_salary' => 'required|numeric|min:550|max:9999999.99'

        ];
    }

    protected function positionAttributes(): array
    {
        return [
            'pos_name' => 'position',
            'basic_salary' => 'basic salary',
        ];
    }

    protected function positionMessages(): array
    {
        return [
            // Position name messages
            'pos_name.required' => 'The position name is required. Please enter a valid position title.',
            'pos_name.unique' => 'This position name already exists. Please use a different name.',

            // Basic salary messages
            'basic_salary.required' => 'The basic salary field is required. Please specify the salary amount.',
            'basic_salary.numeric' => 'The basic salary must be a valid number. Please enter a numeric value.',
            'basic_salary.min' => 'The basic salary must be at least :min. Please enter an amount greater than or equal to ₱550.',
            'basic_salary.max' => 'The basic salary cannot exceed :max. Please enter a valid amount.',
        ];
    }
}
