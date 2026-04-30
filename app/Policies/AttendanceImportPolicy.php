<?php

namespace App\Policies;

use App\Models\User;

class AttendanceImportPolicy
{

    public function import(User $user): bool
    {
        return $user->hasAnyRole(['hr_head','admin']);
    }

     public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin','hr_head']);
    }
}