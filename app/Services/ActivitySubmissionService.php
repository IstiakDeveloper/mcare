<?php

namespace App\Services;

use App\Models\DailyActivity;
use App\Models\HealthCamp;
use App\Models\Samity;
use App\Models\TaskSubtype;
use App\Models\TaskType;
use App\Models\User;
use App\Support\FormSchema;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class ActivitySubmissionService
{
    /**
     * @param  array<string, mixed>  $input
     */
    public function submitDailyActivity(User $user, array $input): DailyActivity
    {
        $taskType = TaskType::query()->whereKey($input['task_type_id'])->firstOrFail();
        $subtype = isset($input['task_subtype_id'])
            ? TaskSubtype::query()->whereKey($input['task_subtype_id'])->first()
            : null;

        if ($taskType->requires_subtype && $subtype === null) {
            throw ValidationException::withMessages([
                'task_subtype_id' => 'Please choose a Samity Task sub-type.',
            ]);
        }

        if ($subtype && $subtype->task_type_id !== $taskType->id) {
            throw ValidationException::withMessages([
                'task_subtype_id' => 'The selected sub-type does not belong to this task.',
            ]);
        }

        $schema = FormSchema::forTask($taskType, $subtype);
        $formData = FormSchema::filterPayload(
            is_array($input['form_data'] ?? null) ? $input['form_data'] : [],
            $schema,
        );

        $branchId = $user->isAdmin()
            ? ($input['branch_id'] ?? $user->branch_id)
            : $user->branch_id;

        $samityId = $input['samity_id'] ?? null;

        if ($schema['requires_samity'] && ! $samityId) {
            throw ValidationException::withMessages([
                'samity_id' => 'Please select a samity.',
            ]);
        }

        if ($samityId) {
            $samity = Samity::query()->whereKey($samityId)->firstOrFail();

            if ($branchId && $samity->branch_id !== (int) $branchId) {
                throw ValidationException::withMessages([
                    'samity_id' => 'The selected samity does not belong to this branch.',
                ]);
            }

            $branchId = $branchId ?: $samity->branch_id;
        }

        return DailyActivity::query()->create([
            'user_id' => $user->id,
            'branch_id' => $branchId,
            'samity_id' => $samityId,
            'task_type_id' => $taskType->id,
            'task_subtype_id' => $subtype?->id,
            'activity_date' => $input['activity_date'] ?? Carbon::today()->toDateString(),
            'form_data' => $formData,
        ]);
    }

    /**
     * @param  array<string, mixed>  $input
     */
    public function submitHealthCamp(User $user, array $input): HealthCamp
    {
        $schema = FormSchema::forHealthCamp();
        $serviceData = FormSchema::filterPayload(
            is_array($input['service_data'] ?? null) ? $input['service_data'] : [],
            $schema,
        );

        $branchId = $user->isAdmin()
            ? ($input['branch_id'] ?? $user->branch_id)
            : $user->branch_id;

        if (! $branchId) {
            throw ValidationException::withMessages([
                'branch_id' => 'A branch is required to record a health camp.',
            ]);
        }

        return HealthCamp::query()->create([
            'branch_id' => $branchId,
            'entered_by' => $user->id,
            'activity_date' => $input['activity_date'] ?? Carbon::today()->toDateString(),
            'service_data' => $serviceData,
        ]);
    }
}
