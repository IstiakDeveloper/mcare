<?php

use App\Models\HealthCamp;

test('an officer can record a health camp for their branch', function () {
    $user = officer();

    $response = $this->actingAs($user)->post(route('health-camps.store'), [
        'activity_date' => now()->toDateString(),
        'service_data' => [
            'camp_name' => 'Eye screening camp',
            'location' => 'Branch courtyard',
            'patients_served' => 42,
            'services_provided' => 'BP, sugar, eye check',
        ],
    ]);

    $camp = HealthCamp::query()->first();

    $response->assertRedirect(route('health-camps.show', $camp));
    expect($camp)->not->toBeNull()
        ->and($camp->branch_id)->toBe($user->branch_id)
        ->and($camp->entered_by)->toBe($user->id)
        ->and($camp->service_data['camp_name'])->toBe('Eye screening camp');
});

test('health camp create page is available to signed-in officers', function () {
    $user = officer();

    $this->actingAs($user)
        ->get(route('health-camps.create'))
        ->assertOk();
});
