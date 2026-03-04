<?php

namespace App\Http\Controllers;

use App\Actions\Contribution\CreateNewContribution;
use App\Actions\Contribution\UpdateContribution;
use App\Http\Requests\Contribution\StoreContributionRequest;
use App\Http\Requests\Contribution\UpdateContributionRequest;
use App\Models\ContributionVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ContributionVersionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', ContributionVersion::class);
        return Inertia::render('Contributions/index', [
            'contributionVersions' => ContributionVersion::with('contributionBrackets')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', ContributionVersion::class);
        return Inertia::render('Contributions/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreContributionRequest $request, CreateNewContribution $action)
    {
        Gate::authorize('create', ContributionVersion::class);
        if ($this->limit('store-contribution:' . auth()->id(), 60, 20)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        DB::beginTransaction();

        try {
            $action->createContribution($request->validated());

            DB::commit();

            return to_route('contribution-versions.index')->with('success', 'Contribution created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors('An error occurred while creating the contribution. Please try again.');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(ContributionVersion $contributionVersion)
    {
        Gate::authorize('view', $contributionVersion);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ContributionVersion $contributionVersion)
    {
        Gate::authorize('update', $contributionVersion);
        $contributionVersion->load('contributionBrackets');

        return Inertia::render('Contributions/edit', compact('contributionVersion'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateContributionRequest $request, ContributionVersion $contributionVersion, UpdateContribution $action)
    {
        Gate::authorize('update', $contributionVersion);
        if ($this->limit('update-contribution:' . auth()->id(), 60, 20)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        DB::beginTransaction();

        try {
            $action->updateContribution($request->validated(), $contributionVersion);

            DB::commit();

            return to_route('contribution-versions.index')->with('success', 'Contribution updated successfully.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors('An error occurred while updating the contribution. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ContributionVersion $contributionVersion)
    {
        Gate::authorize('delete', $contributionVersion);
        $contributionVersion->delete();

        return to_route('contribution-versions.index')->with('success', 'Contribution deleted successfully.');
    }
}
