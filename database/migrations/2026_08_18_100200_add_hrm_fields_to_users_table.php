<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('external_hrm_id')->nullable()->unique()->after('id');
            $table->string('employee_code')->nullable()->index()->after('external_hrm_id');
            $table->string('designation')->nullable()->after('name');
            $table->string('phone')->nullable()->after('email');
            $table->foreignId('role_id')->nullable()->after('phone')->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->after('role_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
            $table->dropConstrainedForeignId('role_id');
            $table->dropColumn([
                'external_hrm_id',
                'employee_code',
                'designation',
                'phone',
            ]);
        });
    }
};
