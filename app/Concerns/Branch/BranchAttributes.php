<?php

namespace App\Concerns\Branch;

trait BranchAttributes
{
    protected function branchAttributes(): array
    {
        return [
            'branch_name' => 'branch name',
            'branch_address' => 'branch address',
        ];
    }
}
