<?php

namespace App\Support;

use App\Models\TaskSubtype;
use App\Models\TaskType;

class FormSchema
{
    /**
     * @return array{title: string, requires_samity: bool, fields: list<array{name: string, label: string, type: string, required: bool}>}
     */
    public static function forTask(?TaskType $type, ?TaskSubtype $subtype): array
    {
        $key = 'household-visit';

        if ($subtype instanceof TaskSubtype) {
            $key = $subtype->slug;
        } elseif ($type instanceof TaskType) {
            $key = $type->slug;
        }

        return self::get($key);
    }

    /**
     * @return array{title: string, requires_samity: bool, fields: list<array{name: string, label: string, type: string, required: bool}>}
     */
    public static function forHealthCamp(): array
    {
        return self::get('health-camp');
    }

    /**
     * @return array{title: string, requires_samity: bool, fields: list<array{name: string, label: string, type: string, required: bool}>}
     */
    public static function get(string $key): array
    {
        /** @var array<string, mixed>|null $schema */
        $schema = config('mcare.forms.'.$key);

        if (! is_array($schema)) {
            return [
                'title' => 'Activity',
                'requires_samity' => false,
                'fields' => [
                    ['name' => 'notes', 'label' => 'Notes', 'type' => 'textarea', 'required' => true],
                ],
            ];
        }

        /** @var list<array{name: string, label: string, type: string, required: bool}> $fields */
        $fields = [];

        foreach ($schema['fields'] ?? [] as $field) {
            if (! is_array($field) || ! isset($field['name'], $field['label'], $field['type'])) {
                continue;
            }

            $item = [
                'name' => (string) $field['name'],
                'label' => (string) $field['label'],
                'type' => (string) $field['type'],
                'required' => (bool) ($field['required'] ?? false),
            ];

            if (isset($field['options']) && is_array($field['options'])) {
                $item['options'] = array_values($field['options']);
            }

            $fields[] = $item;
        }

        return [
            'title' => (string) ($schema['title'] ?? 'Activity'),
            'requires_samity' => (bool) ($schema['requires_samity'] ?? false),
            'fields' => $fields,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array{fields: list<array{name: string, type: string, required: bool}>}  $schema
     * @return array<string, mixed>
     */
    public static function filterPayload(array $data, array $schema): array
    {
        $allowed = collect($schema['fields'])->pluck('name')->all();
        $filtered = [];

        foreach ($allowed as $name) {
            $filtered[$name] = $data[$name] ?? null;
        }

        if (isset($data['patients']) && is_array($data['patients'])) {
            $validPatients = array_values(array_filter($data['patients'], fn ($item) => is_array($item) && ! empty(array_filter($item))));
            $filtered['patients'] = $validPatients;
            $filtered['patients_served'] = count($validPatients);
            $filtered['male_count'] = count(array_filter($validPatients, fn ($p) => in_array($p['patient_gender'] ?? $p['gender'] ?? '', ['পুরুষ', 'Male', 'male'])));
            $filtered['female_count'] = count(array_filter($validPatients, fn ($p) => in_array($p['patient_gender'] ?? $p['gender'] ?? '', ['নারী', 'মহিলা', 'Female', 'female'])));
        }

        if (isset($data['households']) && is_array($data['households'])) {
            $validHouseholds = array_values(array_filter($data['households'], fn ($item) => is_array($item) && ! empty($item['household_head'] ?? null)));
            $filtered['households'] = $validHouseholds;
            $filtered['household_count'] = count($validHouseholds);
            $filtered['members_visited'] = array_sum(array_map(fn ($h) => (int) ($h['member_count'] ?? 1), $validHouseholds));
        }

        if (isset($data['attachments']) && is_array($data['attachments'])) {
            $filtered['attachments'] = array_values(array_filter($data['attachments'], fn ($url) => is_string($url) && filled($url)));
        }

        return $filtered;
    }
}
