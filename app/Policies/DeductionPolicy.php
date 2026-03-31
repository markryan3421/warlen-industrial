<?php

namespace App\Policies;

use App\Models\Deduction;
use App\Models\User;
// use Illuminate\Auth\Access\Response;

class DeductionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool  // Removed the second parameter
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Deduction $deduction): bool  // Changed DeductionPolicy to Deduction
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
    public function update(User $user, Deduction $deduction): bool  // Changed DeductionPolicy to Deduction
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Deduction $deduction): bool  // Changed DeductionPolicy to Deduction
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Deduction $deduction): bool  // Changed DeductionPolicy to Deduction
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Deduction $deduction): bool  // Changed DeductionPolicy to Deduction
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }
}