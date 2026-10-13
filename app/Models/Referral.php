<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $referred_by
 * @property int|null $branch_id
 * @property int|null $created_by
 * @property int|null $recorded_by
 * @property string $member_name
 * @property string|null $member_code
 * @property string|null $phone
 * @property string|null $age
 * @property string|null $gender
 * @property string|null $village_or_samity
 * @property string $reason
 * @property Carbon $referral_date
 * @property string $status
 * @property Carbon|null $arrived_at
 * @property string|null $hospital_notes
 */
class Referral extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_WENT = 'went';

    public const STATUS_DID_NOT_GO = 'did_not_go';

    protected $fillable = [
        'referred_by',
        'branch_id',
        'created_by',
        'recorded_by',
        'member_name',
        'member_code',
        'phone',
        'age',
        'gender',
        'village_or_samity',
        'reason',
        'referral_date',
        'status',
        'arrived_at',
        'hospital_notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'referral_date' => 'date:Y-m-d',
            'arrived_at' => 'datetime',
        ];
    }

    /**
     * @return HasOne<FollowUp, $this>
     */
    public function followUp(): HasOne
    {
        return $this->hasOne(FollowUp::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function referredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
