<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Samity;
use App\Models\TaskSubtype;
use App\Models\TaskType;
use App\Models\User;
use App\Support\FormSchema;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskFormController extends Controller
{
    public function show(Request $request, TaskType $taskType, ?TaskSubtype $taskSubtype = null): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('branch');

        if ($taskType->requires_subtype && $taskSubtype === null) {
            $taskType->load('subtypes');

            return Inertia::render('tasks/select-subtype', [
                'taskType' => $taskType,
            ]);
        }

        if ($taskSubtype && $taskSubtype->task_type_id !== $taskType->id) {
            abort(404);
        }

        if (! $taskType->requires_subtype) {
            $taskSubtype = null;
        }

        $schema = FormSchema::forTask($taskType, $taskSubtype);
        $branchId = $user->isAdmin()
            ? $request->integer('branch_id') ?: $user->branch_id
            : $user->branch_id;

        $samities = $branchId
            ? Samity::query()->where('branch_id', $branchId)->active()->orderBy('name')->get(['id', 'name', 'code', 'branch_id'])
            : new Collection;

        $branches = $user->isAdmin()
            ? Branch::query()->active()->orderBy('name')->get(['id', 'name', 'branch_code'])
            : ($user->branch ? collect([$user->branch]) : new Collection);

        $view = $taskType->slug === 'household-visit' ? 'tasks/household-session' : 'tasks/form';

        return Inertia::render($view, [
            'taskType' => $taskType,
            'taskSubtype' => $taskSubtype,
            'schema' => $schema,
            'samities' => $samities,
            'branches' => $branches,
            'selectedBranchId' => $branchId,
            'today' => now()->toDateString(),
        ]);
    }
}
