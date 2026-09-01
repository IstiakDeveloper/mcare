<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Samity;
use App\Models\TaskType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferenceController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json(['data' => $user->toSharedArray()]);
    }

    public function taskTypes(): JsonResponse
    {
        $types = TaskType::query()
            ->with('subtypes')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $types]);
    }

    public function branches(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $branches = Branch::query()
            ->active()
            ->when(
                ! $user->isAdmin(),
                fn ($query) => $query->whereKey($user->branch_id),
            )
            ->orderBy('name')
            ->get(['id', 'external_hrm_id', 'name', 'branch_code', 'is_active']);

        return response()->json(['data' => $branches]);
    }

    public function samities(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $branchId = $user->isAdmin()
            ? ($request->integer('branch_id') ?: $user->branch_id)
            : $user->branch_id;

        $samities = Samity::query()
            ->active()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->orderBy('name')
            ->get(['id', 'branch_id', 'name', 'code']);

        return response()->json(['data' => $samities]);
    }
}
