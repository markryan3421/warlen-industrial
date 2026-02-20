<?php

namespace App\Http\Controllers;

use App\Http\Requests\PermissionRequest;
use App\Models\Permission;
// use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $permissions = Permission::latest()->paginate(5);
        return Inertia::render('permissions/index', compact('permissions'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PermissionRequest $request)
    {
        $permission = Permission::create([
            'module' => $request->module,
            'label' => $request->label,
            'name' => Str::slug($request->label),
            'description' => $request->description,
        ]);

        if($permission) {
            return redirect()->route('permissions.index')->with('success', 'Permission created successfully.');
        }

        return redirect()->back()->with('error', 'Unable to create permission, try again.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Permission $permission)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Permission $permission)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PermissionRequest $request, Permission $permission)
    {
        if($permission) {
            $permission->module = $request->module;
            $permission->label = $request->label;
            $permission->name = Str::slug($request->label);
            $permission->description = $request->description;

            $permission->save();
            return redirect()->route('permissions.index')->with('success', 'Permission updated successfully.');
        }

        return redirect()->back()->with('error', 'Unable to update permission, try again.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Permission $permission)
    {
        if($permission) {
            $permission->delete();
            return redirect()->route('permissions.index')->with('success', 'Permission deleted successfully.');
        }
        return redirect()->back()->with('error', 'Unable to delete permission, try again.');
    }
}
