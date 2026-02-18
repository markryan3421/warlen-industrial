<?php

use App\Models\Branch;
use App\Models\Position;
use App\Models\User;
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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Position::class,'position_id')->constrained('positions')->cascadeOnDelete();
            $table->foreignIdFor(Branch::class,'branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignIdFor(User::class,'user_id')->constrained('users')->cascadeOnDelete();
            $table->string('employee_number')->unique();
            $table->string('emergency_contact_number');
            $table->enum('department',['weekender','monthly','semi_monthly'])->default('monthly');
            $table->enum('employee_status',['active','inactive'])->default('active');

        
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
