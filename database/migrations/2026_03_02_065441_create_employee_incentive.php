<?php

use App\Models\Employee;
use App\Models\Incentive;
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
        Schema::create('employee_incentives', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Employee::class,'employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignIdFor(Incentive::class,'incentive_id')->constrained('incentives')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_incentives');
    }
};
