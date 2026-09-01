<?php

return [

    'timezone' => env('APP_TIMEZONE', 'Asia/Dhaka'),
    'currency' => env('APP_CURRENCY', 'BDT'),
    'currency_symbol' => '৳',

    /*
    |--------------------------------------------------------------------------
    | HRM reference source
    |--------------------------------------------------------------------------
    |
    | Branch and Health Department employee records are owned by HRM.
    | M Care stores only lightweight local copies keyed by external_hrm_id.
    |
    */

    'hrm' => [
        'connection' => env('HRM_DB_CONNECTION', 'hrm'),
        'health_department_id' => (int) env('HRM_HEALTH_DEPARTMENT_ID', 12),
        'admin_designations' => [
            'resident physician',
            'health coordinator',
        ],
        'default_password' => env('MCARE_DEFAULT_PASSWORD', 'password'),
        'samities_per_branch' => 3,
    ],

    'roles' => [
        ['name' => 'Worker', 'slug' => 'worker'],
        ['name' => 'Branch Manager', 'slug' => 'branch-manager'],
        ['name' => 'Admin', 'slug' => 'admin'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Daily task catalog
    |--------------------------------------------------------------------------
    */

    'task_types' => [
        [
            'name' => 'Samity Task',
            'slug' => 'samity-task',
            'description' => 'Yard meetings, satellite clinics, and awareness sessions at the samity.',
            'requires_subtype' => true,
            'sort_order' => 1,
            'subtypes' => [
                [
                    'name' => 'Uthan Boithok',
                    'slug' => 'uthan-boithok',
                    'description' => 'Yard meeting with samity members.',
                    'sort_order' => 1,
                ],
                [
                    'name' => 'Satellite Clinic',
                    'slug' => 'satellite-clinic',
                    'description' => 'Outreach clinic held at the samity.',
                    'sort_order' => 2,
                ],
                [
                    'name' => 'Awareness Session',
                    'slug' => 'awareness-session',
                    'description' => 'Health awareness session for the community.',
                    'sort_order' => 3,
                ],
            ],
        ],
        [
            'name' => 'Household Visit',
            'slug' => 'household-visit',
            'description' => 'Visit households to follow up on health status.',
            'requires_subtype' => false,
            'sort_order' => 2,
            'subtypes' => [],
        ],
        [
            'name' => 'Static Clinic',
            'slug' => 'static-clinic',
            'description' => 'Clinic services delivered from the branch.',
            'requires_subtype' => false,
            'sort_order' => 3,
            'subtypes' => [],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Minimal form schemas (expanded later from the health checklist)
    |--------------------------------------------------------------------------
    */

    'forms' => [
        'uthan-boithok' => [
            'title' => 'উঠান বৈঠক রিপোর্ট (Uthan Boithok)',
            'requires_samity' => false,
            'fields' => [
                ['name' => 'samity_name', 'label' => 'সমিতির নাম (Samity Name)', 'type' => 'text', 'required' => false],
                ['name' => 'village', 'label' => 'গ্রাম / পাড়া (Village / Area)', 'type' => 'text', 'required' => true],
                ['name' => 'attendees_count', 'label' => 'উপস্থিতির সংখ্যা (Total Attendees)', 'type' => 'number', 'required' => true],
                ['name' => 'topics_discussed', 'label' => 'আলোচনার বিষয়বস্তু (Topics Discussed)', 'type' => 'textarea', 'required' => true],
                ['name' => 'notes', 'label' => 'মন্তব্য ও স্বাস্থ্য পরামর্শ (Comments / Advice)', 'type' => 'textarea', 'required' => false],
            ],
        ],
        'satellite-clinic' => [
            'title' => 'স্যাটেলাইট ক্লিনিক সেবা রিপোর্ট (Satellite Clinic)',
            'requires_samity' => false,
            'is_patient_repeater' => true,
            'fields' => [
                ['name' => 'village', 'label' => 'গ্রামের নাম (Village Name)', 'type' => 'text', 'required' => true],
                ['name' => 'samity_name', 'label' => 'সমিতির নাম (Samity Name)', 'type' => 'text', 'required' => true],
                ['name' => 'samity_number', 'label' => 'সমিতির নম্বর (Samity Number)', 'type' => 'text', 'required' => false],
                ['name' => 'notes', 'label' => 'ক্লিনিক সেশনের সাধারণ মন্তব্য (Session Remarks / Notes)', 'type' => 'textarea', 'required' => false],
            ],
        ],
        'awareness-session' => [
            'title' => 'স্বাস্থ্য সচেতনতা সেশন (Awareness Session)',
            'requires_samity' => false,
            'fields' => [
                ['name' => 'samity_name', 'label' => 'সমিতির নাম (Samity Name)', 'type' => 'text', 'required' => false],
                ['name' => 'village', 'label' => 'গ্রাম / স্থান (Location / Venue)', 'type' => 'text', 'required' => true],
                ['name' => 'topic', 'label' => 'সেশনের বিষয়বস্তু (Session Topic)', 'type' => 'text', 'required' => true],
                ['name' => 'attendees_count', 'label' => 'উপস্থিতির সংখ্যা (Total Attendees)', 'type' => 'number', 'required' => true],
                ['name' => 'key_messages', 'label' => 'মূল বার্তা ও আলোচনা (Key Messages Discussed)', 'type' => 'textarea', 'required' => true],
                ['name' => 'notes', 'label' => 'মন্তব্য (Remarks / Notes)', 'type' => 'textarea', 'required' => false],
            ],
        ],
        'household-visit' => [
            'title' => 'খানা পরিদর্শন রিপোর্ট (Household Visit)',
            'requires_samity' => false,
            'is_household_repeater' => true,
            'fields' => [
                ['name' => 'samity_name', 'label' => 'সমিতির নাম (Samity Name)', 'type' => 'text', 'required' => false],
                ['name' => 'samity_number', 'label' => 'সমিতির নম্বর (Samity Number)', 'type' => 'text', 'required' => false],
                ['name' => 'village', 'label' => 'গ্রামের নাম (Village Name)', 'type' => 'text', 'required' => false],
                ['name' => 'notes', 'label' => 'সার্বিক মন্তব্য ও পর্যবেক্ষণ (Overall Session Notes)', 'type' => 'textarea', 'required' => false],
            ],
        ],
        'static-clinic' => [
            'title' => 'স্ট্যাটিক ক্লিনিক (Static Clinic)',
            'requires_samity' => false,
            'is_patient_repeater' => true,
            'fields' => [
                ['name' => 'patients_served', 'label' => 'মোট সেবাগ্রহীতা সংখ্যা (Patients Served)', 'type' => 'number', 'required' => false],
                ['name' => 'female_count', 'label' => 'মহিলা সেবাগ্রহীতা (Female Patients)', 'type' => 'number', 'required' => false],
                ['name' => 'male_count', 'label' => 'পুরুষ সেবাগ্রহীতা (Male Patients)', 'type' => 'number', 'required' => false],
                ['name' => 'notes', 'label' => 'সার্বিক মন্তব্য ও পর্যবেক্ষণ (Remarks / Notes)', 'type' => 'textarea', 'required' => false],
            ],
        ],
        'health-camp' => [
            'title' => 'হেলথ ক্যাম্প রিপোর্ট (Health Camp)',
            'requires_samity' => false,
            'fields' => [
                ['name' => 'camp_name', 'label' => 'ক্যাম্পের নাম (Camp Name)', 'type' => 'text', 'required' => true],
                ['name' => 'location', 'label' => 'ক্যাম্পের স্থান / গ্রাম (Camp Location)', 'type' => 'text', 'required' => true],
                ['name' => 'patients_served', 'label' => 'মোট সেবাগ্রহীতার সংখ্যা (Patients Served)', 'type' => 'number', 'required' => true],
                ['name' => 'services_provided', 'label' => 'প্রদত্ত সেবাসমূহ (Services Provided)', 'type' => 'textarea', 'required' => true],
                ['name' => 'notes', 'label' => 'মন্তব্য (Remarks / Notes)', 'type' => 'textarea', 'required' => false],
            ],
        ],
    ],

];
