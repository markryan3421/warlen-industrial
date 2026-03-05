<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * PaginatedTableService
 *
 * Handles the repetitive search → count → paginate → transform pipeline
 * that every index controller method follows.
 *
 * Usage:
 *   $result = PaginatedTableService::make(
 *       model:   AttendanceExceptionStat::class,
 *       request: $request,
 *       columns: ['employee_id', 'employee_name', 'department', 'date', ...],
 *       searchColumns: ['employee_name', 'department'],
 *   );
 *
 * Returns an array with keys:
 *   data           — transformed rows (array of column => value maps)
 *   total          — total unfiltered count
 *   perPage        — active per-page value
 *   from           — first row index on this page
 *   to             — last row index on this page
 *   links          — Inertia-compatible pagination links (empty for "All")
 *   filteredCount  — count after search filter applied
 */
class PaginatedTableService
{
    /**
     * Run the full pipeline for a given model and return the result array.
     *
     * @param  class-string<Model>  $model         Eloquent model class e.g. AttendanceLog::class
     * @param  Request              $request        The incoming HTTP request (search, perPage)
     * @param  array<string>        $columns        Columns to include in each result row
     * @param  array<string>        $searchColumns  Which columns to search against (defaults to first column only)
     * @param  callable|null        $queryCallback  Optional — extra query constraints e.g. date filters
     *                                              Receives the Builder instance: fn($query) => $query->where(...)
     * @return array
     */
    public static function make(
        string   $model,
        Request  $request,
        array    $columns,
        array    $searchColumns = [],
        ?callable $queryCallback = null,
    ): array {
        // ── Base query ────────────────────────────────────────────────────────
        $query = $model::query();

        // ── Apply any extra constraints from the caller ───────────────────────
        // e.g. filtering by department, date range, etc.
        if ($queryCallback) {
            $queryCallback($query);
        }

        // ── Total count BEFORE search ─────────────────────────────────────────
        $totalCount = $query->count();

        // ── Search filter ─────────────────────────────────────────────────────
        // If no searchColumns were passed, default to the first column in the list.
        // Wrap in a single where group so it doesn't break other AND conditions.
        if ($request->filled('search')) {
            $search        = $request->search;
            $searchTargets = ! empty($searchColumns) ? $searchColumns : [$columns[0]];

            $query->where(function ($q) use ($search, $searchTargets) {
                foreach ($searchTargets as $col) {
                    $q->orWhere($col, 'like', "%{$search}%");
                }
            });
        }

        // ── Filtered count AFTER search ───────────────────────────────────────
        $filteredCount = $query->count();

        // ── Per-page value ────────────────────────────────────────────────────
        $perPage = (int) ($request->perPage ?? 10);

        // ── Transform closure — pick only the requested columns ───────────────
        // Using array_intersect_key so the column list drives the output,
        // not the model attributes. Unknwon column keys return null safely.
        $transform = fn ($row) => collect($columns)
            ->mapWithKeys(fn ($col) => [$col => $row->{$col} ?? null])
            ->all();

        // ── "All" mode — no pagination ────────────────────────────────────────
        if ($perPage === -1) {
            $rows = $query->latest()->get()->map($transform);

            return [
                'data'          => $rows,
                'total'         => $filteredCount,
                'perPage'       => $perPage,
                'from'          => 1,
                'to'            => $filteredCount,
                'links'         => [],
                'filteredCount' => $filteredCount,
                'totalCount'    => $totalCount,
            ];
        }

        // ── Paginated mode ────────────────────────────────────────────────────
        $paginated = $query->latest()->paginate($perPage)->withQueryString();

        $paginated->getCollection()->transform($transform);

        return [
            'data'          => $paginated->items(),
            'total'         => $paginated->total(),
            'perPage'       => $perPage,
            'from'          => $paginated->firstItem() ?? 0,
            'to'            => $paginated->lastItem()  ?? 0,
            'links'         => $paginated->linkCollection()->toArray(),
            'filteredCount' => $filteredCount,
            'totalCount'    => $totalCount,
        ];
    }
}