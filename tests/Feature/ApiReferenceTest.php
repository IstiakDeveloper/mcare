<?php

test('api task types require authentication', function () {
    $this->getJson('/api/task-types')->assertUnauthorized();
});

test('authenticated officers can read reference data from the api', function () {
    $user = officer();

    $this->actingAs($user)
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('data.email', $user->email);

    $this->actingAs($user)
        ->getJson('/api/task-types')
        ->assertOk()
        ->assertJsonPath('data.0.slug', 'samity-task');

    $this->actingAs($user)
        ->getJson('/api/branches')
        ->assertOk();
});
