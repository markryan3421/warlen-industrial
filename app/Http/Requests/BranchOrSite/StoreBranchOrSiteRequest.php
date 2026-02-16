<?php

namespace App\Http\Requests\BranchOrSite;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchOrSiteRequest extends FormRequest
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
                'unique:branch_or_sites,branch_name'
            ],
            'branch_address' => [
                'required',
                'string',
                'max:255',
            ],
        ];
    }
}
