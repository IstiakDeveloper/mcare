<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('follow_ups', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->foreignId('referral_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('member_name');
            $table->string('member_code')->nullable();
            $table->string('phone')->nullable();
            $table->string('village_or_samity')->nullable();
            $table->text('previous_treatment')->nullable();
            $table->string('outcome')->nullable();
            $table->text('medicines')->nullable();
            $table->text('treatment')->nullable();
            $table->date('follow_up_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['type', 'follow_up_date']);
            $table->index(['user_id', 'follow_up_date']);
            $table->index(['branch_id', 'follow_up_date']);
            $table->index(['outcome', 'follow_up_date']);
        });

        $legacy = DB::table('referrals')->whereIn('status', ['arrived', 'not_arrived'])->orderBy('id')->get();

        foreach ($legacy as $referral) {
            $went = $referral->status === 'arrived';
            $followUpDate = $referral->referral_date;
            if ($went && $referral->arrived_at) {
                $followUpDate = substr((string) $referral->arrived_at, 0, 10);
            }

            DB::table('follow_ups')->insert([
                'type' => 'referred',
                'referral_id' => $referral->id,
                'user_id' => $referral->referred_by,
                'branch_id' => $referral->branch_id,
                'recorded_by' => $referral->recorded_by,
                'member_name' => $referral->member_name,
                'member_code' => $referral->member_code,
                'phone' => $referral->phone,
                'village_or_samity' => $referral->village_or_samity,
                'previous_treatment' => null,
                'outcome' => $went ? 'went' : 'did_not_go',
                'medicines' => null,
                'treatment' => $went ? $referral->hospital_notes : null,
                'follow_up_date' => $followUpDate,
                'notes' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('referrals')->where('id', $referral->id)->update([
                'status' => $went ? 'went' : 'did_not_go',
            ]);
        }
    }

    public function down(): void
    {
        DB::table('referrals')->where('status', 'went')->update(['status' => 'arrived']);
        DB::table('referrals')->where('status', 'did_not_go')->update(['status' => 'not_arrived']);
        Schema::dropIfExists('follow_ups');
    }
};
