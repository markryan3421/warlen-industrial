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
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            // Employee info (denormalized for easy reporting)
            $table->string('employee_id', 20);        // biometric device ID e.g. "1444"
            $table->string('employee_name')->nullable();
            $table->string('department')->nullable();

            // Attendance
            $table->date('date');
            $table->timestamp('time_in')->nullable();
            $table->timestamp('time_out')->nullable();
            $table->decimal('total_hours', 5, 2)->nullable();  // e.g. 9.25
            $table->boolean('is_overtime')->default(false);

            // Optional FK if have employees table
            // $table->foreignId('employee_record_id')
            //       ->nullable()
            //       ->constrained('employees')
            //       ->nullOnDelete();

            // One record per employee per day
            $table->unique(['employee_id', 'date']);

            // Query indexes
            $table->index('date');
            $table->index('employee_id');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_logs');
    }
};
