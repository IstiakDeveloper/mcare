<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_subtypes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_type_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['task_type_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_subtypes');
    }
};
