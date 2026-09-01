<?php

namespace App\Models;

use Database\Factories\BranchFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $external_hrm_id
 * @property string $name
 * @property string|null $branch_code
 * @property string|null $address
 * @property string|null $contact_number
 * @property bool $is_active
 */
class Branch extends Model
{
    /** @use HasFactory<BranchFactory> */
    use HasFactory;

    protected $fillable = [
        'external_hrm_id',
        'name',
        'branch_code',
        'address',
        'contact_number',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'external_hrm_id' => 'integer',
        ];
    }

    /**
     * @param  Builder<Branch>  $query
     * @return Builder<Branch>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @return HasMany<Samity, $this>
     */
    public function samities(): HasMany
    {
        return $this->hasMany(Samity::class);
    }

    /**
     * @return HasMany<DailyActivity, $this>
     */
    public function dailyActivities(): HasMany
    {
        return $this->hasMany(DailyActivity::class);
    }

    /**
     * @return HasMany<HealthCamp, $this>
     */
    public function healthCamps(): HasMany
    {
        return $this->hasMany(HealthCamp::class);
    }
}
