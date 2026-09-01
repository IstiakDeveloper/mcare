<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('samity_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('task_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('task_subtype_id')->nullable()->constrained()->nullOnDelete();
            $table->date('activity_date');
            $table->json('form_data')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'activity_date']);
            $table->index(['branch_id', 'activity_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_activities');
    }
};
