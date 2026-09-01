<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\HrmReferenceSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminHrmSyncController extends Controller
{
    public function sync(Request $request, HrmReferenceSyncService $syncService): JsonResponse|RedirectResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        // If called via API / Webhook without web user auth, check token
        if (! $user) {
            $token = $request->bearerToken() ?: $request->header('X-HRM-SYNC-TOKEN');
            $expectedToken = config('mcare.hrm.sync_token', env('HRM_SYNC_TOKEN'));

            if (! $expectedToken || ! hash_equals($expectedToken, (string) $token)) {
                return response()->json(['error' => 'Unauthorized HRM sync token.'], 401);
            }
        } elseif (! $user->isAdmin()) {
            abort(403, 'Only Head Office administrators can trigger full HRM reference sync.');
        }

        $result = $syncService->sync();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'message' => 'HRM reference data synced successfully.',
                'data' => $result,
            ]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => sprintf(
                'HRM সিঙ্ক সম্পন্ন হয়েছে: %dটি শাখা, %d জন স্বাস্থ্য কর্মকর্তা (%s)',
                $result['branches'],
                $result['employees'],
                $result['source'] === 'hrm' ? 'লাইভ HRM' : 'লোকাল ডাটা',
            ),
        ]);

        return redirect()->back();
    }

    public function status(HrmReferenceSyncService $syncService): JsonResponse
    {
        return response()->json([
            'status' => $syncService->getLastSyncStatus(),
        ]);
    }
}
