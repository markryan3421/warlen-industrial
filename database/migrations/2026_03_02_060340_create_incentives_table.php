<?php


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
        Schema::create('incentives', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(PayrollPeriod::class,'payroll_period_id')->constrained('payroll_periods')->cascadeOnDelete();
            $table->string('incentive_name');
            $table->string('incentive_amount');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incentives');
    }
};
