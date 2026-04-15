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
        Schema::create('ai_insights', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // 'payroll', 'attendance', 'turnover', etc.
            $table->string('title');
            $table->text('description');
            $table->string('impact')->nullable(); // 'high', 'medium', 'low'
            $table->boolean('actionable')->default(false);
            $table->json('metadata')->nullable(); // Store additional data
            $table->timestamp('analyzed_at');
            
            // Indexes for performance
            $table->index(['type', 'analyzed_at']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_insights');
    }
};
