import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, Send, Tent } from 'lucide-react';
import {
    DynamicFormFields,
    emptyFormValues,
} from '@/components/dynamic-form-fields';
import { PhotoAttachmentField } from '@/components/photo-attachment-field';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import type { BranchOption, FormSchema } from '@/types/mcare';

type Props = {
    schema: FormSchema;
    branches: BranchOption[];
    selectedBranchId: number | null;
    today: string;
};

export default function HealthCampForm({
    schema,
    branches,
    selectedBranchId,
    today,
}: Props) {
    const form = useForm({
        activity_date: today,
        branch_id: selectedBranchId ? String(selectedBranchId) : '',
        service_data: emptyFormValues(schema),
    });

    return (
        <>
            <Head title="Record Health Camp — M Care" />

            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <Link
                        href="/health-camps"
                        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Health Camps
                    </Link>

                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Tent className="size-5" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Record Health Camp
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Branch-level medical camp services and community outreach logging
                            </p>
                        </div>
                    </div>
                </div>

                <form
                    className="space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/health-camps');
                    }}
                >
                    <div className="flex items-center justify-between border-b pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Camp Specifications
                        </span>
                        <Badge
                            variant="secondary"
                            className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px]"
                        >
                            Branch Module
                        </Badge>
                    </div>

                    {/* Date */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="activity_date" className="text-xs font-semibold flex items-center gap-1">
                            <Calendar className="size-3.5 text-muted-foreground" />
                            Camp Date <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="activity_date"
                            type="date"
                            className="rounded-xl border-border bg-background/50 text-xs shadow-2xs"
                            value={form.data.activity_date}
                            onChange={(event) =>
                                form.setData(
                                    'activity_date',
                                    event.target.value,
                                )
                            }
                        />
                        <InputError message={form.errors.activity_date} />
                    </div>

                    {/* Branch */}
                    {branches.length > 0 ? (
                        <div className="grid gap-1.5">
                            <Label htmlFor="branch_id" className="text-xs font-semibold flex items-center gap-1">
                                <Building2 className="size-3.5 text-muted-foreground" />
                                Branch
                            </Label>
                            <select
                                id="branch_id"
                                className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-xs shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                value={form.data.branch_id}
                                onChange={(event) =>
                                    form.setData(
                                        'branch_id',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">Select branch</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.branch_id} />
                        </div>
                    ) : null}

                    {/* Form Fields */}
                    <div className="border-t pt-4 space-y-4">
                        <DynamicFormFields
                            schema={schema}
                            values={form.data.service_data}
                            setValue={(name, value) =>
                                form.setData('service_data', {
                                    ...form.data.service_data,
                                    [name]: value,
                                })
                            }
                            errors={form.errors}
                            prefix="service_data"
                        />

                        <PhotoAttachmentField
                            attachments={(form.data.service_data?.attachments as unknown as string[]) || []}
                            onChange={(urls) =>
                                form.setData('service_data', {
                                    ...form.data.service_data,
                                    attachments: urls,
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="ghost"
                            asChild
                            className="rounded-xl text-xs"
                        >
                            <Link href="/health-camps">Cancel</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6 font-semibold shadow-xs"
                        >
                            {form.processing ? (
                                <Spinner className="mr-2" />
                            ) : (
                                <Send className="size-4 mr-2" />
                            )}
                            Save Health Camp
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

HealthCampForm.layout = {
    breadcrumbs: [
        { title: "Today's Task", href: dashboard() },
        { title: 'Health Camps', href: '/health-camps' },
        { title: 'Record Camp', href: '/health-camps/create' },
    ],
};
