<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * HasPaginatedIndex
 *
 * A controller trait that adds search, filtering, and pagination on top of
 * any data source — whether that's a repository result, a cached collection,
 * an eager-loaded query, or a plain Eloquent builder.
 *
 * Supported filter params (all optional, all stackable):
 *   search      — full-text across searchColumns (dot-notation supported)
 *   positions   — comma-separated position names  e.g. "Manager,Developer"
 *   branch      — exact branch_name match
 *   site        — exact site_name match
 *   status      — '' / omit = all (default) | 'active' = active only | 'inactive' = inactive only
 *   date_from   — YYYY-MM-DD; filters on hire_date, then created_at, then contract_start_date
 *   date_to     — YYYY-MM-DD; upper bound for the same date field
 *   perPage     — rows per page (default 10; -1 = all)
 *   page        — current page number (built into the link URLs automatically)
 */
trait HasPaginatedIndex
{
    /**
     * Paginate a Collection (repository result, cached data, eager-loaded data).
     *
     * All filtering is done in PHP on the collection. Use this when you already
     * HAVE the data as a Collection — from a repository, cache, or ->get().
     *
     * @param  Collection  $items          The full unfiltered dataset
     * @param  Request     $request        For reading filter + pagination params
     * @param  array       $searchColumns  Dot-notation supported: 'user.name', 'position.pos_name'
     * @return array
     */
    protected function paginateCollection(
        Collection $items,
        Request    $request,
        array      $searchColumns = [],
    ): array {
        $totalCount = $items->count();

        // ── 1. Full-text search ───────────────────────────────────────────────
        if ($request->filled('search')) {
            $search = strtolower($request->search);

            $items = $items->filter(function ($item) use ($search, $searchColumns) {
                foreach ($searchColumns as $col) {
                    $value = $this->resolveNestedValue($item, $col);
                    if (str_contains(strtolower((string) $value), $search)) {
                        return true;
                    }
                }
                return false;
            })->values();
        }

        // ── 2. Position filter (multi-select, comma-separated) ────────────────
        if ($request->filled('positions')) {
            $positions = array_filter(explode(',', $request->positions));

            $items = $items->filter(function ($item) use ($positions) {
                $posName = $this->resolveNestedValue($item, 'position.pos_name');
                return in_array($posName, $positions, true);
            })->values();
        }

        // ── 3. Branch filter ──────────────────────────────────────────────────
        if ($request->filled('branch')) {
            $branch = $request->branch;

            $items = $items->filter(function ($item) use ($branch) {
                return $this->resolveNestedValue($item, 'branch.branch_name') === $branch;
            })->values();
        }

        // ── 4. Site filter ────────────────────────────────────────────────────
        if ($request->filled('site')) {
            $site = $request->site;

            $items = $items->filter(function ($item) use ($site) {
                return $this->resolveNestedValue($item, 'site.site_name') === $site;
            })->values();
        }


        // ── 5. Status filter ──────────────────────────────────────────────────────
        //    No param / '' → show all employees (default — no filter applied)
        //    'active'      → active employees only
        //    'inactive'    → inactive employees only
        $statusFilter = $request->get('status', '');

        if ($statusFilter === 'active') {
            $items = $items->filter(function ($item) {
                $status = strtolower((string) ($this->resolveNestedValue($item, 'employee_status') ?? ''));
                return $status === 'active';
            })->values();
        } elseif ($statusFilter === 'inactive') {
            $items = $items->filter(function ($item) {
                $status = strtolower((string) ($this->resolveNestedValue($item, 'employee_status') ?? ''));
                return $status !== 'active';
            })->values();
        }
        // else: '' or any other value → no status filter, return all
        // ── 6. Date range filter ──────────────────────────────────────────────
        //    Falls back through: hire_date → created_at → contract_start_date
        if ($request->filled('date_from') || $request->filled('date_to')) {
            $from = $request->filled('date_from') ? strtotime($request->date_from) : null;
            $to   = $request->filled('date_to')   ? strtotime($request->date_to)   : null;

            $items = $items->filter(function ($item) use ($from, $to) {
                $raw = $this->resolveNestedValue($item, 'hire_date')
                    ?? $this->resolveNestedValue($item, 'created_at')
                    ?? $this->resolveNestedValue($item, 'contract_start_date');

                if (!$raw) return false;

                $ts = strtotime((string) $raw);

                if ($from && $to)  return $ts >= $from && $ts <= $to;
                if ($from)         return $ts >= $from;
                if ($to)           return $ts <= $to;

                return true;
            })->values();
        }

        $filteredCount = $items->count();
        $perPage       = (int) ($request->perPage ?? 10);

        // ── "All" mode ────────────────────────────────────────────────────────
        if ($perPage === -1) {
            return [
                'data'          => $items->values(),
                'pagination'    => $this->buildPaginationMeta(
                                       1, $filteredCount, 1, $filteredCount, $filteredCount, $request, []
                                   ),
                'filters'       => $this->buildFilters($request),
                'totalCount'    => $totalCount,
                'filteredCount' => $filteredCount,
            ];
        }

        // ── Manual pagination ─────────────────────────────────────────────────
        $currentPage = max(1, (int) ($request->page ?? 1));
        $offset      = ($currentPage - 1) * $perPage;
        $pageItems   = $items->slice($offset, $perPage)->values();
        $lastPage    = max(1, (int) ceil($filteredCount / $perPage));
        $from        = $filteredCount > 0 ? $offset + 1 : 0;
        $to          = min($offset + $perPage, $filteredCount);

        return [
            'data'          => $pageItems,
            'pagination'    => $this->buildPaginationMeta(
                                   $currentPage, $lastPage, $from, $to, $filteredCount, $request
                               ),
            'filters'       => $this->buildFilters($request),
            'totalCount'    => $totalCount,
            'filteredCount' => $filteredCount,
        ];
    }

