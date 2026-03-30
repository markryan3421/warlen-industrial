<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AttendanceTabPaginatedService
{
    /**
     * Get paginated data for a specific tab in attendance management
     * This service only handles pagination for the active tab to optimize performance
     */
    public static function makeForActiveTab(
        $model, 
        Request $request, 
        array $columns, 
        array $searchColumns, 
        string $tabName,
        bool $isActiveTab = false
    ) {
        // Get pagination parameters
        $perPage = $request->get('perPage', 10);
        $currentTab = $request->get('tab', 'logs');
        
        // Only get page for active tab, otherwise default to page 1 for counts
        $page = ($isActiveTab) ? $request->get('page', 1) : 1;
        
        // Handle "All" option
        if ($perPage === '-1') {
            $perPage = 10000;
        } else {
            $perPage = (int) $perPage;
        }
        
        $search = $request->get('search', '');
        
        // Build the query
        $query = $model::query();
        
        // Apply search if provided
        if ($search && !empty($searchColumns)) {
            $query->where(function ($q) use ($search, $searchColumns) {
                foreach ($searchColumns as $column) {
                    $q->orWhere($column, 'like', "%{$search}%");
                }
            });
        }
        
        // Get counts
        $totalCount = $model::count();
        $filteredCount = $query->count();
        
        // Only paginate if this is the active tab
        if ($isActiveTab) {
            // Get paginated results with the page parameter
            $paginated = $query->paginate($perPage, ['*'], 'page', $page);
            
            // Append all parameters to pagination links
            $paginated->appends([
                'tab' => $currentTab,
                'search' => $search,
                'perPage' => $request->get('perPage', '10')
            ]);
            
            $result = [
                'data' => $paginated->items(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
                'links' => $paginated->linkCollection()->toArray(),
                'totalCount' => $totalCount,
                'filteredCount' => $filteredCount,
            ];
            
            // Debug logging for active tab
            Log::info('AttendanceTabPaginatedService::makeForActiveTab (Active)', [
                'tab' => $tabName,
                'current_tab' => $currentTab,
                'page' => $page,
                'per_page' => $perPage,
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
                'is_active' => true
            ]);
            
            return $result;
        }
        
        // For inactive tabs, only return counts and basic info (no pagination data)
        $result = [
            'data' => [], // No data for inactive tabs
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => $perPage,
            'total' => $totalCount,
            'from' => 0,
            'to' => 0,
            'links' => [],
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
        ];
        
        // Debug logging for inactive tabs
        Log::info('AttendanceTabPaginatedService::makeForActiveTab (Inactive)', [
            'tab' => $tabName,
            'current_tab' => $currentTab,
            'total' => $totalCount,
            'filtered' => $filteredCount,
            'is_active' => false
        ]);
        
        return $result;
    }
    
    /**
     * Get all data for timeline/calendar views (no pagination)
     */
    public static function getAllData(
        $model,
        Request $request,
        array $searchColumns,
        array $columns,
        $limit = null,
        $orderBy = null,
        $orderDirection = 'desc'
    ) {
        $search = $request->get('search', '');
        
        $query = $model::query()
            ->select($columns);
        
        // Apply search if provided
        if ($search && !empty($searchColumns)) {
            $query->where(function ($q) use ($search, $searchColumns) {
                foreach ($searchColumns as $column) {
                    $q->orWhere($column, 'like', "%{$search}%");
                }
            });
        }
        
        // Determine order by column
        if ($orderBy === null) {
            // Auto-detect order column
            if (in_array('date', $columns)) {
                $orderBy = 'date';
            } elseif (in_array('period_start', $columns)) {
                $orderBy = 'period_start';
            } elseif (in_array('created_at', $columns)) {
                $orderBy = 'created_at';
            } else {
                $orderBy = 'id';
            }
        }
        
        // Apply ordering
        if ($orderBy && in_array($orderBy, $columns)) {
            $query->orderBy($orderBy, $orderDirection);
        }
        
        // Apply limit only if specified
        if ($limit !== null) {
            $query->limit($limit);
        }
        
        $results = $query->get();
        
        // Debug logging
        Log::info('AttendanceTabPaginatedService::getAllData', [
            'model' => class_basename($model),
            'count' => $results->count(),
            'search' => $search,
            'order_by' => $orderBy,
            'limit' => $limit,
            'has_results' => $results->isNotEmpty()
        ]);
        
        return $results;
    }
}