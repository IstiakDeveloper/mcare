<?php

namespace App\Models;

use Database\Factories\HealthCampFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $branch_id
 * @property int $entered_by
 * @property Carbon $activity_date
 * @property array<string, mixed>|null $service_data
 */
class HealthCamp extends Model
{
    /** @use HasFactory<HealthCampFactory> */
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'entered_by',
        'activity_date',
        'service_data',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'activity_date' => 'date:Y-m-d',
            'service_data' => 'array',
        ];
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
    public function enteredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }
}
