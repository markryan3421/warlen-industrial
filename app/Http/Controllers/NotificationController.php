<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\In;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $notifs = Auth::user()->unReadNotifications;
        dd($notifs);

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
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        if ($request->has('markAllAsRead')) {
            Auth::user()->unreadNotifications->markAsRead();
            return back()->with('success', 'All notifications marked as read.');
        }

        if ($request->has('markAsRead')) {
            Auth::user()->notifications->where('id', $id)->markAsRead();
            return back()->with('success', 'Notification marked as read.');
        }
        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request,string $id)
    {
        if($request->has('delete-all')){
            Auth::user()->notifications()->delete();
            return back()->with('success', 'All notifications deleted.');
        }
        if($request->has('delete')){
            Auth::user()->notifications()->where('id', $id)->delete();
            return back()->with('success', 'Notification deleted.');
        }
        return back();
    }
}
