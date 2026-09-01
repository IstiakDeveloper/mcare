<?php

use App\Models\DailyActivity;
use App\Models\TaskSubtype;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('an officer can submit a household visit', function () {
    $user = officer();
    $samity = samityFor($user);

    $response = $this->actingAs($user)->post(route('activities.store'), [
        'task_type_id' => taskId('household-visit'),
        'activity_date' => now()->toDateString(),
        'samity_id' => $samity->id,
        'form_data' => [
            'samity_name' => 'Chandpur Mahila Samity',
            'village' => 'Chandpur',
            'households' => [
                [
                    'household_head' => 'Rahima Khatun',
                    'member_count' => 4,
                    'has_pregnant' => true,
                    'pregnancy_duration' => '২য় ত্রৈমাসিক',
                    'has_anc' => true,
                    'has_tt' => true,
                    'has_elderly' => true,
                    'elderly_diseases' => [
                        'diabetes' => ['affected' => true, 'taking_medication' => true],
                    ],
                ],
                [
                    'household_head' => 'Abdul Karim',
                    'member_count' => 5,
                    'has_child' => true,
                    'is_stunting' => false,
                    'general_illness_count' => 2,
                    'took_treatment' => true,
                ],
            ],
            'notes' => 'Revisit next week.',
        ],
    ]);

    $activity = DailyActivity::query()->first();

    expect($activity)->not->toBeNull()
        ->and($activity->user_id)->toBe($user->id)
        ->and($activity->branch_id)->toBe($user->branch_id)
        ->and($activity->form_data['household_count'])->toBe(2)
        ->and($activity->form_data['members_visited'])->toBe(9)
        ->and($activity->form_data['households'][0]['household_head'])->toBe('Rahima Khatun');

    $response->assertRedirect(route('activities.show', $activity));
});

test('samity task requires a subtype and samity', function () {
    $user = officer();

    $this->actingAs($user)
        ->post(route('activities.store'), [
            'task_type_id' => taskId('samity-task'),
            'activity_date' => now()->toDateString(),
            'form_data' => [
                'venue' => 'Yard',
                'attendees_count' => 12,
                'topics_discussed' => 'Hygiene',
            ],
        ])
        ->assertSessionHasErrors(['task_subtype_id']);
});

test('an officer can submit an uthan boithok', function () {
    $user = officer();
    $samity = samityFor($user);
    $subtype = TaskSubtype::query()->where('slug', 'uthan-boithok')->firstOrFail();

    $this->actingAs($user)
        ->post(route('activities.store'), [
            'task_type_id' => taskId('samity-task'),
            'task_subtype_id' => $subtype->id,
            'activity_date' => now()->toDateString(),
            'samity_id' => $samity->id,
            'form_data' => [
                'village' => 'Village courtyard',
                'attendees_count' => 18,
                'topics_discussed' => 'Exclusive breastfeeding',
                'notes' => 'Health advice given',
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('daily_activities', [
        'user_id' => $user->id,
        'task_subtype_id' => $subtype->id,
        'samity_id' => $samity->id,
    ]);
});

test('task form pages render for catalog tasks', function () {
    $user = officer();

    $this->actingAs($user)
        ->get(route('tasks.show', 'samity-task'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('tasks/select-subtype'));

    $this->actingAs($user)
        ->get(route('tasks.show', ['taskType' => 'household-visit']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('tasks/household-session'));
});
