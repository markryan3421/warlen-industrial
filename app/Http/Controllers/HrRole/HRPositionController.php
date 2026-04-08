<?php

namespace App\Http\Controllers\HrRole;

use App\Actions\Position\CreateNewPosition;
use App\Actions\Position\UpdatePosition;
use App\Http\Controllers\Controller;
use App\Http\Requests\Position\StorePositionRequest;
use App\Http\Requests\Position\UpdatePositionRequest;
use App\Models\Position;
use App\Repository\PositionRepository;
use App\Traits\HasPaginatedIndex;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class HRPositionController extends Controller
{
    use HasPaginatedIndex;

    public function __construct(private PositionRepository $positionRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Position::class);

        $positions = $this->positionRepository->getPositions();

        $result = $this->paginateCollection(
            items: collect($positions), // wrap in Collection if not already
            request: $request,
            searchColumns: ['pos_name', 'basic_salary'],
        );

        return Inertia::render('HR/positions/index', [
            'positions'      => [
                'data' => $result['data'],
                'links' => $result['pagination']['links'] ?? [],
                'from' => $result['pagination']['from'] ?? 0,
                'to' => $result['pagination']['to'] ?? 0,
                'total' => $result['totalCount'],
            ],
            'filters'       => $result['filters'],
            'totalCount'    => $result['totalCount'],
            'filteredCount' => $result['filteredCount'],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', Position::class);
        return Inertia::render('HR/positions/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePositionRequest $request, CreateNewPosition $position)
    {
        Gate::authorize('create', Position::class);
        $position->create($request->validated());

        return redirect()->route('hr.positions.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Position $position)
    {
        Gate::authorize('view', $position);
        return Inertia::render('HR/positions/show', compact('position'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Position $position)
    {
        Gate::authorize('update', $position);
        return Inertia::render('HR/positions/edit', compact('position'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePositionRequest $request, UpdatePosition $updateposition, Position $position)
    {
        Gate::authorize('update', $position);
        $updateposition->update($request->validated(), $position);

        return redirect()->route('hr.positions.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Position $position)
    {
        Gate::authorize('delete', $position);
        $position->delete();

        return redirect()->route('hr.positions.index');
    }
}
