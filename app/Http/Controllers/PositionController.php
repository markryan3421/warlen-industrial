<?php

namespace App\Http\Controllers;

use App\Actions\Position\CreateNewPosition;
use App\Actions\Position\UpdatePosition;
use App\Http\Requests\Position\StorePositionRequest;
use App\Http\Requests\Position\UpdatePositionRequest;
use App\Models\Position;
use App\Repository\PositionRepository;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PositionController extends Controller
{
    public function __construct(private PositionRepository $positionRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
<<<<<<< HEAD
        $positions= $this->positionRepository->getPositions();
=======
        
        $positions = Position::all();
>>>>>>> 3a7745a744ff303fc9e00f174d87560e9b0b6895

        return Inertia::render('positions/index', compact('positions'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('positions/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePositionRequest $request, CreateNewPosition $position)
    {
        $position->create($request->validated());

        DB::commit();
        return redirect()->route('positions.index');

    }

    /**
     * Display the specified resource.
     */
    public function show(Position $position)
    {
        return Inertia::render('positions.show', compact('position'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Position $position)
    {
        return Inertia::render('positions/update', compact('position'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePositionRequest $request, UpdatePosition $updateposition, Position $position)
    {
        $updateposition->update($request->validated(), $position);

        DB::commit();

        return redirect()->route('positions.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Position $position)
    {
        $position->delete();

        DB::commit();
        return redirect()->route('positions.index');
    }
}