    /**
     * Paginate an Eloquent Builder (queries with relationships, scopes, etc.)
     *
     * Use this when you have a Builder instance and want to keep the query
     * in SQL — better for large datasets where PHP-side filtering is too slow.
     *
     * Note: branch/site/position/status filters are NOT implemented here because
     * they require joins. Add them directly to the Builder before calling this
     * method, or use paginateCollection() instead.
     *
     * @param  Builder  $query          Eloquent query builder
     * @param  Request  $request        For reading search + perPage params
     * @param  array    $searchColumns  DB column names (no dot-notation — SQL only)
     * @return array
     */
    protected function paginateQuery(
        Builder $query,
        Request $request,
        array   $searchColumns = [],
    ): array {
        $totalCount = $query->count();

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search, $searchColumns) {
                foreach ($searchColumns as $col) {
                    $q->orWhere($col, 'like', "%{$search}%");
                }
            });
        }

        $filteredCount = $query->count();
        $perPage       = (int) ($request->perPage ?? 10);

        if ($perPage === -1) {
            $all = $query->get();
            return [
                'data'          => $all,
                'pagination'    => $this->buildPaginationMeta(1, 1, 1, $filteredCount, $filteredCount, $request),
                'filters'       => $this->buildFilters($request),
                'totalCount'    => $totalCount,
                'filteredCount' => $filteredCount,
            ];
        }

        $paginated = $query->paginate($perPage)->withQueryString();

        return [
            'data'          => $paginated->items(),
            'pagination'    => $this->buildPaginationMeta(
                                   $paginated->currentPage(),
                                   $paginated->lastPage(),
                                   $paginated->firstItem() ?? 0,
                                   $paginated->lastItem()  ?? 0,
                                   $paginated->total(),
                                   $request,
                                   $paginated->linkCollection()->toArray(),
                               ),
            'filters'       => $this->buildFilters($request),
            'totalCount'    => $totalCount,
            'filteredCount' => $filteredCount,
        ];
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Build the filters array returned to the frontend.
     * Includes ALL filter params so the React state can initialise correctly
     * on first render and survive perPage / page changes.
     */
    private function buildFilters(Request $request): array
    {
        return $request->only([
            'search',
            'positions',
            'branch',
            'site',
            'status',
            'date_from',
            'date_to',
            'perPage',
        ]);
    }

    /**
     * Resolve a dot-notation key from a model or array.
     * e.g. 'position.pos_name' → $item->position->pos_name
     */
    private function resolveNestedValue(mixed $item, string $key): mixed
    {
        $segments = explode('.', $key);

        $value = $item;
        foreach ($segments as $segment) {
            if (is_array($value)) {
                $value = $value[$segment] ?? null;
            } elseif (is_object($value)) {
                $value = $value->{$segment} ?? null;
            } else {
                return null;
            }
        }

        return $value;
    }

    /**
     * Build a consistent pagination meta array that matches
     * what CustomPagination.tsx expects.
     */
    private function buildPaginationMeta(
        int     $currentPage,
        int     $lastPage,
        int     $from,
        int     $to,
        int     $total,
        Request $request,
        array   $links = [],
    ): array {
        if (empty($links)) {
            $links = $this->buildLinks($currentPage, $lastPage, $request);
        }

        return [
            'from'  => $from,
            'to'    => $to,
            'total' => $total,
            'links' => $links,
        ];
    }

    /**
     * Build pagination link objects for collection-paginated results.
     * Matches the structure Laravel's own paginator produces.
     */
    private function buildLinks(int $currentPage, int $lastPage, Request $request): array
    {
        $links = [];

        $links[] = [
            'label'  => '&laquo; Previous',
            'url'    => $currentPage > 1
                            ? $request->fullUrlWithQuery(['page' => $currentPage - 1])
                            : null,
            'active' => false,
        ];

        for ($page = 1; $page <= $lastPage; $page++) {
            $links[] = [
                'label'  => (string) $page,
                'url'    => $request->fullUrlWithQuery(['page' => $page]),
                'active' => $page === $currentPage,
            ];
        }

        $links[] = [
            'label'  => 'Next &raquo;',
            'url'    => $currentPage < $lastPage
                            ? $request->fullUrlWithQuery(['page' => $currentPage + 1])
                            : null,
            'active' => false,
        ];

        return $links;
    }
}