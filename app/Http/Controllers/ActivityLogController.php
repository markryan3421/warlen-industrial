<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Pagination\LengthAwarePaginator;

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

            // For CRUD operations without explicit type
            if (in_array($activity->description, ['created', 'updated', 'deleted'])) {
                return 'Record';
            }
        }

        // Fallback to log name
        if ($activity->log_name) {
            $name = strtolower($activity->log_name);
            $models = ['user', 'branch', 'site', 'role', 'permission'];

            foreach ($models as $model) {
                if (str_contains($name, $model)) {
                    return ucfirst($model);
                }
            }

            return ucfirst($activity->log_name);
        }

        return 'Activity';
    }
}
