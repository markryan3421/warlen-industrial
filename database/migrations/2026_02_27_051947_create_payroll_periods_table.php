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
        Schema::create('payroll_periods', function (Blueprint $table) {
            $table->id();
            $table->date('start_date');
            $table->date('end_date');
            $table->date('pay_date')->nullable();
            $table->enum('payroll_per_status', ['open', 'processing', 'completed'])->default('open');
            $table->boolean('is_paid')->default(false);
            $table->timestamps();
        });
        /*
          if open user pwedi paka add employee check
            sng attencdance and incentives if processing nd na pwedi mabase ni sa queue sng payroll for autogenerate
        */
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_periods');
    }
};
