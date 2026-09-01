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
        Schema::create('fee_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->date('collection_date');
            $table->string('collection_type'); // ডায়াবেটিস পরীক্ষা, স্ট্যাটিক ক্লিনিক, স্যাটেলাইট ক্লিনিক, স্বাস্থ্যক্যাম্প, অন্যান্য
            $table->string('beneficiary_name');
            $table->string('beneficiary_type')->default('সদস্য'); // সদস্য, অ-সদস্য
            $table->string('age')->nullable();
            $table->string('phone')->nullable();
            $table->string('location_info')->nullable(); // সমিতি / শাখা / গ্রামের নাম
            $table->string('diabetes_reading')->nullable(); // মাত্রা (ডায়াবেটিস রিডিং)
            $table->decimal('amount', 10, 2)->default(0.00); // আদায়কৃত ফি (টাকা)
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_collections');
    }
};
