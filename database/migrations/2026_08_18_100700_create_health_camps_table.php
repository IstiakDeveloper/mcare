<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_camps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->restrictOnDelete();
            $table->foreignId('entered_by')->constrained('users')->restrictOnDelete();
            $table->date('activity_date');
            $table->json('service_data')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'activity_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_camps');
    }
};
