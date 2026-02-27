<?php

use App\Models\Employee;
use App\Models\PayrollPeriod;
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
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(PayrollPeriod::class, 'payroll_period_id')->constrained('payroll_periods')->cascadeOnDelete();
            $table->foreignIdFor(Employee::class, 'employee_id')->constrained('employees')->cascadeOnDelete();
            $table->decimal('gross_pay');
            $table->decimal('net_pay');
            $table->decimal('total_deduction');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
