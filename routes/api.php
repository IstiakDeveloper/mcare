<?php

use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\DailyActivityController;
use App\Http\Controllers\HealthCampController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('me', [ReferenceController::class, 'me'])->name('me');
    Route::get('task-types', [ReferenceController::class, 'taskTypes'])->name('task-types.index');
    Route::get('branches', [ReferenceController::class, 'branches'])->name('branches.index');
    Route::get('samities', [ReferenceController::class, 'samities'])->name('samities.index');

    Route::get('daily-activities', [DailyActivityController::class, 'index'])->name('daily-activities.index');
    Route::post('daily-activities', [DailyActivityController::class, 'store'])->name('daily-activities.store');
    Route::get('daily-activities/{activity}', [DailyActivityController::class, 'show'])->name('daily-activities.show');

    Route::get('health-camps', [HealthCampController::class, 'index'])->name('health-camps.index');
    Route::post('health-camps', [HealthCampController::class, 'store'])->name('health-camps.store');
    Route::get('health-camps/{healthCamp}', [HealthCampController::class, 'show'])->name('health-camps.show');
});
