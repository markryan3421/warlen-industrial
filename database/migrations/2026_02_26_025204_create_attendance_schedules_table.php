<?php

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
        Schema::create('attendance_schedules', function (Blueprint $table) {
            $table->id();

            $table->string('employee_id', 20);
            $table->string('employee_name')->nullable();
            $table->string('department')->nullable();
            $table->date('date');

            // The shift code assigned for this day (nullable = holiday)
            $table->string('shift_code')->nullable();

            // Human-readable shift label derived from shift_code
            // e.g. "Normal", "Ask for Leave", "Out", "Holiday"
            $table->string('shift_label')->nullable();

            $table->timestamps();

            $table->unique(['employee_id', 'date']);
            $table->index('employee_id');
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_schedules');
    }
};
