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
        Schema::create('application_leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Employee::class,'employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('slug_app')->unique();
            $table->date('leave_start');
            $table->date('leave_end');
            $table->longText('reason_to_leave');
            $table->enum('app_status',['pending','approved', 'rejected'])->default('pending');
            $table->text('remarks')->nullable();
            $table->string('approved_by')->nullable();
            $table->string('rejected_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_leaves');
    }
};
