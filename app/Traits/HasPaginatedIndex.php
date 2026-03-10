<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Database\Eloquent\Builder;

/**
 * HasPaginatedIndex
 *
 * A controller trait that adds search + pagination on top of any data source —
 * whether that's a repository result, a cached collection, an eager-loaded
 * query, or a plain Eloquent builder.
 *
 * The key difference from PaginatedTableService:
 *   PaginatedTableService  — owns the query entirely (flat Eloquent only)
 *   HasPaginatedIndex      — works WITH your existing query/collection/repository
 *
 * Usage in a controller:
 *
 *   use App\Traits\HasPaginatedIndex;
 *
 *   class BranchController extends Controller
 *   {
 *       use HasPaginatedIndex;
 *
 *       public function index(Request $request)
 *       {
 *           $branches = $this->cacheRemember('branches', 60, fn() =>
 *               $this->branchRepository->getBranches()
 *           );
 *
 *           // Paginate the cached collection — no query rebuilding needed
 *           $result = $this->paginateCollection(
 *               items:         $branches,
 *               request:       $request,
 *               searchColumns: ['name', 'address'],
 *           );
 *
 *           return Inertia::render('Branch/index', [
 *               'branches'      => $result['data'],
 *               'pagination'    => $result['pagination'],
 *               'filters'       => $result['filters'],
 *               'totalCount'    => $result['totalCount'],
 *               'filteredCount' => $result['filteredCount'],
 *           ]);
 *       }
 *   }
 */
trait HasPaginatedIndex
{
    /**
     * Paginate a Collection (repository result, cached data, eager-loaded data).
     *
     * Use this when you already HAVE the data as a Collection — from a repository,
     * cache, or an Eloquent ->get() call. Search is done in PHP on the collection.
     *
     * @param  Collection   $items          The full dataset
     * @param  Request      $request        For reading search + perPage params
     * @param  array        $searchColumns  Dot-notation supported: 'employee.name'
     * @return array
     */
    protected function paginateCollection(
        Collection $items,
        Request    $request,
        array      $searchColumns = [],
    ): array {
        $totalCount = $items->count();

        // ── Search — filter the collection in PHP ─────────────────────────────
        if ($request->filled('search')) {
            $search = strtolower($request->search);

            $items = $items->filter(function ($item) use ($search, $searchColumns) {
                foreach ($searchColumns as $col) {
                    // Support dot notation for relationships: 'employee.name'
                    $value = $this->resolveNestedValue($item, $col);

                    if (str_contains(strtolower((string) $value), $search)) {
                        return true; // match found — keep this item
                    }
                }
                return false;
            })->values(); // re-index after filter
        }

        $filteredCount = $items->count();
        $perPage       = (int) ($request->perPage ?? 10);

        // ── "All" mode ────────────────────────────────────────────────────────
        if ($perPage === -1) {
            return [
                'data'          => $items->values(),
                'pagination'    => $this->buildPaginationMeta(1, $filteredCount, 1, $filteredCount, $filteredCount, $request, []),
                'filters'       => $request->only(['search', 'perPage']),
                'totalCount'    => $totalCount,
                'filteredCount' => $filteredCount,
            ];
        }

        // ── Manual pagination on the collection ───────────────────────────────
        $currentPage = (int) ($request->page ?? 1);
        $offset      = ($currentPage - 1) * $perPage;
        $pageItems   = $items->slice($offset, $perPage)->values();
        $lastPage    = (int) ceil($filteredCount / $perPage);
        $from        = $filteredCount > 0 ? $offset + 1 : 0;
        $to          = min($offset + $perPage, $filteredCount);

        return [
            'data'          => $pageItems,
            'pagination'    => $this->buildPaginationMeta($currentPage, $lastPage, $from, $to, $filteredCount, $request),
            'filters'       => $request->only(['search', 'perPage']),
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
     * Supports eager loading — call ->with([...]) on the builder before passing.
     *
     * @param  Builder  $query          Eloquent query builder (with any ->with(), ->where(), etc. already applied)
     * @param  Request  $request        For reading search + perPage params
     * @param  array    $searchColumns  DB column names to search against (no dot-notation — SQL only)
     * @return array
     */
    protected function paginateQuery(
        Builder $query,
        Request $request,
        array   $searchColumns = [],
    ): array {
        // ── Total count BEFORE search ─────────────────────────────────────────
        $totalCount = $query->count();

        // ── Search — add WHERE clauses to the SQL query ───────────────────────
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

        // ── "All" mode ────────────────────────────────────────────────────────
        if ($perPage === -1) {
            $all = $query->get();

            return [
                'data'          => $all,
                'pagination'    => $this->buildPaginationMeta(1, 1, 1, $filteredCount, $filteredCount, $request),
                'filters'       => $request->only(['search', 'perPage']),
                'totalCount'    => $totalCount,
                'filteredCount' => $filteredCount,
            ];
        }

        // ── Paginated query ───────────────────────────────────────────────────
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
            'filters'       => $request->only(['search', 'perPage']),
            'totalCount'    => $totalCount,
            'filteredCount' => $filteredCount,
        ];
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Resolve a dot-notation key from a model or array.
     * e.g. 'employee.user.name' → $item->employee->user->name
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
     * what your existing Pagination.tsx component expects.
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
        // Generate links if not provided (collection-paginated case)
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
     * Matches the structure Laravel's paginator produces natively.
     */
    private function buildLinks(int $currentPage, int $lastPage, Request $request): array
    {
        $links = [];

        // Previous link
        $links[] = [
            'label'  => '&laquo; Previous',
            'url'    => $currentPage > 1
                            ? $request->fullUrlWithQuery(['page' => $currentPage - 1])
                            : null,
            'active' => false,
        ];

        // Numbered page links
        for ($page = 1; $page <= $lastPage; $page++) {
            $links[] = [
                'label'  => (string) $page,
                'url'    => $request->fullUrlWithQuery(['page' => $page]),
                'active' => $page === $currentPage,
            ];
        }

        // Next link
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