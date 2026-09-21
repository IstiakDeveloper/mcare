<?php

namespace App\Models;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $branch_id
 * @property string $member_name
 * @property string $member_code
 * @property string $health_card_number
 * @property CarbonInterface $entry_date
 * @property CarbonInterface $expire_date
 * @property string|null $phone
 * @property string|null $village_or_samity
 * @property string|null $notes
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read User $user
 * @property-read Branch|null $branch
 */
#[Fillable([
    'user_id',
    'branch_id',
    'member_name',
    'member_code',
    'health_card_number',
    'entry_date',
    'expire_date',
    'phone',
    'village_or_samity',
    'notes',
])]
class HealthCardDisburse extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'entry_date' => 'date',
            'expire_date' => 'date',
        ];
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
     * Calculate remaining days until expiration.
     * Positive = days left, Negative = days past expired.
     */
    public function getDaysRemainingAttribute(): int
    {
        $today = Carbon::today();
        return (int) $today->diffInDays($this->expire_date, false);
    }

    /**
     * Determine validity status: 'active', 'expiring_soon', 'expired'
     */
    public function getValidityStatusAttribute(): string
    {
        $days = $this->days_remaining;

        if ($days < 0) {
            return 'expired';
        }

        if ($days <= 30) {
            return 'expiring_soon';
        }

        return 'active';
    }
}
