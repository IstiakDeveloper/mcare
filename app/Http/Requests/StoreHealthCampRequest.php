<?php

namespace App\Http\Requests;

use App\Support\FormSchema;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreHealthCampRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canEnterHealthCamp() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'branch_id' => $this->input('branch_id') ?: null,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'activity_date' => ['required', 'date'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'service_data' => ['nullable', 'array'],
            'service_data.*' => ['nullable'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $schema = FormSchema::forHealthCamp();
            /** @var array<string, mixed> $serviceData */
            $serviceData = $this->input('service_data', []);

            foreach ($schema['fields'] as $field) {
                if ($field['required'] && blank($serviceData[$field['name']] ?? null)) {
                    $validator->errors()->add('service_data.'.$field['name'], $field['label'].' is required.');
                }

                if ($field['type'] === 'number' && filled($serviceData[$field['name']] ?? null) && ! is_numeric($serviceData[$field['name']])) {
                    $validator->errors()->add('service_data.'.$field['name'], $field['label'].' must be a number.');
                }
            }
        });
    }
}
