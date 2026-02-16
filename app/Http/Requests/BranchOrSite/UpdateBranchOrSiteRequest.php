<?php

namespace App\Http\Requests\BranchOrSite;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBranchOrSiteRequest extends FormRequest
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
            'branch_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('branch_or_sites', 'branch_name')->ignore($this->route('branch_or_site')->id)
            ],
            'branch_address' => [
                'required',
                'string',
                'max:255',
            ],
        ];
    }
}
