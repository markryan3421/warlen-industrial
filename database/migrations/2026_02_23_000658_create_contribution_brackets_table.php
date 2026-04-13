<?php

use App\Models\ContributionVersion;
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
        Schema::create('contribution_brackets', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(ContributionVersion::class,'contribution_version_id')->constrained('contribution_versions')->cascadeOnDelete();
            $table->decimal('salary_from', 15, 2);
            $table->decimal('salary_to', 15, 2);
            $table->decimal('employee_share',12,2);
            $table->decimal('employer_share',12,2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contribution_brackets');
    }
};
