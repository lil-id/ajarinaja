/**
 * @fileoverview Operator Dashboard Page
 * @description Overview of school-wide metrics for the operator/academic staff.
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchoolStats } from '@/hooks/useSchoolStats';
import { useAcademicPeriods } from '@/hooks/useAcademicPeriods';
import {
    GraduationCap,
    Users,
    BookOpen,
    CalendarDays,
    TrendingUp,
    CheckCircle,
    Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DashboardAlerts } from './components/DashboardAlerts';

const OperatorDashboard = () => {
    const { t } = useTranslation();
    const { stats, isLoading } = useSchoolStats();
    const { periods } = useAcademicPeriods();

    const activePeriod = periods.find(p => p.is_active);

    const statCards = [
        {
            label: t('operator.stats.totalTeachers'),
            value: stats?.totalTeachers ?? 0,
            icon: GraduationCap,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-950',
            tooltip: t('operator.statsTooltips.totalTeachers'),
        },
        {
            label: t('operator.stats.totalStudents'),
            value: stats?.totalStudents ?? 0,
            icon: Users,
            color: 'text-green-500',
            bg: 'bg-green-50 dark:bg-green-950',
            tooltip: t('operator.statsTooltips.totalStudents'),
        },
        {
            label: t('operator.stats.totalCourses'),
            value: stats?.totalCourses ?? 0,
            icon: BookOpen,
            color: 'text-purple-500',
            bg: 'bg-purple-50 dark:bg-purple-950',
            tooltip: t('operator.statsTooltips.totalCourses'),
        },
        {
            label: t('operator.stats.totalEnrollments'),
            value: stats?.totalEnrollments ?? 0,
            icon: TrendingUp,
            color: 'text-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-950',
            tooltip: t('operator.statsTooltips.totalEnrollments'),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">{t('operator.dashboard.title')}</h1>
                <p className="text-muted-foreground mt-1">{t('operator.dashboard.description')}</p>
            </div>

            {/* Active Period Banner */}
            {activePeriod && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="flex items-center gap-3 py-4">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium">
                            {t('operator.dashboard.activePeriod')}:{' '}
                            <span className="text-primary">{activePeriod.name}</span>
                        </span>
                        <Badge variant="secondary" className="ml-auto">{t('reportCards.periodActive')}</Badge>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(card => (
                    <Card key={card.label}>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className={`p-3 rounded-xl ${card.bg}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-1">
                                    <p className="text-sm text-muted-foreground">{card.label}</p>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger type="button" className="cursor-help">
                                                <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[200px] text-center">
                                                <p>{card.tooltip}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                {isLoading ? (
                                    <Skeleton className="h-7 w-12 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area: Alerts (Left) and Overviews (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Alerts & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <DashboardAlerts />
                </div>

                {/* Right Column: Summaries */}
                <div className="space-y-6">
                    {/* Academic Periods Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="w-5 h-5" />
                                {t('operator.dashboard.periodsOverview')}
                            </CardTitle>
                            <CardDescription>{t('operator.dashboard.periodsOverviewDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {periods.length === 0 ? (
                                <p className="text-muted-foreground text-center py-6">{t('operator.periods.noPeriods')}</p>
                            ) : (
                                <div className="space-y-2">
                                    {periods.slice(0, 5).map(period => (
                                        <div key={period.id} className="flex items-center justify-between p-3 rounded-lg border">
                                            <div>
                                                <p className="font-medium">{period.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t('reportCards.semester')} {period.semester} {period.academic_year}
                                                </p>
                                            </div>
                                            {period.is_active && (
                                                <Badge variant="secondary">{t('reportCards.periodActive')}</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OperatorDashboard;
