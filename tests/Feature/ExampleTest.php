<?php

use App\Models\User;

test('home redirects guests to the login page', function () {
    $this->get(route('home'))->assertRedirect(route('login'));
});

test('home redirects authenticated users to the dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('home'))
        ->assertRedirect(route('dashboard'));
});
