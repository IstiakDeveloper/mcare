<?php

namespace App\Http\Requests;

use App\Models\TaskSubtype;
use App\Models\TaskType;
use App\Support\FormSchema;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreDailyActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'task_subtype_id' => $this->input('task_subtype_id') ?: null,
            'samity_id' => $this->input('samity_id') ?: null,
            'branch_id' => $this->input('branch_id') ?: null,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'task_type_id' => ['required', 'integer', 'exists:task_types,id'],
            'task_subtype_id' => ['nullable', 'integer', 'exists:task_subtypes,id'],
            'activity_date' => ['required', 'date'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'samity_id' => ['nullable', 'integer', 'exists:samities,id'],
            'form_data' => ['nullable', 'array'],
            'form_data.*' => ['nullable'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $taskType = TaskType::query()->find($this->integer('task_type_id'));
            $subtype = $this->filled('task_subtype_id')
                ? TaskSubtype::query()->find($this->integer('task_subtype_id'))
                : null;

            if (! $taskType) {
                return;
            }

            if ($taskType->requires_subtype && $subtype === null) {
                $validator->errors()->add('task_subtype_id', 'Please choose a Samity Task sub-type.');

                return;
            }

            $schema = FormSchema::forTask($taskType, $subtype);
            /** @var array<string, mixed> $formData */
            $formData = $this->input('form_data', []);

            if ($schema['requires_samity'] && ! $this->filled('samity_id')) {
                $validator->errors()->add('samity_id', 'Please select a samity.');
            }

            foreach ($schema['fields'] as $field) {
                if ($field['required'] && blank($formData[$field['name']] ?? null)) {
                    $validator->errors()->add('form_data.'.$field['name'], $field['label'].' is required.');
                }

                if ($field['type'] === 'number' && filled($formData[$field['name']] ?? null) && ! is_numeric($formData[$field['name']])) {
                    $validator->errors()->add('form_data.'.$field['name'], $field['label'].' must be a number.');
                }
            }
        });
    }
}
