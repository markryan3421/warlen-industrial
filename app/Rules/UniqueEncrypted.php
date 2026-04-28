<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Eloquent\Model;

class UniqueEncrypted implements ValidationRule
{
    public function __construct(
        protected string $modelClass,
        protected string $column,
        protected ?int $ignoreId = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $isDuplicate = $this->modelClass::query()
            ->when($this->ignoreId, fn($q) => $q->where('id', '!=', $this->ignoreId))
            ->get(['id', $this->column])
            ->contains(function (Model $record) use ($value): bool {
                try {
                    return $record->{$this->column} === (string) $value;
                } catch (\Exception) {
                    return false;
                }
            });

        if ($isDuplicate) {
            $fail("The :attribute has already been taken.");
        }
    }
}