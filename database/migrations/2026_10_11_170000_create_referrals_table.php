<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referred_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('member_name');
            $table->string('member_code')->nullable();
            $table->string('phone')->nullable();
            $table->string('age')->nullable();
            $table->string('gender')->nullable();
            $table->string('village_or_samity')->nullable();
            $table->text('reason');
            $table->date('referral_date');
            $table->string('status')->default('pending');
            $table->timestamp('arrived_at')->nullable();
            $table->text('hospital_notes')->nullable();
            $table->timestamps();

            $table->index(['referred_by', 'referral_date']);
            $table->index(['branch_id', 'referral_date']);
            $table->index(['status', 'referral_date']);
        });

        DB::table('roles')->updateOrInsert(
            ['slug' => 'hospital'],
            ['name' => 'Hospital', 'created_at' => now(), 'updated_at' => now()],
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
        DB::table('roles')->where('slug', 'hospital')->delete();
    }
};
