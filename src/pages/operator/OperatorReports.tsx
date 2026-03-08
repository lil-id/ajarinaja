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
    GraduationCap,
    TrendingUp,
    Users,
    Info,
    CalendarDays,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WorkloadAnalyzer } from './components/WorkloadAnalyzer';

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
                        isLoading={statsLoading}
                        colorIndex={idx}
                    />
                ))}
            </div>

            {/* Teacher Workload Analysis Section */}
            <div className="pt-6 border-t border-border/50">
                <WorkloadAnalyzer />
            </div>
        </div>
    );
};

export default OperatorReports;
