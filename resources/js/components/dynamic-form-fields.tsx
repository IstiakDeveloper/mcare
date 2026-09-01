import { usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormSchema } from '@/types/mcare';

type Props = {
    schema: FormSchema;
    values: Record<string, string>;
    setValue: (name: string, value: string) => void;
    errors: Record<string, string>;
    prefix?: string;
};

const getPlaceholder = (field: { name: string; label: string; type: string }) => {
    switch (field.name) {
        case 'samity_name':
            return 'সমিতির নাম লিখুন (যেমন: পালপাড়া সমিতি)';
        case 'samity_number':
            return 'সমিতির নম্বর (যেমন: ১২)';
        case 'village':
            return 'গ্রাম বা এলাকার নাম (যেমন: শৈলগাছী, পালপাড়া)';
        case 'member_name':
            return 'সদস্যের নাম লিখুন';
        case 'member_age':
            return 'বয়স (বছর)';
        case 'member_number':
            return 'সদস্য নম্বর / আইডি';
        case 'patient_name':
            return 'সেবা প্রাপ্ত ব্যক্তির নাম লিখুন';
        case 'patient_age':
            return 'যেমন: ২৮ বছর (বা শিশুর ক্ষেত্রে ৮ মাস)';
        case 'attendees_count':
            return '১২';
        case 'topics_discussed':
            return 'স্বাস্থ্য সচেতনতা, প্রতিরোধমূলক স্বাস্থ্য, চক্ষু রোগ, ডায়াবেটিস ও উচ্চ রক্তচাপ নিয়ে আলোচনা...';
        case 'notes':
            return 'সদস্যদের দেওয়া পরামর্শ ও গুরুত্বপূর্ণ মন্তব্য...';
        case 'household_head':
            return 'খানা প্রধানের নাম লিখুন';
        case 'members_visited':
            return 'পরিদর্শনকৃত সদস্য সংখ্যা';
        case 'findings':
            return 'প্রাপ্ত স্বাস্থ্য তথ্য ও পর্যবেক্ষণ লিখুন...';
        case 'patients_served':
            return 'মোট সেবাগ্রহীতার সংখ্যা';
        case 'services_provided':
            return 'প্রদত্ত স্বাস্থ্যসেবার বিবরণ (যেমন: স্বাস্থ্য পরীক্ষা, রক্তচাপ ও ডায়াবেটিস টেস্ট, পুষ্টি ও ওষুধ পরামর্শ)...';
        case 'camp_name':
            return 'ক্যাম্পের নাম লিখুন';
        case 'location':
            return 'ক্যাম্পের স্থান বা ভেন্যু লিখুন';
        default:
            return field.type === 'number' ? '০' : 'লিখুন...';
    }
};

export function DynamicFormFields({
    schema,
    values,
    setValue,
    errors,
    prefix = 'form_data',
}: Props) {
    const pageErrors = usePage().props.errors;

    return (
        <div className="grid gap-4">
            {schema.fields.map((field) => {
                const errorKey = `${prefix}.${field.name}`;
                const message =
                    errors[errorKey] ||
                    errors[field.name] ||
                    pageErrors[errorKey];

                return (
                    <div key={field.name} className="grid gap-1.5">
                        <Label
                            htmlFor={field.name}
                            className="text-xs font-semibold text-foreground flex items-center justify-between"
                        >
                            <span>
                                {field.label}
                                {field.required ? (
                                    <span className="text-destructive font-bold"> *</span>
                                ) : null}
                            </span>
                        </Label>

                        {field.type === 'textarea' ? (
                            <Textarea
                                id={field.name}
                                name={`${prefix}[${field.name}]`}
                                value={values[field.name] ?? ''}
                                onChange={(event) =>
                                    setValue(field.name, event.target.value)
                                }
                                placeholder={getPlaceholder(field)}
                                rows={3}
                                className="rounded-xl border-border bg-background/50 text-xs shadow-2xs transition-all focus-visible:ring-2 focus-visible:ring-primary leading-relaxed"
                            />
                        ) : field.type === 'select' && field.options ? (
                            <select
                                id={field.name}
                                name={`${prefix}[${field.name}]`}
                                value={values[field.name] ?? ''}
                                onChange={(event) =>
                                    setValue(field.name, event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-xs shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <option value="">নির্বাচন করুন</option>
                                {field.options.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <Input
                                id={field.name}
                                type={
                                    field.type === 'number' ? 'number' : 'text'
                                }
                                name={`${prefix}[${field.name}]`}
                                min={field.type === 'number' ? 0 : undefined}
                                value={values[field.name] ?? ''}
                                onChange={(event) =>
                                    setValue(field.name, event.target.value)
                                }
                                placeholder={getPlaceholder(field)}
                                className="rounded-xl border-border bg-background/50 text-xs shadow-2xs transition-all focus-visible:ring-2 focus-visible:ring-primary"
                            />
                        )}
                        <InputError message={message} />
                    </div>
                );
            })}
        </div>
    );
}

export function emptyFormValues(schema: FormSchema): Record<string, string> {
    return Object.fromEntries(schema.fields.map((field) => [field.name, '']));
}
