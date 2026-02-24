<?php

use App\Models\Employee;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Employee::class,'employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('work_date');
            $table->time('am_in');
            $table->time('am_out');
            // $table->time('am_break_time');
            // $table->time('pm_break_time');
            $table->time('pm_in');
            $table->time('pm_out');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
