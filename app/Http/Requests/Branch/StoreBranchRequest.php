<?php

namespace App\Http\Requests\Branch;

use App\Concerns\Branch\BranchAttributes;
use App\Concerns\Branch\BranchValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    use BranchValidationRules, BranchAttributes;
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
        return $this->storeRules();
    }

    public function attributes(): array
    {
        return $this->branchAttributes();
    }
}
