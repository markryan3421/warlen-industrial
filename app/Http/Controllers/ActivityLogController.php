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
        $search = $request->get('search', '');
        $perPage = (int) $request->get('perPage', 10);
        $currentPage = (int) $request->get('page', 1);

        // Get all activities with relationships - use cursor for large datasets
        $activities = Activity::with('causer', 'subject')
            ->latest()
            ->cursor();

        // Transform data
        $transformed = collect();
        foreach ($activities as $activity) {
            $transformed->push([
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

        // Apply search filter if needed
        if (!empty($search)) {
            $transformed = $transformed->filter(function ($item) use ($search) {
                return stripos($item['description'], $search) !== false ||
                    stripos($item['log_name'], $search) !== false ||
                    stripos($item['subject_type'], $search) !== false ||
                    stripos($item['causer']['name'] ?? '', $search) !== false;
            });
        }

        // Get total counts
        $totalCount = $transformed->count();
        $allTotal = Activity::count();

        // Paginate
        $paginated = $transformed->slice(($currentPage - 1) * $perPage, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $paginated,
            $totalCount,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('ActivityLogs/index', [
            'activityLogs' => [
                'data' => $paginated,
                'links' => $paginator->linkCollection()->toArray(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'total' => $allTotal,
            ],
            'filters' => [
                'search' => $search,
                'perPage' => (string) $perPage,
            ],
            'totalCount' => $allTotal,
            'filteredCount' => $totalCount,
        ]);
    }

    /**
     * Get readable model name from activity
     */
    protected function getModelName($activity): string
    {
        $modelName = '';

        // Try subject_type first
        if ($activity->subject_type) {
            $modelName = class_basename($activity->subject_type);
        }
        // Try loaded subject relationship
        elseif ($activity->subject) {
            $modelName = class_basename($activity->subject);
        }
        // Try to infer from properties
        elseif ($activity->properties) {
            if (isset($activity->properties['subject_type'])) {
                $modelName = class_basename($activity->properties['subject_type']);
            }
            // For CRUD operations without explicit type
            elseif (in_array($activity->description, ['created', 'updated', 'deleted'])) {
                $modelName = 'Record';
            }
        }
        // Fallback to log name
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

        // Default fallback
        if (empty($modelName)) {
            $modelName = 'Activity';
        }

        // Remove special characters and apply title case
        return preg_replace('/[^a-zA-Z0-9\s]/', ' ', Str::title($modelName));
    }
}
