export type FormField = {
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
};

export type FormSchema = {
    title: string;
    requires_samity: boolean;
    fields: FormField[];
};

export type TaskSubtype = {
    id: number;
    task_type_id: number;
    name: string;
    slug: string;
    description: string | null;
};

export type TaskType = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    requires_subtype: boolean;
    subtypes?: TaskSubtype[];
};

export type BranchOption = {
    id: number;
    name: string;
    branch_code?: string | null;
};

export type SamityOption = {
    id: number;
    name: string;
    code?: string | null;
    branch_id: number;
};

export type DailyActivity = {
    id: number;
    activity_date: string;
    form_data: Record<string, string | number | null> | null;
    task_type?: TaskType | null;
    task_subtype?: TaskSubtype | null;
    samity?: SamityOption | null;
    branch?: BranchOption | null;
    user?: { id: number; name: string; email: string } | null;
};

export type HealthCamp = {
    id: number;
    activity_date: string;
    service_data: Record<string, string | number | null> | null;
    branch?: BranchOption | null;
    entered_by?: { id: number; name: string; email: string } | null;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

export type DashboardProps = {
    taskTypes: TaskType[];
    todayActivities: DailyActivity[];
    recentActivities: DailyActivity[];
    todayCampCount: number;
    totalBeneficiariesToday?: number;
    today: string;
    samities?: SamityOption[];
    branches?: BranchOption[];
    selectedBranchId?: number | null;
    formSchemas?: Record<string, FormSchema>;
};

export type FeeCollection = {
    id: number;
    user_id: number;
    branch_id?: number | null;
    collection_date: string;
    collection_type: string;
    beneficiary_name: string;
    beneficiary_type: 'সদস্য' | 'অ-সদস্য';
    age?: string | null;
    phone?: string | null;
    location_info?: string | null;
    diabetes_reading?: string | null;
    amount: number | string;
    notes?: string | null;
    created_at?: string;
    user?: { id: number; name: string } | null;
    branch?: { id: number; name: string; code?: string } | null;
};


