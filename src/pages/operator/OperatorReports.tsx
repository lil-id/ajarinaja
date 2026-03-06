/**
 * @fileoverview Operator Reports Page
 * @description School-wide academic reports and analytics for the operator.
 * Uses recharts for data visualization.
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSchoolStats } from '@/hooks/useSchoolStats';
import { useAllCourses } from '@/hooks/useAllCourses';
import { useRoleUsers } from '@/hooks/useRoleUsers';
import {
    BarChart3,
    BookOpen,
    Crown,
    GraduationCap,
    TrendingUp,
    Users,
    Info,
    CalendarDays,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { WorkloadAnalyzer } from './components/WorkloadAnalyzer';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

/** Stat card colors */
const STAT_COLORS = [
    { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-500' },
    { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-500' },
    { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-500' },
    { bg: 'bg-violet-50 dark:bg-violet-950', text: 'text-violet-500' },
] as const;

/** Chart bar colors */
const CHART_COLORS = [
    'hsl(221, 83%, 53%)',  // blue
    'hsl(160, 84%, 39%)',  // green
    'hsl(33, 100%, 50%)',  // amber
    'hsl(271, 91%, 55%)',  // violet
    'hsl(346, 77%, 50%)',  // rose
];

/**
 * Reusable stat card component to reduce repetition.
 */
const StatCard = ({
    icon: Icon,
    label,
    tooltipText,
    value,
    isLoading,
    colorIndex,
}: {
    icon: React.ElementType;
    label: string;
    tooltipText: string;
    value: number | string;
    isLoading: boolean;
    colorIndex: number;
}) => {
    const color = STAT_COLORS[colorIndex % STAT_COLORS.length];
    return (
        <Card className="overflow-hidden">
            <CardContent className="flex items-center gap-4 p-6">
                <div className={`p-3 rounded-xl ${color.bg}`}>
                    <Icon className={`w-6 h-6 ${color.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        <p className="text-sm text-muted-foreground truncate">{label}</p>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger type="button" className="cursor-help flex-shrink-0">
                                    <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[200px] text-center">
                                    <p>{tooltipText}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    {isLoading ? (
                        <Skeleton className="h-7 w-10 mt-1" />
                    ) : (
                        <p className="text-2xl font-bold">{value}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const OperatorReports = () => {
    const { t } = useTranslation();
    const { stats, isLoading: statsLoading } = useSchoolStats();
    const { courses, isLoading: coursesLoading } = useAllCourses();
    const { data: teachers = [], isLoading: teachersLoading } = useRoleUsers('teacher');

    const isLoading = statsLoading || coursesLoading || teachersLoading;

    // Top courses by enrollment (for chart)
    const topCourses = [...courses]
        .sort((a, b) => b.enrollment_count - a.enrollment_count)
        .slice(0, 5)
        .map(c => ({
            name: c.title.length > 20 ? c.title.slice(0, 20) + '…' : c.title,
            fullName: c.title,
            teacher: c.teacher_name || c.teacher_id,
            value: c.enrollment_count,
        }));

    // Teacher distribution with avatar info
    const teacherCourseData = courses.reduce((acc, c) => {
        const id = c.teacher_id;
        if (!acc[id]) {
            acc[id] = { id, name: c.teacher_name || c.teacher_id, count: 0 };
        }
        acc[id].count += 1;
        return acc;
    }, {} as Record<string, { id: string; name: string; count: number }>);

    // Build avatar map from useRoleUsers
    const avatarMap = new Map(teachers.map(t => [t.id, t.avatar_url]));

    const topTeachers = Object.values(teacherCourseData)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(t => ({
            ...t,
            avatar_url: avatarMap.get(t.id) || null,
            initials: t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        }));

    const statCards = [
        {
            icon: GraduationCap,
            label: t('operator.stats.totalTeachers'),
            tooltip: t('operator.statsTooltips.totalTeachers'),
            value: stats?.totalTeachers ?? 0,
        },
        {
            icon: Users,
            label: t('operator.stats.totalStudents'),
            tooltip: t('operator.statsTooltips.totalStudents'),
            value: stats?.totalStudents ?? 0,
        },
        {
            icon: BookOpen,
            label: t('operator.stats.totalCourses'),
            tooltip: t('operator.statsTooltips.totalCourses'),
            value: stats?.totalCourses ?? 0,
        },
        {
            icon: TrendingUp,
            label: t('operator.stats.totalEnrollments'),
            tooltip: t('operator.statsTooltips.totalEnrollments'),
            value: stats?.totalEnrollments ?? 0,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header with active period badge */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('operator.reports.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('operator.reports.description')}</p>
                </div>
                {stats?.activePeriodName && (
                    <Badge variant="secondary" className="gap-2 px-3 py-1.5 text-sm w-fit">
                        <CalendarDays className="w-4 h-4" />
                        {stats.activePeriodName}
                    </Badge>
                )}
            </div>

            {/* Summary Cards — 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, idx) => (
                    <StatCard
                        key={card.label}
                        icon={card.icon}
                        label={card.label}
                        tooltipText={card.tooltip}
                        value={card.value}
                        isLoading={isLoading}
                        colorIndex={idx}
                    />
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Courses Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            {t('operator.reports.topCourses')}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger type="button" className="cursor-help">
                                        <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[200px] text-center">
                                        <p>{t('operator.reports.top5Tooltip')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <CardDescription>{t('operator.reports.topCoursesDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {coursesLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        ) : topCourses.length === 0 ? (
                            <p className="text-muted-foreground text-center py-6">
                                {t('operator.courses.noCoursesFound')}
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={topCourses.length * 56 + 40}>
                                <BarChart
                                    data={topCourses}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                    <XAxis type="number" allowDecimals={false} fontSize={12} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={140}
                                        fontSize={12}
                                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            background: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                        }}
                                        formatter={(value: number) => [`${value} ${t('operator.reports.students')}`, '']}
                                        labelFormatter={(label: string, payload) => {
                                            const item = payload?.[0]?.payload;
                                            return item?.fullName || label;
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                                        {topCourses.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Top Teachers List Cards */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            {t('operator.reports.topTeachers')}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger type="button" className="cursor-help">
                                        <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[200px] text-center">
                                        <p>{t('operator.reports.top5Tooltip')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <CardDescription>{t('operator.reports.topTeachersDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(coursesLoading || teachersLoading) ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                            </div>
                        ) : topTeachers.length === 0 ? (
                            <p className="text-muted-foreground text-center py-6">
                                {t('operator.users.noTeachersFound')}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {topTeachers.map((teacher, idx) => (
                                    <div
                                        key={teacher.id}
                                        className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${idx === 0
                                            ? 'border-amber-400 bg-amber-50/50 dark:border-amber-500/60 dark:bg-amber-950/30 shadow-sm'
                                            : 'border-border hover:bg-muted/50'
                                            }`}
                                    >
                                        {/* Rank */}
                                        <div className="flex items-center justify-center w-7 flex-shrink-0">
                                            {idx === 0 ? (
                                                <Crown className="w-5 h-5 text-amber-500" />
                                            ) : (
                                                <span className="text-sm font-bold text-muted-foreground">{idx + 1}</span>
                                            )}
                                        </div>

                                        {/* Avatar */}
                                        <Avatar className="w-10 h-10 flex-shrink-0">
                                            <AvatarImage src={teacher.avatar_url || undefined} alt={teacher.name} />
                                            <AvatarFallback className="text-xs font-medium">
                                                {teacher.initials}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${idx === 0 ? 'text-amber-900 dark:text-amber-200' : ''}`}>
                                                {teacher.name}
                                            </p>
                                        </div>

                                        {/* Course count badge */}
                                        <Badge variant={idx === 0 ? 'default' : 'outline'} className="flex-shrink-0">
                                            {teacher.count} {t('operator.reports.courses')}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Teacher Workload Analysis Section */}
            <div className="pt-6 border-t border-border/50">
                <WorkloadAnalyzer />
            </div>
        </div>
    );
};

export default OperatorReports;
