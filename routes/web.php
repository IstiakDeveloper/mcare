<?php

use App\Http\Controllers\AdminHrmSyncController;
use App\Http\Controllers\AttachmentUploadController;
use App\Http\Controllers\DailyActivityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FeeCollectionController;
use App\Http\Controllers\HealthCampController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TaskFormController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/manifest.webmanifest', function () {
    return response((string) file_get_contents(resource_path('pwa/manifest.webmanifest')), 200, [
        'Content-Type' => 'application/manifest+json',
        'Cache-Control' => 'no-cache',
    ]);
})->name('pwa.manifest');

Route::get('/sw.js', function () {
    return response((string) file_get_contents(resource_path('pwa/sw.js')), 200, [
        'Content-Type' => 'application/javascript',
        'Service-Worker-Allowed' => '/',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
    ]);
})->name('pwa.service-worker');

Route::get('/offline.html', function () {
    return response((string) file_get_contents(resource_path('pwa/offline.html')), 200, [
        'Content-Type' => 'text/html; charset=UTF-8',
    ]);
})->name('pwa.offline');

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('tasks/{taskType}/{taskSubtype?}', [TaskFormController::class, 'show'])
        ->name('tasks.show');

    Route::get('activities', [DailyActivityController::class, 'index'])->name('activities.index');
    Route::post('activities', [DailyActivityController::class, 'store'])->name('activities.store');
    Route::get('activities/{activity}', [DailyActivityController::class, 'show'])->name('activities.show');

    Route::get('health-camps', [HealthCampController::class, 'index'])->name('health-camps.index');
    Route::get('health-camps/create', [HealthCampController::class, 'create'])->name('health-camps.create');
    Route::post('health-camps', [HealthCampController::class, 'store'])->name('health-camps.store');
    Route::get('health-camps/{healthCamp}', [HealthCampController::class, 'show'])->name('health-camps.show');

    Route::get('fee-collections', [FeeCollectionController::class, 'index'])->name('fee-collections.index');
    Route::post('fee-collections', [FeeCollectionController::class, 'store'])->name('fee-collections.store');
    Route::delete('fee-collections/{feeCollection}', [FeeCollectionController::class, 'destroy'])->name('fee-collections.destroy');

    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::post('admin/sync-hrm', [AdminHrmSyncController::class, 'sync'])->name('admin.hrm.sync');
    Route::get('admin/sync-status', [AdminHrmSyncController::class, 'status'])->name('admin.hrm.status');

    Route::post('attachments/upload', [AttachmentUploadController::class, 'upload'])->name('attachments.upload');
});

Route::post('api/hrm/sync', [AdminHrmSyncController::class, 'sync'])->name('api.hrm.sync');

require __DIR__.'/settings.php';
