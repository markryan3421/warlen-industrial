<?php

use App\Models\Branch;
use App\Models\Position;
use App\Models\Site;
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
            $table->foreignIdFor(Position::class,'position_id')->nullable()->constrained('positions')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignIdFor(Branch::class,'branch_id')->nullable()->constrained('branches')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignIdFor(User::class,'user_id')->constrained('users')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignIdFor(Site::class,'site_id')->nullable()->constrained('sites')->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('slug_emp')->unique();
            $table->string('employee_number')->unique();
            $table->integer('emp_code')->unique()->index();
            $table->string('emergency_contact_number');
            $table->date('contract_start_date');
            $table->date('contract_end_date');
            $table->enum('pay_frequency',['weekender','monthly','semi_monthly'])->default('monthly');
            $table->enum('employee_status',['active','inactive'])->default('active'); // base on  contract end date

            $table->softDeletes();
        
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
