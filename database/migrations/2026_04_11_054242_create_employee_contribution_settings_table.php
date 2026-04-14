<?php

use App\Models\ContributionVersion;
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
        Schema::create('employee_contribution_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Employee::class, 'employee_id')->constrained('employees')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('contribution_version_id')->constrained('contribution_versions')->cascadeOnUpdate()->cascadeOnDelete();
            $table->boolean('is_exempted')->default(false);
            $table->decimal('fixed_amount', 15, 2)->nullable(); // For pagibig & philhealth only
            $table->decimal('contributed_amount', 15, 2)->nullable();// total contributed sss and pagibig;
            $table->decimal('remaining_balance', 15, 2)->nullable(); //base on employee_share 

            $table->decimal('monthly_cap', 15, 2)->nullable();  //for pagibig only
            $table->timestamps();

            $table->unique(['employee_id', 'contribution_version_id'], 'employee_contribution_settings_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_contribution_settings');
    }
};
