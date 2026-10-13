<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $type
 * @property int|null $referral_id
 * @property int $user_id
 * @property int|null $branch_id
 * @property int|null $recorded_by
 * @property string $member_name
 * @property string|null $member_code
 * @property string|null $phone
 * @property string|null $village_or_samity
 * @property string|null $previous_treatment
 * @property string|null $outcome
 * @property string|null $medicines
 * @property string|null $treatment
 * @property Carbon $follow_up_date
 * @property string|null $notes
 */
class FollowUp extends Model
{
    public const TYPE_REFERRED = 'referred';

    public const TYPE_CUSTOM = 'custom';

    public const OUTCOME_WENT = 'went';

    public const OUTCOME_DID_NOT_GO = 'did_not_go';

    protected $fillable = [
        'type',
        'referral_id',
        'user_id',
        'branch_id',
        'recorded_by',
        'member_name',
        'member_code',
        'phone',
        'village_or_samity',
        'previous_treatment',
        'outcome',
        'medicines',
        'treatment',
        'follow_up_date',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'follow_up_date' => 'date:Y-m-d',
        ];
    }

    /**
     * @return BelongsTo<Referral, $this>
     */
    public function referral(): BelongsTo
    {
        return $this->belongsTo(Referral::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
