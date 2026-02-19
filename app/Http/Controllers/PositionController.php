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
    public function __construct(private PositionRepository $positionRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $data = $this->positionRepository->getFilteredPositions($request);

        return Inertia::render('Position/index', [
            'positions' => $data['positions'],
            'filters' => $data['filters'],
            'totalCount' => $data['totalCount'],
            'filteredCount' => $data['filteredCount'],
        ]);
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
        if ($this->limit('create-position:' . auth()->id(), 60, 25)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
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
        if ($this->limit('update-position:' . auth()->id(), 60, 25)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
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
        if ($this->limit('delete-position:' . auth()->id(), 60, 10)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        $position->delete();

        $this->cacheForget('positions');

        return to_route('positions.index')->with('success', 'Position deleted successfully.');
    }
}
