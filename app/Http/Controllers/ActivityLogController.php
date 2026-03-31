<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        // Get all filter parameters
        $search = $request->input('search', '');
        $actionFilter = $request->input('action', 'all');
        $modelFilter = $request->input('model', 'all');
        $userFilter = $request->input('user', 'all');
        $perPage = (int) $request->input('perPage', 10);
        $currentPage = (int) $request->input('page', 1);

        // ========================================================================
        // BUILD THE QUERY
        // ========================================================================
        
        $query = Activity::with('causer', 'subject');

        // Apply search filter
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('log_name', 'like', "%{$search}%")
                  ->orWhereHas('causer', function($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Apply action filter
        if ($actionFilter !== 'all') {
            $query->where('description', $actionFilter);
        }

        // Apply user filter (causer_id)
        if ($userFilter !== 'all' && is_numeric($userFilter)) {
            $query->where('causer_id', $userFilter);
        }

        // ========================================================================
        // GET FILTER OPTIONS (from full dataset for dropdowns)
        // ========================================================================
        
        // All distinct actions
        $allActions = Activity::distinct()->pluck('description')->filter()->values()->toArray();
        
        // All distinct model names
        $allActivitiesSample = Activity::with('subject')->limit(1000)->get();
        $allModels = $allActivitiesSample->map(function($activity) {
            return $this->getModelName($activity);
        })->unique()->filter()->values()->toArray();
        
        // All distinct users (causers) - using relationship only
        $allUsers = Activity::whereHas('causer')
            ->with('causer')
            ->select('causer_id')
            ->distinct()
            ->get()
            ->map(function($activity) {
                return [
                    'id' => (string) $activity->causer_id,
                    'name' => $activity->causer->name ?? $activity->causer->email ?? 'System'
                ];
            })
            ->filter(function($user) {
                return $user['id'] !== null && $user['id'] !== '';
            })
            ->values()
            ->toArray();

        // ========================================================================
        // COUNTS
        // ========================================================================
        
        $allTotal = Activity::count();
        $filteredCount = $query->count();

        // ========================================================================
        // PAGINATION
        // ========================================================================
        
        $activities = $query->latest()->paginate($perPage, ['*'], 'page', $currentPage);

        // ========================================================================
        // TRANSFORM DATA
        // ========================================================================
        
        $transformed = collect();
        foreach ($activities as $activity) {
            $modelName = $this->getModelName($activity);
            
            // Apply model filter after transformation
            if ($modelFilter !== 'all' && $modelName !== $modelFilter) {
                continue;
            }
            
            $transformed->push([
                'id' => $activity->id,
                'log_name' => $activity->log_name,
                'description' => $activity->description,
                'event' => $activity->event,
                'subject_type' => $modelName,
                'subject_id' => $activity->subject_id,
                'properties' => $activity->properties,
                'created_at' => $activity->created_at,
                'updated_at' => $activity->updated_at,
                'causer' => $activity->causer ? [
                    'id' => $activity->causer->id,
                    'name' => $activity->causer->name ?? $activity->causer->email ?? 'System',
                    'email' => $activity->causer->email,
                ] : null,
            ]);
        }

        // ========================================================================
        // APPEND FILTERS TO PAGINATION LINKS
        // ========================================================================
        
        $activities->appends([
            'search' => $search ?: null,
            'action' => $actionFilter !== 'all' ? $actionFilter : null,
            'model' => $modelFilter !== 'all' ? $modelFilter : null,
            'user' => $userFilter !== 'all' ? $userFilter : null,
            'perPage' => $perPage,
        ]);

        // ========================================================================
        // RETURN RESPONSE
        // ========================================================================

        return Inertia::render('ActivityLogs/index', [
            'activityLogs' => [
                'data' => $transformed->values(),
                'links' => $activities->linkCollection()->toArray(),
                'from' => $activities->firstItem(),
                'to' => $activities->lastItem(),
                'total' => $allTotal,
                'current_page' => $activities->currentPage(),
                'last_page' => $activities->lastPage(),
                'per_page' => $activities->perPage(),
            ],
            'filters' => [
                'search' => $search,
                'action' => $actionFilter,
                'model' => $modelFilter,
                'user' => $userFilter,
                'perPage' => (string) $perPage,
            ],
            'totalCount' => $allTotal,
            'filteredCount' => $filteredCount,
            'allActions' => $allActions,
            'allModels' => $allModels,
            'allUsers' => $allUsers,
        ]);
    }

    /**
     * Get readable model name from activity
     */
    protected function getModelName($activity): string
    {
        // Try subject_type first
        if ($activity->subject_type) {
            return class_basename($activity->subject_type);
        }

        // Try loaded subject relationship
        if ($activity->subject) {
            return class_basename($activity->subject);
        }

        // Try to infer from properties
        if ($activity->properties) {
            if (isset($activity->properties['subject_type'])) {
                return class_basename($activity->properties['subject_type']);
            }
            
            if (isset($activity->properties['attributes']['model'])) {
                return class_basename($activity->properties['attributes']['model']);
            }
        }

        // Fallback based on description
        $description = $activity->description;
        $logName = strtolower($activity->log_name ?? '');
        
        if (in_array($description, ['created', 'updated', 'deleted'])) {
            $commonModels = ['user', 'branch', 'site', 'role', 'permission', 'employee', 'department', 'position'];
            foreach ($commonModels as $model) {
                if (str_contains($logName, $model)) {
                    return ucfirst($model);
                }
            }
            return 'Record';
        }

        // For login/logout events
        if ($description === 'login' || $description === 'logout') {
            return 'Authentication';
        }

        // Default fallback
        if ($logName) {
            return ucfirst($logName);
        }

        return 'Activity';
    }
}