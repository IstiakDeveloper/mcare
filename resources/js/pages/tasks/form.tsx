import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, CheckCircle2, HeartPulse, MapPin, Send } from 'lucide-react';
import {
    DynamicFormFields,
    emptyFormValues,
} from '@/components/dynamic-form-fields';
import { PhotoAttachmentField } from '@/components/photo-attachment-field';
import {
    HouseholdEntry,
    HouseholdRepeater,
} from '@/components/household-repeater';
import {
    PatientEntry,
    SatellitePatientRepeater,
} from '@/components/satellite-patient-repeater';
import {
    StaticClinicPatient,
    StaticClinicPatientRepeater,
} from '@/components/static-clinic-patient-repeater';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import type {
    BranchOption,
    FormSchema,
    SamityOption,
    TaskSubtype,
    TaskType,
} from '@/types/mcare';

type Props = {
    taskType: TaskType;
    taskSubtype: TaskSubtype | null;
    schema: FormSchema;
    samities: SamityOption[];
    branches: BranchOption[];
    selectedBranchId: number | null;
    today: string;
};

export default function TaskForm({
    taskType,
    taskSubtype,
    schema,
    samities,
    branches,
    selectedBranchId,
    today,
}: Props) {
    const title = schema.title || taskSubtype?.name || taskType.name;
    const form = useForm({
        task_type_id: taskType.id,
        task_subtype_id: taskSubtype?.id ?? '',
        activity_date: today,
        branch_id: selectedBranchId ? String(selectedBranchId) : '',
        samity_id: '',
        form_data: emptyFormValues(schema),
    });

    return (
        <>
            <Head title={`${title} — M Care Form`} />

            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6 pb-24 md:pb-6">
                <div>
                    <Link
                        href={
                            taskType.requires_subtype
                                ? `/tasks/${taskType.slug}`
                                : dashboard()
                        }
                        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        ফিরে যান (Back)
                    </Link>

                    <div className="flex items-center gap-2.5 mt-1">
                        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <HeartPulse className="size-5" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {title}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                দৈনিক ফিল্ড অ্যাক্টিভিটি রিপোর্ট এন্ট্রি
                            </p>
                        </div>
                    </div>
                </div>

                <form
                    className="space-y-5 rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-xs"
                    onSubmit={(event) => {
                        event.preventDefault();

                        if (taskType.slug === 'static-clinic') {
                            const expectedTotal = Number(
                                form.data.form_data?.patients_served || 0,
                            );
                            const patientsList =
                                (form.data.form_data
                                    ?.patients as unknown as StaticClinicPatient[]) ||
                                [];

                            if (
                                expectedTotal > 0 &&
                                patientsList.length < expectedTotal
                            ) {
                                alert(
                                    `মোট সেবাগ্রহীতা ${expectedTotal} জন উল্লেখ করা হয়েছে, কিন্তু ${patientsList.length} জনের তথ্য দেওয়া হয়েছে। ফর্ম সেভ করতে বাকি ${expectedTotal - patientsList.length} জন রোগীর তথ্যও পূরণ করতে হবে।`,
                                );
                                return;
                            }

                            if (patientsList.length === 0) {
                                alert(
                                    'অনুগ্রহ করে কমপক্ষে ১ জন রোগীর তথ্য যুক্ত করুন।',
                                );
                                return;
                            }
                        }

                        form.post('/activities');
                    }}
                >
                    {/* Auto Branch & Date in 2-Col Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-2">
                        {/* Branch */}
                        {branches.length > 1 ? (
                            <div className="grid gap-1.5">
                                <Label htmlFor="branch_id" className="text-xs font-semibold flex items-center gap-1">
                                    <Building2 className="size-3.5 text-muted-foreground" />
                                    শাখা (Branch) <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="branch_id"
                                    className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-xs shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    value={form.data.branch_id}
                                    onChange={(event) => {
                                        form.setData('branch_id', event.target.value);
                                        form.setData('samity_id', '');
                                    }}
                                >
                                    <option value="">শাখা নির্বাচন করুন</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.branch_id} />
                            </div>
                        ) : (
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-semibold flex items-center gap-1">
                                    <Building2 className="size-3.5 text-muted-foreground" />
                                    শাখা (Branch)
                                </Label>
                                <div className="flex h-10 items-center justify-between rounded-xl border border-input bg-muted/30 px-3 text-xs font-medium text-foreground">
                                    <span>{branches[0]?.name ?? 'শাখা নির্ধারিত নেই'}</span>
                                    <Badge variant="secondary" className="text-[10px] font-normal py-0 h-5">
                                        অটোমেটিক
                                    </Badge>
                                </div>
                                <input type="hidden" name="branch_id" value={branches[0]?.id ?? ''} />
                            </div>
                        )}

                        {/* Date Picker */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="activity_date" className="text-xs font-semibold">
                                তারিখ (Date) <span className="text-destructive">*</span>
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
                    </div>

                    {/* Samity Selector */}
                    {schema.requires_samity ? (
                        <div className="grid gap-1.5">
                            <Label htmlFor="samity_id" className="text-xs font-semibold flex items-center gap-1">
                                <MapPin className="size-3.5 text-muted-foreground" />
                                Target Samity <span className="text-destructive">*</span>
                            </Label>
                            <select
                                id="samity_id"
                                className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-xs shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                value={form.data.samity_id}
                                onChange={(event) =>
                                    form.setData(
                                        'samity_id',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">Select samity</option>
                                {samities.map((samity) => (
                                    <option key={samity.id} value={samity.id}>
                                        {samity.name} {samity.code ? `(${samity.code})` : ''}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.samity_id} />
                            {samities.length === 0 ? (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    No samities found under this branch. Please check HRM data link.
                                </p>
                            ) : null}
                        </div>
                    ) : null}

                    {/* Dynamic Fields Grid */}
                    <div className="border-t pt-4 space-y-4">
                        <DynamicFormFields
                            schema={schema}
                            values={form.data.form_data}
                            setValue={(name, value) =>
                                form.setData('form_data', {
                                    ...form.data.form_data,
                                    [name]: value,
                                })
                            }
                            errors={form.errors}
                        />

                        {taskSubtype?.slug === 'satellite-clinic' ? (
                            <SatellitePatientRepeater
                                patients={
                                    (form.data.form_data
                                        ?.patients as unknown as PatientEntry[]) ||
                                    []
                                }
                                onChange={(patientsList) =>
                                    form.setData('form_data', {
                                        ...form.data.form_data,
                                        patients: patientsList,
                                    })
                                }
                            />
                        ) : null}

                        {taskType.slug === 'static-clinic' ? (
                            <StaticClinicPatientRepeater
                                expectedTotal={
                                    form.data.form_data?.patients_served as string | number || 0
                                }
                                expectedMale={
                                    form.data.form_data?.male_count as string | number || 0
                                }
                                expectedFemale={
                                    form.data.form_data?.female_count as string | number || 0
                                }
                                patients={
                                    (form.data.form_data
                                        ?.patients as unknown as StaticClinicPatient[]) ||
                                    []
                                }
                                onChange={(patientsList) =>
                                    form.setData('form_data', {
                                        ...form.data.form_data,
                                        patients: patientsList,
                                    })
                                }
                            />
                        ) : null}

                        {taskType.slug === 'household-visit' ? (
                            <HouseholdRepeater
                                households={
                                    (form.data.form_data
                                        ?.households as unknown as HouseholdEntry[]) ||
                                    []
                                }
                                onChange={(householdsList) =>
                                    form.setData('form_data', {
                                        ...form.data.form_data,
                                        households: householdsList,
                                    })
                                }
                            />
                        ) : null}

                        <PhotoAttachmentField
                            attachments={(form.data.form_data?.attachments as unknown as string[]) || []}
                            onChange={(urls) =>
                                form.setData('form_data', {
                                    ...form.data.form_data,
                                    attachments: urls,
                                })
                            }
                        />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t">
                        <Button
                            variant="ghost"
                            asChild
                            className="w-full sm:w-auto rounded-xl text-xs font-medium h-9"
                        >
                            <Link href={dashboard()}>বাতিল (Cancel)</Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="w-full sm:w-auto rounded-xl px-6 font-semibold shadow-xs text-xs h-10"
                        >
                            {form.processing ? (
                                <Spinner className="mr-2" />
                            ) : (
                                <Send className="size-4 mr-2" />
                            )}
                            রিপোর্ট জমা দিন (Submit Report)
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

TaskForm.layout = {
    breadcrumbs: [
        { title: "Today's Task", href: dashboard() },
        { title: 'Activity Form', href: '/tasks/household-visit' },
    ],
};
