<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeeCollection extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'branch_id',
        'collection_date',
        'collection_type',
        'beneficiary_name',
        'beneficiary_type',
        'age',
        'phone',
        'location_info',
        'diabetes_reading',
        'amount',
        'notes',
    ];

    protected $casts = [
        'collection_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
