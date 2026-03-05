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
        Schema::create('attendance_exception_stats', function (Blueprint $table) {
            $table->id();

            $table->string('employee_id', 20);
            $table->string('employee_name')->nullable();
            $table->string('department')->nullable();
            $table->date('date');

            // First time zone = morning / AM shift
            $table->timestamp('am_time_in')->nullable();   // "On-duty" first zone
            $table->timestamp('am_time_out')->nullable();  // "Off-duty" first zone

            // Second time zone = afternoon / PM shift (split-shift setups)
            $table->timestamp('pm_time_in')->nullable();   // "On-duty" second zone
            $table->timestamp('pm_time_out')->nullable();  // "Off-duty" second zone

            // Penalty/exception minutes for this day
            $table->integer('late_minutes')->default(0);         // arrived late
            $table->integer('leave_early_minutes')->default(0);  // left before end of shift
            $table->integer('absence_minutes')->default(0);      // unaccounted absence
            $table->integer('total_exception_minutes')->default(0); // sum of all above

            $table->timestamps();

            // One exception record per employee per day
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
        Schema::dropIfExists('attendance_exception_stats');
    }
};
