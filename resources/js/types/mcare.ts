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
    user?: { id: number; name: string; email: string; employee_code?: string | null; username?: string | null } | null;
};

export type HealthCamp = {
    id: number;
    activity_date: string;
    service_data: Record<string, string | number | null> | null;
    branch?: BranchOption | null;
    entered_by?: { id: number; name: string; email: string; employee_code?: string | null; username?: string | null } | null;
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
    adminOverview?: {
        total_users: number;
        total_branches: number;
        total_active_officers: number;
        submitted_today_count: number;
        pending_today_count: number;
        submission_rate: number;
        today_all_activities_count: number;
        today_all_beneficiaries: number;
        today_all_fees: number;
        today_all_camps: number;
        submitted_officers: {
            id: number;
            name: string;
            employee_code: string;
            designation: string;
            phone: string;
            branch_id: number | null;
            branch_name: string;
            activities_count: number;
            beneficiaries_count: number;
            fee_collected: number;
            last_submission_time: string | null;
            last_task_name: string;
        }[];
        pending_officers: {
            id: number;
            name: string;
            employee_code: string;
            designation: string;
            phone: string;
            branch_id: number | null;
            branch_name: string;
        }[];
        branch_progress: {
            branch_id: number;
            branch_name: string;
            branch_code: string;
            total_officers: number;
            submitted_count: number;
            pending_count: number;
            activities_count: number;
            beneficiaries_count: number;
            fee_amount: number;
        }[];
        recent_system_activities: DailyActivity[];
        hrm_today?: {
            connected: boolean;
            total_staff: number;
            present_count: number;
            movement_count: number;
            leave_count: number;
            absent_count: number;
            present_list: {
                id: number;
                employee_id: string;
                name: string;
                branch_name: string;
                designation: string;
                phone: string;
                status: string;
                check_in: string | null;
                check_out: string | null;
            }[];
            movement_list: {
                id: number;
                employee_id: string;
                name: string;
                branch_name: string;
                designation: string;
                phone: string;
                status: string;
                movement_purpose: string | null;
                movement_destination: string | null;
            }[];
            leave_list: {
                id: number;
                employee_id: string;
                name: string;
                branch_name: string;
                designation: string;
                phone: string;
                status: string;
                leave_reason: string | null;
            }[];
            absent_list: {
                id: number;
                employee_id: string;
                name: string;
                branch_name: string;
                designation: string;
                phone: string;
                status: string;
            }[];
        } | null;
    } | null;
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


