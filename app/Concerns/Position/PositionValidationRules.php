<?php

namespace App\Concerns\Position;

use Illuminate\Validation\Rule;

trait PositionValidationRules
{
    protected function storePositionRules(): array
    {
        return [
            'pos_name' => 'required|unique:positions',
            'basic_salary' => 'required|min:0|max:9999999.99',
        ];
    }

    protected function updatePositionRules(): array
    {
        return [
            'pos_name' => [
                'required',
                Rule::unique('positions', 'pos_name')->ignore($this->position->id),
            ],
            'basic_salary' => 'required|numeric|min:0|max:9999999.99',

        ];
    }

    protected function positionAttributes(): array
    {
        return [
            'pos_name' => 'Position',
            'basic_salary' => 'Basic salary',
        ];
    }
}
