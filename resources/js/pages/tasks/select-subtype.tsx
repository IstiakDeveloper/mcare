import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Sparkles, Stethoscope, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';
import type { TaskType } from '@/types/mcare';

const subtypeMeta: Record<
    string,
    { title: string; icon: typeof Users; bg: string; text: string; border: string }
> = {
    'uthan-boithok': {
        title: '1. Uthan Boithok (Yard Meeting)',
        icon: Users,
        bg: 'bg-emerald-600 text-white',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500/40 hover:border-emerald-500',
    },
    'satellite-clinic': {
        title: '2. Satellite Clinic (Outreach)',
        icon: Stethoscope,
        bg: 'bg-teal-600 text-white',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-500/40 hover:border-teal-500',
    },
    'awareness-session': {
        title: '3. Awareness Session (Health Education)',
        icon: Sparkles,
        bg: 'bg-cyan-600 text-white',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-500/40 hover:border-cyan-500',
    },
};

type Props = {
    taskType: TaskType;
};

export default function SelectSubtype({ taskType }: Props) {
    return (
        <>
            <Head title="Samity Sub-tasks — M Care" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-7 max-w-5xl mx-auto w-full">
                <div>
                    <Link
                        href={dashboard()}
                        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-emerald-600 transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Today's Hub
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                            Samity Activities (Community Outreach)
                        </h1>
                        <Badge className="bg-emerald-600 text-white text-xs font-semibold">
                            3 Sub-types
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Select which samity activity you conducted in the field today to launch its entry form.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(taskType.subtypes ?? []).map((subtype) => {
                        const meta = subtypeMeta[subtype.slug] ?? {
                            title: subtype.name,
                            icon: Users,
                            bg: 'bg-emerald-600 text-white',
                            text: 'text-emerald-600',
                            border: 'border-border hover:border-primary',
                        };
                        const Icon = meta.icon;

                        return (
                            <Link
                                key={subtype.id}
                                href={`/tasks/${taskType.slug}/${subtype.slug}`}
                                className={`group relative flex flex-col justify-between rounded-3xl border-2 bg-card p-6 shadow-xs transition-all ${meta.border} hover:shadow-lg active:scale-[0.99]`}
                            >
                                <div className="space-y-4">
                                    <div
                                        className={`flex size-14 items-center justify-center rounded-2xl ${meta.bg} shadow-md transition-transform group-hover:scale-105`}
                                    >
                                        <Icon className="size-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                                            {meta.title}
                                        </h2>
                                        <p className="mt-1 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                            {subtype.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t pt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <span>Open Entry Form</span>
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

SelectSubtype.layout = {
    breadcrumbs: [
        { title: "Today's Hub", href: dashboard() },
        { title: 'Samity Task', href: '/tasks/samity-task' },
    ],
};
