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
                'unique:branches',
                'regex:/^[a-zA-Z0-9\s\-_\.&,()@]+$/',
            ],
            'branch_address' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-zA-Z0-9\s\-_\.&,()@]+$/',
            ],
            'sites' => 'sometimes|array',
            'sites.*.site_name' => [
                'required_with:sites',
                'string',
                'max:255',
                'regex:/^[a-zA-Z0-9\s\-_\.&,()@]+$/',
                function ($attribute, $value, $fail) {
                    $sites = request('sites');
                    $siteNames = array_column($sites, 'site_name');
                    if (count(array_unique($siteNames)) !== count($siteNames)) {
                        $fail('Site names must be unique within the branch.');
                    }
                },
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
                'regex:/^[a-zA-Z0-9\s\-_\.&,()@]+$/',
                Rule::unique('branches', 'branch_name')->ignore($this->route('branch'))
            ],
            'branch_address' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-zA-Z0-9\s\-_\.&,()@]+$/',
            ],
            'sites' => 'sometimes|array',
            'sites.*.id' => [
                'sometimes',
                'integer',
                'exists:sites,id' // Make sure the site ID exists in the database
            ],
            'sites.*.site_name' => [
                'required_with:sites',
                'string',
                'max:255',
                'regex:/^[a-zA-Z0-9\s\-_\.&,()@]+$/',
                function ($attribute, $value, $fail) {
                    $sites = request('sites');
                    $siteNames = array_column($sites, 'site_name');
                    if (count(array_unique($siteNames)) !== count($siteNames)) {
                        $fail('Site names must be unique within the branch.');
                    }
                },
            ],
        ];
    }
}