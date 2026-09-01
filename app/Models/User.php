<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property int|null $external_hrm_id
 * @property string|null $employee_code
 * @property string $name
 * @property string|null $username
 * @property string|null $designation
 * @property string $email
 * @property string|null $phone
 * @property int|null $role_id
 * @property int|null $branch_id
 * @property CarbonInterface|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property CarbonInterface|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Role|null $role
 * @property-read Branch|null $branch
 */
#[Fillable([
    'external_hrm_id',
    'employee_code',
    'name',
    'username',
    'designation',
    'email',
    'phone',
    'password',
    'role_id',
    'branch_id',
    'email_verified_at',
])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'external_hrm_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Role, $this>
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
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
        return $this->hasMany(HealthCamp::class, 'entered_by');
    }

    public function isAdmin(): bool
    {
        return $this->role?->slug === 'admin';
    }

    public function isBranchManager(): bool
    {
        return $this->role?->slug === 'branch-manager';
    }

    public function isWorker(): bool
    {
        return $this->role?->slug === 'worker' || $this->role === null;
    }

    public function canViewAnalytics(): bool
    {
        return $this->isAdmin() || $this->isBranchManager();
    }

    public function canSyncHrm(): bool
    {
        return $this->isAdmin();
    }

    /**
     * Health Camp entry is currently a generic permission.
     */
    public function canEnterHealthCamp(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function toSharedArray(): array
    {
        $this->loadMissing(['role', 'branch']);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'avatar' => null,
            'email_verified_at' => $this->email_verified_at,
            'two_factor_enabled' => $this->two_factor_confirmed_at !== null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'employee_code' => $this->employee_code,
            'designation' => $this->designation,
            'phone' => $this->phone,
            'role' => $this->role?->slug,
            'role_name' => $this->role?->name,
            'can_view_analytics' => $this->canViewAnalytics(),
            'can_sync_hrm' => $this->canSyncHrm(),
            'branch' => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'branch_code' => $this->branch->branch_code,
            ] : null,
        ];
    }
}
