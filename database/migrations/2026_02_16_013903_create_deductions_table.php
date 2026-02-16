<?php

use App\Models\Position;
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
        Schema::create('deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Position::class,'position_id')->constrained('positions')->cascadeOnDelete();
            $table->float('salary_rate', 8, 2);
            $table->float('reg_overtime_rate', 8, 2);
            $table->float('special_overtime_rate', 8, 2);
            $table->float('sss_rate', 8, 2);
            $table->float('philhealth_rate', 8, 2);
            $table->float('pagibig_rate', 8, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deductions');
    }
};
