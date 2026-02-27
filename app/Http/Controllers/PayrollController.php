<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PayrollController extends Controller
{
    public function index() {
        return Inertia::render("payroll/Index");
    }
}
