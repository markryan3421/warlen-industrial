<?php

namespace App\Policies;

use App\Models\AIInsight;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class AIInsightPolicy
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
    public function view(User $user, AIInsight $aIInsight): bool
    {
        return false;
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
    public function update(User $user, AIInsight $aIInsight): bool
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, AIInsight $aIInsight): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, AIInsight $aIInsight): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, AIInsight $aIInsight): bool
    {
        return false;
    }

    public function analyzeAttendance(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    public function getInsights(User $user):bool
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

    public function deepAnalysis(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'hr_head']);
    }

}
