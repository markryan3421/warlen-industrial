<?php

namespace App\Http\Controllers;

use App\Actions\Position\CreateNewPosition;
use App\Actions\Position\UpdatePosition;
use App\Http\Requests\Position\StorePositionRequest;
use App\Http\Requests\Position\UpdatePositionRequest;
use App\Models\Position;
use App\Repository\PositionRepository;
use App\Traits\HasPaginatedIndex;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Testing\Fluent\Concerns\Has;
use Inertia\Inertia;

class PositionController extends Controller
{
    use HasPaginatedIndex;

    public function __construct(private PositionRepository $positionRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Position::class);

        $positions= $this->positionRepository->getPositions();

        $result = $this->paginateCollection(
            items: collect($positions), // wrap in Collection if not already
            request: $request,
            searchColumns: ['pos_name', 'basic_salary'], 
        );

        return Inertia::render('positions/index', [
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
        return Inertia::render('positions/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePositionRequest $request, CreateNewPosition $position)
    {
        Gate::authorize('create', Position::class);
        $position->create($request->validated());

       // DB::commit();
        return redirect()->route('positions.index');

    }

    /**
     * Display the specified resource.
     */
    public function show(Position $position)
    {
        Gate::authorize('view', $position);
        return Inertia::render('positions.show', compact('position'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Position $position)
    {
        Gate::authorize('update', $position);
        return Inertia::render('positions/edit', compact('position'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePositionRequest $request, UpdatePosition $updateposition, Position $position)
    {
        Gate::authorize('update', $position);
        $updateposition->update($request->validated(), $position);

        //DB::commit();

        return redirect()->route('positions.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Position $position)
    {
        Gate::authorize('delete', $position);
        $position->delete();

       // DB::commit();
        return redirect()->route('positions.index');
    }
    
}
