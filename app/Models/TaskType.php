<?php

namespace App\Models;

use Database\Factories\TaskTypeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property bool $requires_subtype
 * @property int $sort_order
 */
class TaskType extends Model
{
    /** @use HasFactory<TaskTypeFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'requires_subtype',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'requires_subtype' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @return HasMany<TaskSubtype, $this>
     */
    public function subtypes(): HasMany
    {
        return $this->hasMany(TaskSubtype::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<DailyActivity, $this>
     */
    public function dailyActivities(): HasMany
    {
        return $this->hasMany(DailyActivity::class);
    }
}
