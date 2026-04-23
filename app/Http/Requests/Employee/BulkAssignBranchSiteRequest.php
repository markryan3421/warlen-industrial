<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkAssignBranchSiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids'       => ['required', 'array', 'min:1'],
            'ids.*'     => ['required', 'integer', 'exists:employees,id'],
            'branch_id' => ['required', 'exists:branches,id'],   // branch is now required
            'site_id'   => ['nullable', 'exists:sites,id'],      // site can be null
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Only validate site-branch relationship if a site is provided
            if ($this->filled('site_id')) {
                $site = \App\Models\Site::find($this->site_id);
                if ($site && $site->branch_id != $this->branch_id) {
                    $validator->errors()->add(
                        'site_id',
                        'The selected site does not belong to the chosen branch.'
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'ids.required'       => 'Please select at least one employee.',
            'ids.*.exists'       => 'One or more selected employees do not exist.',
            'branch_id.required' => 'Please select a branch.',
            'branch_id.exists'   => 'The selected branch is invalid.',
            'site_id.exists'     => 'The selected site is invalid.',
        ];
    }
}