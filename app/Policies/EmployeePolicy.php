<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class EmployeePolicy
{
      use HandlesAuthorization;
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Employee $employee): bool
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Employee $employee): bool
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Employee $employee): bool
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Employee $employee): bool
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Employee $employee): bool
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    public function bulkDelete(User $user): bool
    {
        return $user->hasAnyRole('admin', 'hr_head'); // or your logic
    }

    public function bulkRestore(User $user): bool
    {
        return $user->hasAnyRole('admin', 'hr_head');
    }

    // public function bulkForceDelete(User $user): bool
    // {
    //     return $user->hasRole('admin');
    // }

    public function bulkAssign(User $user)
    {
        return $user->hasAnyRole('admin', 'hr_head'); // or your logic
    }
}
