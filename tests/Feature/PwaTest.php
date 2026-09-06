<?php

test('the web app manifest is publicly available', function () {
    $response = $this->get(route('pwa.manifest'))->assertOk();
    $manifest = json_decode((string) $response->getContent(), true);

    expect($manifest)->toBeArray()
        ->and($manifest['name'])->toBe('M Care')
        ->and($manifest['short_name'])->toBe('Mcare')
        ->and($manifest['display'])->toBe('standalone')
        ->and($manifest['start_url'])->toBe('/')
        ->and($manifest['theme_color'])->toBe('#059669')
        ->and($manifest['icons'])->not->toBeEmpty();

    expect($response->headers->get('content-type'))->toStartWith('application/manifest+json');
});

test('the service worker is publicly available', function () {
    $this->get(route('pwa.service-worker'))
        ->assertOk()
        ->assertHeader('Service-Worker-Allowed', '/')
        ->assertSee('CACHE_VERSION', false);
});

test('the offline fallback page is publicly available', function () {
    $this->get('/offline.html')
        ->assertOk()
        ->assertSee('You\'re offline', false)
        ->assertSee('M Care', false);
});

test('the login page includes pwa discovery tags', function () {
    $this->get(route('login'))
        ->assertOk()
        ->assertSee('rel="manifest"', false)
        ->assertSee('/manifest.webmanifest', false)
        ->assertSee('apple-mobile-web-app-capable', false)
        ->assertSee('mobile-web-app-capable', false)
        ->assertSee('/apple-touch-icon.png', false);
});

test('required pwa icons exist', function () {
    expect(is_file(public_path('icons/icon-192.png')))->toBeTrue()
        ->and(is_file(public_path('icons/icon-512.png')))->toBeTrue()
        ->and(is_file(public_path('icons/icon-maskable-192.png')))->toBeTrue()
        ->and(is_file(public_path('icons/icon-maskable-512.png')))->toBeTrue()
        ->and(is_file(public_path('apple-touch-icon.png')))->toBeTrue();
});
