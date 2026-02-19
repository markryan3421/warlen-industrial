<?php

namespace App\Http\Controllers;

use App\Actions\Position\CreateNewPosition;
use App\Actions\Position\UpdatePosition;
use App\Http\Requests\Position\StorePositionRequest;
use App\Http\Requests\Position\UpdatePositionRequest;
use App\Models\Position;
use App\Repository\PositionRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PositionController extends Controller
{
    public function __construct(private PositionRepository $positionRepository)
    {
        
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // $positions = Cache::remember('positions', 60, function () {
        //     return $this->positionRepository->getPositions();
        // });

        $positionQuery = $this->positionRepository->getPositions();

        $totalCount = $positionQuery->count();

        // Check if the search query matches any of the data in the database
        if($request->filled('search')) {
            $search = $request->search;

            $positionQuery->where(fn($query) =>
                $query->where('pos_name', 'like', "%{$search}%")
            );
        }

        $filteredCount = $positionQuery->count();

        $perPage = (int) ($request->perPage ?? 10);

        if($perPage === -1) {
            $allPositions = Position::latest()->get()->map(fn($position) => [
                "id" => $position->id,
                "pos_name" => $position->pos_name,
                "salary_rate" => $position->deduction->salary_rate,
                "reg_overtime_rate" => $position->deduction->reg_overtime_rate,
                "special_overtime_rate" => $position->deduction->special_overtime_rate,
                "sss_rate" => $position->deduction->sss_rate,
                "philhealth_rate" => $position->deduction->philhealth_rate,
                "pagibig_rate" => $position->deduction->pagibig_rate,
            ]);

            $positions = [
                'data' => $allPositions,
                'total' => $filteredCount,
                'perPage' => $perPage,
                'from' => 1,
                'to' => $filteredCount,
                'links' => [],
            ];
        } else {
            // This will fetch all the filtered positions that matches the search query
            $positions = $positionQuery->latest()->paginate($perPage)->withQueryString();

            $positions->getCollection()->transform(fn($position) => [
                "id" => $position->id,
                "pos_name" => $position->pos_name,
                "salary_rate" => $position->deduction->salary_rate,
                "reg_overtime_rate" => $position->deduction->reg_overtime_rate,
                "special_overtime_rate" => $position->deduction->special_overtime_rate,
                "sss_rate" => $position->deduction->sss_rate,
                "philhealth_rate" => $position->deduction->philhealth_rate,
                "pagibig_rate" => $position->deduction->pagibig_rate,
            ]);
        }

        // dd($positions);

        $filters = $request->only(['search']);

        return Inertia::render('Position/index', compact('positions', 'filters', 'totalCount', 'filteredCount'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Position/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePositionRequest $request, CreateNewPosition $action)
    {
        try {
            DB::beginTransaction();

            $action->create($request->validated());

            $this->cacheForget('positions');

            DB::commit();

            return to_route('positions.index')->with('success', 'Position created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return to_route('positions.index')->with('error', 'Failed to create position. Please try again.' . $e->getMessage());
        }
    }


    /**
     * Display the specified resource.
     */
    public function show(Position $position)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Position $position)
    {
        $position->load(['deduction' => function ($query) {
            $query->deductionsOnly();
        }]);
        
        return Inertia::render('Position/edit', compact('position'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePositionRequest $request, Position $position, UpdatePosition $action)
    {
        try {
            DB::beginTransaction();

            $action->update($request->validated(), $position);

            $this->cacheForget('positions');

            DB::commit();

            return to_route('positions.index')->with('success', 'Position updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return to_route('positions.index')->with('error', 'Failed to update position. Please try again.' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Position $position)
    {
        $position->delete();

        $this->cacheForget('positions');

        return to_route('positions.index')->with('success', 'Position deleted successfully.');
    }
}
