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
        Schema::create('attendance_period_stats', function (Blueprint $table) {
            $table->id();

            $table->string('employee_id', 20);
            $table->string('employee_name')->nullable();
            $table->string('department')->nullable();

            // The date range this summary covers
            $table->date('period_start');
            $table->date('period_end');

            // Work hours
            $table->decimal('normal_work_hours', 6, 2)->default(0);  // scheduled hours
            $table->decimal('real_work_hours', 6, 2)->default(0);    // actual hours worked

            // Late
            $table->integer('late_times')->default(0);        // number of late arrivals
            $table->integer('late_minutes')->default(0);      // total late minutes

            // Leave early
            $table->integer('leave_early_times')->default(0); // number of early departures
            $table->integer('leave_early_minutes')->default(0);

            // Overtime hours
            $table->decimal('overtime_workday', 5, 2)->default(0);  // OT on regular days
            $table->decimal('overtime_holiday', 5, 2)->default(0);  // OT on holidays
            $table->decimal('overtime_label', 5, 2)->default(0);    // labeled/tagged OT

            // Attendance day counts (stored as "6/6" string → split into two ints)
            $table->integer('scheduled_days')->default(0);   // normal days scheduled
            $table->integer('attended_days')->default(0);    // days actually attended

            // Leave / absence day counts
            $table->decimal('out_days', 4, 1)->default(0);    // official out days
            $table->decimal('absent_days', 4, 1)->default(0); // unexcused absences
            $table->decimal('afl_days', 4, 1)->default(0);    // ask-for-leave days

            // Payment figures (stored as raw values from biometric system)
            $table->decimal('overtime_pay', 10, 2)->default(0);
            $table->decimal('subsidy_pay', 10, 2)->default(0);
            $table->decimal('late_leave_deduction', 10, 2)->default(0);
            $table->decimal('afl_deduction', 10, 2)->default(0);
            $table->decimal('cut_payment', 10, 2)->default(0);
            $table->decimal('real_pay', 10, 2)->default(0);

            $table->string('note')->nullable();

            $table->timestamps();

            // One summary per employee per period
            $table->unique(['employee_id', 'period_start', 'period_end'], 'att_period_stats_unique');
            $table->index('employee_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_period_stats');
    }
};
