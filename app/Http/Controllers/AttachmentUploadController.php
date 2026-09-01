<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttachmentUploadController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'photos' => ['nullable', 'array', 'max:50'],
            'photos.*' => ['file', 'image', 'max:30720'],
            'photo' => ['nullable', 'file', 'image', 'max:30720'],
        ]);

        $uploaded = [];
        $files = $request->file('photos', []);

        if ($request->hasFile('photo')) {
            $files[] = $request->file('photo');
        }

        if (empty($files)) {
            return response()->json(['error' => 'No files provided.'], 422);
        }

        $dateFolder = now()->format('Y/m');

        foreach ($files as $file) {
            $ext = strtolower($file->getClientOriginalExtension());
            if ($ext !== 'webp') {
                $ext = 'webp';
            }

            $filename = Str::ulid().'.'.$ext;
            $path = $file->storeAs("attachments/{$dateFolder}", $filename, 'public');

            $url = Storage::disk('public')->url($path);

            $uploaded[] = [
                'path' => $path,
                'url' => $url,
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getClientMimeType(),
            ];
        }

        return response()->json([
            'success' => true,
            'files' => $uploaded,
            'urls' => array_column($uploaded, 'url'),
        ]);
    }
}
