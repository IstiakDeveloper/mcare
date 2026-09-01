export type User = {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    employee_code?: string | null;
    designation?: string | null;
    phone?: string | null;
    role?: string | null;
    role_name?: string | null;
    can_view_analytics?: boolean;
    can_sync_hrm?: boolean;
    branch?: {
        id: number;
        name: string;
        branch_code?: string | null;
    } | null;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
