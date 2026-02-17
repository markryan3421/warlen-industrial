<?php

namespace App\Concerns\Branch;

use Illuminate\Validation\Rule;

trait BranchValidationRules
{
    protected function storeRules(): array
    {
        return [
            'branch_name' => [
                'required',
                'string',
                'max:255',
                'unique:branch_or_sites,branch_name'
            ],
            'branch_address' => [
                'required',
                'string',
                'max:255',
            ],
        ];
    }

    protected function updateRules(): array
    {
        return [
            'branch_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('branch_or_sites', 'branch_name')->ignore($this->route('branch'))
            ],
            'branch_address' => [
                'required',
                'string',
                'max:255',
            ],
        ];
    }


}
