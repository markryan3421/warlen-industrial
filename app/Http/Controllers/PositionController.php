<?php

namespace App\Http\Controllers;

use App\Actions\Position\CreateNewPosition;
use App\Actions\Position\UpdatePosition;
use App\Http\Requests\Position\StorePositionRequest;
use App\Http\Requests\Position\UpdatePositionRequest;
use App\Models\Position;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PositionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
<<<<<<< HEAD
        $positions= $this->positionRepository->getPositions();

        // $totalCount = $positionQuery->count();

        // // Check if the search query matches any of the data in the database
        // if($request->filled('search')) {
        //     $search = $request->search;

        //     $positionQuery->where(fn($query) =>
        //         $query->where('pos_name', 'like', "%{$search}%")
        //     );
        // }

        // $filteredCount = $positionQuery->count();

        // $perPage = (int) ($request->perPage ?? 10);

        // if($perPage === -1) {
        //     $allPositions = Position::latest()->get()->map(fn($position) => [
        //         "id" => $position->id,
        //         "pos_name" => $position->pos_name,
        //         "salary_rate" => $position->deduction->salary_rate,
        //         "reg_overtime_rate" => $position->deduction->reg_overtime_rate,
        //         "special_overtime_rate" => $position->deduction->special_overtime_rate,
        //         "sss_rate" => $position->deduction->sss_rate,
        //         "philhealth_rate" => $position->deduction->philhealth_rate,
        //         "pagibig_rate" => $position->deduction->pagibig_rate,
        //     ]);

        //     $positions = [
        //         'data' => $allPositions,
        //         'total' => $filteredCount,
        //         'perPage' => $perPage,
        //         'from' => 1,
        //         'to' => $filteredCount,
        //         'links' => [],
        //     ];
        // } else {
        //     // This will fetch all the filtered positions that matches the search query
        //     $positions = $positionQuery->latest()->paginate($perPage)->withQueryString();

        //     $positions->getCollection()->transform(fn($position) => [
        //         "id" => $position->id,
        //         "pos_name" => $position->pos_name,
        //        // "salary_rate" => $position->deduction->salary_rate,
        //         "reg_overtime_rate" => $position->deduction->reg_overtime_rate,
        //         "special_overtime_rate" => $position->deduction->special_overtime_rate,
        //         "sss_rate" => $position->deduction->sss_rate,
        //         "philhealth_rate" => $position->deduction->philhealth_rate,
        //         "pagibig_rate" => $position->deduction->pagibig_rate,
        //     ]);
        // }

        // // dd($positions);

        // $filters = $request->only(['search']);

        return Inertia::render('Position/index', compact('positions'));
=======
        $positions = Position::all();
        return Inertia::render('positions/index', compact('positions'));
>>>>>>> 7520b3d359a76f941d05328b3b126be743e502e8
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
