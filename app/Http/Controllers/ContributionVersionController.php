<?php

namespace App\Http\Controllers;

use App\Actions\Contribution\CreateNewContribution;
use App\Actions\Contribution\UpdateContribution;
use App\Actions\Deduction\UpdateDeduction;
use App\Http\Requests\Contribution\StoreContributionRequest;
use App\Http\Requests\Contribution\UpdateContributionRequest;
use App\Models\ContributionVersion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContributionVersionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
       return Inertia::render('Contributions/index', [
            'contributionVersions' => ContributionVersion::with('contributionBrackets')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Contributions/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreContributionRequest $request, CreateNewContribution $action)
    {
        $action->createContribution($request->validated());

        return to_route('contribution-versions.index')->with('success', 'Contribution created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(ContributionVersion $contributionVersion)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ContributionVersion $contributionVersion)
    {
        $contributionVersion->load('contributionBrackets');

        return Inertia::render('Contributions/edit', compact('contributionVersion'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateContributionRequest $request, ContributionVersion $contributionVersion, UpdateContribution $action)
    {
        $action->updateContribution($request->validated(), $contributionVersion);

        return to_route('contribution-versions.index')->with('success', 'Contribution updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ContributionVersion $contributionVersion)
    {
        $contributionVersion->delete();

        return to_route('contribution-versions.index')->with('success', 'Contribution deleted successfully.');
    }
}
