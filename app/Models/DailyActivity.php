<?php

namespace App\Models;

use Database\Factories\DailyActivityFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $branch_id
 * @property int|null $samity_id
 * @property int $task_type_id
 * @property int|null $task_subtype_id
 * @property Carbon $activity_date
 * @property array<string, mixed>|null $form_data
 */
class DailyActivity extends Model
{
    /** @use HasFactory<DailyActivityFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'branch_id',
        'samity_id',
        'task_type_id',
        'task_subtype_id',
        'activity_date',
        'form_data',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'activity_date' => 'date:Y-m-d',
            'form_data' => 'array',
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
     * @return BelongsTo<Samity, $this>
     */
    public function samity(): BelongsTo
    {
        return $this->belongsTo(Samity::class);
    }

    /**
     * @return BelongsTo<TaskType, $this>
     */
    public function taskType(): BelongsTo
    {
        return $this->belongsTo(TaskType::class);
    }

    /**
     * @return BelongsTo<TaskSubtype, $this>
     */
    public function taskSubtype(): BelongsTo
    {
        return $this->belongsTo(TaskSubtype::class);
    }
}
