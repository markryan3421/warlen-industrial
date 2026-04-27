<?php

namespace App\Policies;

use App\Models\ApplicationLeave;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ApplicationLeavePolicy
{
      use HandlesAuthorization;
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('employee')
            && $user->employee
            && $user->employee->employee_status == 'Active' || 'active';
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ApplicationLeave $applicationLeave): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('employee')
            &&
            $user->employee &&
            $user->employee->employee_status == 'Active' || 'active';
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ApplicationLeave $applicationLeave): bool
    {
        return $user->hasAnyRole(['admin', 'employee']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ApplicationLeave $applicationLeave): bool
    {
        return $user->hasAnyRole(['admin', 'employee']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ApplicationLeave $applicationLeave): bool
    {
        return $user->hasAnyRole(['admin', 'employee']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ApplicationLeave $applicationLeave): bool
    {
        return $user->hasAnyRole(['admin', 'employee']);
    }
}
