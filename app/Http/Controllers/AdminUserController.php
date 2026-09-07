<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if (! $currentUser->isAdmin()) {
            abort(403, 'অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অ্যাডমিন এই পাতায় প্রবেশ করতে পারবেন।');
        }

        $search = $request->string('search')->trim()->toString();
        $branchId = $request->input('branch_id');
        $roleId = $request->input('role_id');

        $usersQuery = User::query()
            ->with(['role', 'branch'])
            ->withCount(['dailyActivities', 'healthCamps'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('employee_code', 'like', "%{$search}%")
                        ->orWhere('designation', 'like', "%{$search}%");
                });
            })
            ->when($branchId && $branchId !== 'all', function ($query) use ($branchId) {
                $query->where('branch_id', (int) $branchId);
            })
            ->when($roleId && $roleId !== 'all', function ($query) use ($roleId) {
                $query->where('role_id', (int) $roleId);
            })
            ->orderBy('name');

        $users = $usersQuery->get()->map(function (User $user) {
            return [
                'id' => $user->id,
                'external_hrm_id' => $user->external_hrm_id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone,
                'designation' => $user->designation,
                'employee_code' => $user->employee_code,
                'role_id' => $user->role_id,
                'role' => $user->role ? [
                    'id' => $user->role->id,
                    'name' => $user->role->name,
                    'slug' => $user->role->slug,
                ] : null,
                'branch_id' => $user->branch_id,
                'branch' => $user->branch ? [
                    'id' => $user->branch->id,
                    'name' => $user->branch->name,
                    'branch_code' => $user->branch->branch_code,
                ] : null,
                'daily_activities_count' => $user->daily_activities_count ?? 0,
                'health_camps_count' => $user->health_camps_count ?? 0,
                'created_at' => $user->created_at?->toIso8601String(),
            ];
        });

        $branches = Branch::query()->orderBy('name')->get(['id', 'name', 'branch_code']);
        $roles = Role::query()->orderBy('name')->get(['id', 'name', 'slug']);

        $summary = [
            'total_users' => User::count(),
            'total_admins' => User::whereHas('role', fn ($q) => $q->where('slug', 'admin'))->count(),
            'total_workers' => User::whereHas('role', fn ($q) => $q->where('slug', 'worker'))->orWhereNull('role_id')->count(),
            'total_managers' => User::whereHas('role', fn ($q) => $q->where('slug', 'branch-manager'))->count(),
            'total_branches' => Branch::count(),
        ];

        $payload = [
            'users' => $users,
            'branches' => $branches,
            'roles' => $roles,
            'summary' => $summary,
            'filters' => [
                'search' => $search,
                'branch_id' => $branchId ?: 'all',
                'role_id' => $roleId ?: 'all',
            ],
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($payload);
        }

        return Inertia::render('admin/users/index', $payload);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if (! $currentUser->isAdmin()) {
            abort(403, 'অননুমোদিত প্রবেশাধিকার।');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'employee_code' => ['nullable', 'string', 'max:50'],
            'designation' => ['nullable', 'string', 'max:100'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'password' => ['required', 'string', Password::default()],
        ]);

        $username = $validated['username'] ?: Str::slug($validated['name']).'-'.rand(100, 999);

        User::create([
            'name' => $validated['name'],
            'username' => $username,
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'employee_code' => $validated['employee_code'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'role_id' => $validated['role_id'] ?? null,
            'branch_id' => $validated['branch_id'] ?? null,
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        return redirect()->route('admin.users.index')
            ->with('status', 'নতুন ব্যবহারকারী সফলভাবে তৈরি করা হয়েছে।');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if (! $currentUser->isAdmin()) {
            abort(403, 'অননুমোদিত প্রবেশাধিকার।');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'employee_code' => ['nullable', 'string', 'max:50'],
            'designation' => ['nullable', 'string', 'max:100'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'password' => ['nullable', 'string', Password::default()],
        ]);

        $updateData = [
            'name' => $validated['name'],
            'username' => $validated['username'] ?: $user->username,
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'employee_code' => $validated['employee_code'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'role_id' => $validated['role_id'] ?? null,
            'branch_id' => $validated['branch_id'] ?? null,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return redirect()->route('admin.users.index')
            ->with('status', 'ব্যবহারকারীর তথ্য সফলভাবে হালনাগাদ করা হয়েছে।');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if (! $currentUser->isAdmin()) {
            abort(403, 'অননুমোদিত প্রবেশাধিকার।');
        }

        if ($user->id === $currentUser->id) {
            return redirect()->route('admin.users.index')
                ->withErrors(['error' => 'আপনি নিজের অ্যাকাউন্ট মুছে ফেলতে পারবেন না।']);
        }

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('status', 'ব্যবহারকারী অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।');
    }
}
