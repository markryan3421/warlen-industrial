<?php

namespace App\Repository;

use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class PositionRepository
{
    public function __construct()
    {
        //
    }

    protected function getPositions()
    {
        return Position::query()
            ->with(['deduction' => function ($query) {
                $query->deductionsOnly();
            }]);
    }

    /**
     * Get positions with filtering, pagination, and transformation
     */
    public function getFilteredPositions(Request $request): array
    {
        $query = $this->getPositions();

        // Get total count before filtering
        $totalCount = $query->count();

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('pos_name', 'like', "%{$search}%");
            });
        }

        // Get filtered count
        $filteredCount = $query->count();

        $perPage = (int) ($request->perPage ?? 10);

        if ($perPage === -1) {
            $positions = $this->getAllPositions($query);
        } else {
            $positions = $this->getPaginatedPositions($query, $perPage, $request);
        }

        return [
            'positions' => $positions,
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'filters' => $request->only(['search']),
        ];
    }

    /**
     * Get all positions without pagination
     */
    protected function getAllPositions($query): array
    {
        $allPositions = $query->latest()->get()->map(fn($position) => [
            "id" => $position->id,
            "pos_name" => $position->pos_name,
            "salary_rate" => $position->deduction->salary_rate ?? null,
            "reg_overtime_rate" => $position->deduction->reg_overtime_rate ?? null,
            "special_overtime_rate" => $position->deduction->special_overtime_rate ?? null,
            "sss_rate" => $position->deduction->sss_rate ?? null,
            "philhealth_rate" => $position->deduction->philhealth_rate ?? null,
            "pagibig_rate" => $position->deduction->pagibig_rate ?? null,
        ]);

        return [
            'data' => $allPositions,
            'total' => $allPositions->count(),
            'perPage' => -1,
            'from' => 1,
            'to' => $allPositions->count(),
            'links' => [],
        ];
    }

    /**
     * Get paginated positions
     */
    protected function getPaginatedPositions($query, int $perPage, Request $request): LengthAwarePaginator
    {
        $positions = $query->latest()->paginate($perPage)->withQueryString();

        $positions->getCollection()->transform(fn($position) => [
            "id" => $position->id,
            "pos_name" => $position->pos_name,
            "salary_rate" => $position->deduction->salary_rate ?? null,
            "reg_overtime_rate" => $position->deduction->reg_overtime_rate ?? null,
            "special_overtime_rate" => $position->deduction->special_overtime_rate ?? null,
            "sss_rate" => $position->deduction->sss_rate ?? null,
            "philhealth_rate" => $position->deduction->philhealth_rate ?? null,
            "pagibig_rate" => $position->deduction->pagibig_rate ?? null,
        ]);

        return $positions;
    }

    /**
     * Get positions for export (all without pagination)
     */
    public function getPositionsForExport(?string $search = null)
    {
        $query = $this->getPositions();

        if ($search) {
            $query->where('pos_name', 'like', "%{$search}%");
        }

        return $query->latest()->get()->map(fn($position) => [
            "id" => $position->id,
            "pos_name" => $position->pos_name,
            "salary_rate" => $position->deduction->salary_rate ?? null,
            "reg_overtime_rate" => $position->deduction->reg_overtime_rate ?? null,
            "special_overtime_rate" => $position->deduction->special_overtime_rate ?? null,
            "sss_rate" => $position->deduction->sss_rate ?? null,
            "philhealth_rate" => $position->deduction->philhealth_rate ?? null,
            "pagibig_rate" => $position->deduction->pagibig_rate ?? null,
        ]);
    }

    /**
     * Get single position by ID with transformation
     */
    public function getPositionById(int $id): ?array
    {
        $position = $this->getPositions()->find($id);

        if (!$position) {
            return null;
        }

        return [
            "id" => $position->id,
            "pos_name" => $position->pos_name,
            "salary_rate" => $position->deduction->salary_rate ?? null,
            "reg_overtime_rate" => $position->deduction->reg_overtime_rate ?? null,
            "special_overtime_rate" => $position->deduction->special_overtime_rate ?? null,
            "sss_rate" => $position->deduction->sss_rate ?? null,
            "philhealth_rate" => $position->deduction->philhealth_rate ?? null,
            "pagibig_rate" => $position->deduction->pagibig_rate ?? null,
        ];
    }

    

   
}