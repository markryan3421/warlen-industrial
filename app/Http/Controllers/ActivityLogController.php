<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        // Get search and pagination parameters
        $search = $request->input('search', '');
        $actionFilter = $request->input('action', '');
        $modelFilter = $request->input('model', '');
        $userFilter = $request->input('user', '');
        $perPage = (int) $request->input('perPage', 10);
        $currentPage = (int) $request->input('page', 1);

        // Build the base query for filtering (used for both stats and pagination)
        $baseQuery = Activity::with('causer', 'subject')->latest();
        
        // Apply search filter
        if (!empty($search)) {
            $baseQuery->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('log_name', 'like', "%{$search}%")
                  ->orWhere('subject_type', 'like', "%{$search}%")
                  ->orWhereHas('causer', function($causerQuery) use ($search) {
                      $causerQuery->where('name', 'like', "%{$search}%")
                                  ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }
        
        // Apply action filter
        if (!empty($actionFilter) && $actionFilter !== 'all') {
            $baseQuery->where('description', $actionFilter);
        }
        
        // Apply model filter
        if (!empty($modelFilter) && $modelFilter !== 'all') {
            $baseQuery->where('subject_type', 'like', "%{$modelFilter}%");
        }
        
        // Apply user filter
        if (!empty($userFilter) && $userFilter !== 'all') {
            $baseQuery->whereHas('causer', function($query) use ($userFilter) {
                $query->where('id', $userFilter);
            });
        }
        
        // ========== CALCULATE STATS BASED ON CURRENT FILTERS ==========
        $totalFilteredCount = $baseQuery->count();
        $createdCount = (clone $baseQuery)->where('description', 'created')->count();
        $updatedCount = (clone $baseQuery)->where('description', 'updated')->count();
        $deletedCount = (clone $baseQuery)->where('description', 'deleted')->count();
        $otherCount = $totalFilteredCount - ($createdCount + $updatedCount + $deletedCount);
        
        $stats = [
            'total' => $totalFilteredCount,
            'created' => $createdCount,
            'updated' => $updatedCount,
            'deleted' => $deletedCount,
            'other' => $otherCount,
        ];
        
        // ========== GET PAGINATED RESULTS FOR DISPLAY ==========
        $filteredCount = $baseQuery->count();
        $allTotal = Activity::count();
        
        // Get paginated results
        $paginatedActivities = $baseQuery->forPage($currentPage, $perPage)->get();
        
        // Transform paginated data for display
        $paginatedTransformed = collect();
        foreach ($paginatedActivities as $activity) {
            $paginatedTransformed->push([
                'id' => $activity->id,
                'log_name' => $activity->log_name,
                'description' => $activity->description,
                'event' => $activity->event,
                'subject_type' => $this->getModelName($activity),
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
        
        // ========== GET FILTER OPTIONS ==========
        $allActions = Activity::distinct()->pluck('description')->filter()->values()->toArray();
        
        $allModels = Activity::distinct()
            ->whereNotNull('subject_type')
            ->pluck('subject_type')
            ->map(function($type) {
                return class_basename($type);
            })
            ->unique()
            ->values()
            ->toArray();
        
        $allUsers = Activity::whereHas('causer')
            ->with('causer')
            ->get()
            ->map(function($activity) {
                return $activity->causer;
            })
            ->filter()
            ->unique('id')
            ->map(function($user) {
                return [
                    'id' => (string) $user->id,
                    'name' => $user->name ?? $user->email ?? 'System',
                ];
            })
            ->values()
            ->toArray();
        
        // Create paginator with correct path and query parameters
        $paginator = new LengthAwarePaginator(
            $paginatedTransformed,
            $filteredCount,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );
        
        return Inertia::render('ActivityLogs/index', [
            'activityLogs' => [
                'data' => $paginatedTransformed,
                'links' => $paginator->linkCollection()->toArray(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'total' => $allTotal,
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
            ],
            'filters' => [
                'search' => $search,
                'action' => $actionFilter,
                'model' => $modelFilter,
                'user' => $userFilter,
                'perPage' => (string) $perPage,
            ],
            'stats' => $stats,
            'totalCount' => $allTotal,
            'filteredCount' => $filteredCount,
            'allActions' => $allActions,
            'allModels' => $allModels,
            'allUsers' => $allUsers,
        ]);
    }
    
    protected function getModelName($activity): string
    {
        $modelName = '';
        
        if ($activity->subject_type) {
            $modelName = class_basename($activity->subject_type);
        }
        elseif ($activity->subject) {
            $modelName = class_basename($activity->subject);
        }
        elseif ($activity->properties) {
            if (isset($activity->properties['subject_type'])) {
                $modelName = class_basename($activity->properties['subject_type']);
            }
            elseif (in_array($activity->description, ['created', 'updated', 'deleted'])) {
                $modelName = 'Record';
            }
        }
        elseif ($activity->log_name) {
            $name = strtolower($activity->log_name);
            $models = ['user', 'branch', 'site', 'role', 'permission'];
            
            foreach ($models as $model) {
                if (str_contains($name, $model)) {
                    $modelName = ucfirst($model);
                    break;
                }
            }
            
            if (empty($modelName)) {
                $modelName = ucfirst($activity->log_name);
            }
        }
        
        if (empty($modelName)) {
            $modelName = 'Activity';
        }
        
        return preg_replace('/[^a-zA-Z0-9\s]/', ' ', Str::title($modelName));
    }
}