import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    GraduationCap,
    Users,
    BookOpen,
    CalendarDays,
    TrendingUp,
    CheckCircle,
    Info,
    Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function DemoOperatorDashboard() {
    const { t } = useTranslation();

    const activePeriod = {
        id: 'demo-period-1',
        name: '2024/2025 Semester 1',
        is_active: true,
        academic_year: '2024/2025',
        semester: 1
    };

    const stats = {
        totalTeachers: 42,
        totalStudents: 1250,
        totalCourses: 86,
        totalEnrollments: 3420,
    };

    const statCards = [
        {
            label: t('operator.stats.totalTeachers'),
            value: stats.totalTeachers,
            icon: GraduationCap,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-950',
            tooltip: t('operator.statsTooltips.totalTeachers'),
        },
        {
            label: t('operator.stats.totalStudents'),
            value: stats.totalStudents,
            icon: Users,
            color: 'text-green-500',
            bg: 'bg-green-50 dark:bg-green-950',
            tooltip: t('operator.statsTooltips.totalStudents'),
        },
        {
            label: t('operator.stats.totalCourses'),
            value: stats.totalCourses,
            icon: BookOpen,
            color: 'text-purple-500',
            bg: 'bg-purple-50 dark:bg-purple-950',
            tooltip: t('operator.statsTooltips.totalCourses'),
        },
        {
            label: t('operator.stats.totalEnrollments'),
            value: stats.totalEnrollments,
            icon: TrendingUp,
            color: 'text-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-950',
            tooltip: t('operator.statsTooltips.totalEnrollments'),
        },
    ];

    const periods = [
        activePeriod,
        { id: 'demo-period-2', name: '2023/2024 Semester 2', is_active: false, academic_year: '2023/2024', semester: 2 },
        { id: 'demo-period-3', name: '2023/2024 Semester 1', is_active: false, academic_year: '2023/2024', semester: 1 },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('operator.dashboard.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('operator.dashboard.description')} (Demo)</p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 h-fit">
                    <Eye className="w-3 h-3 mr-1" /> {t('demo.viewOnly')}
                </Badge>
            </div>

            {/* Active Period Banner */}
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
                                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Demo Content</CardTitle>
                            <CardDescription>Main dashboard features are displayed here in the full version.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20">
                            <p className="text-muted-foreground">Interactive Charts & Alerts</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="w-5 h-5" />
                                {t('operator.dashboard.periodsOverview')}
                            </CardTitle>
                            <CardDescription>{t('operator.dashboard.periodsOverviewDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {periods.map(period => (
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
