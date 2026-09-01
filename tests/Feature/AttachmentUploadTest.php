<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('authenticated users can upload compressed webp photos', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $file1 = UploadedFile::fake()->image('activity1.webp', 800, 600);
    $file2 = UploadedFile::fake()->image('activity2.webp', 800, 600);

    $response = $this->actingAs($user)->postJson(route('attachments.upload'), [
        'photos' => [$file1, $file2],
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'files',
            'urls',
        ]);

    expect($response->json('urls'))->toHaveCount(2);

    $savedPath = $response->json('files.0.path');
    Storage::disk('public')->assertExists($savedPath);
});

test('unauthenticated guests cannot upload attachments', function () {
    $file = UploadedFile::fake()->image('test.webp');

    $this->postJson(route('attachments.upload'), [
        'photos' => [$file],
    ])->assertUnauthorized();
});
