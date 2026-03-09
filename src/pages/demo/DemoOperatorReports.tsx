import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3,
    BookOpen,
    GraduationCap,
    TrendingUp,
    Users,
    CalendarDays,
    Clock,
    AlertCircle,
    Eye
} from 'lucide-react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const CHART_COLORS = [
    'hsl(221, 83%, 53%)',
    'hsl(160, 84%, 39%)',
    'hsl(33, 100%, 50%)',
    'hsl(271, 91%, 55%)',
    'hsl(346, 77%, 50%)',
];

const STAT_COLORS = [
    { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-500' },
    { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-500' },
    { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-500' },
    { bg: 'bg-violet-50 dark:bg-violet-950', text: 'text-violet-500' },
] as const;

export default function DemoOperatorReports() {
    const { t } = useTranslation();

    const stats = {
        totalTeachers: 42,
        totalStudents: 1250,
        totalCourses: 86,
        totalEnrollments: 3420,
        activePeriodName: '2024/2025 Semester 1'
    };

    const workloadData = [
        { teacherId: '1', teacherName: 'Budi Santoso', baseWeeklyHours: 18, additionalHours: 4, totalWeeklyHours: 22, studentCount: 156, complianceStatus: 'ideal' as const },
        { teacherId: '2', teacherName: 'Siti Aminah', baseWeeklyHours: 24, additionalHours: 2, totalWeeklyHours: 26, studentCount: 180, complianceStatus: 'overload' as const },
        { teacherId: '3', teacherName: 'Agus Wijaya', baseWeeklyHours: 12, additionalHours: 0, totalWeeklyHours: 12, studentCount: 84, complianceStatus: 'underload' as const },
        { teacherId: '4', teacherName: 'Dewi Lestari', baseWeeklyHours: 20, additionalHours: 2, totalWeeklyHours: 22, studentCount: 142, complianceStatus: 'ideal' as const },
        { teacherId: '5', teacherName: 'Eko Prasetyo', baseWeeklyHours: 16, additionalHours: 4, totalWeeklyHours: 20, studentCount: 120, complianceStatus: 'ideal' as const },
    ];

    const hoursChartData = [
        { name: '0-4', count: 2 },
        { name: '5-8', count: 5 },
        { name: '9-12', count: 8 },
        { name: '13-16', count: 12 },
        { name: '17-20', count: 10 },
        { name: '21-24', count: 4 },
        { name: '24+', count: 1 },
    ];

    const studentsChartData = [
        { name: '0-20', count: 4 },
        { name: '21-50', count: 15 },
        { name: '51-100', count: 18 },
        { name: '100+', count: 5 },
    ];

    const getStatusBadge = (status: 'underload' | 'ideal' | 'overload') => {
        if (status === 'overload') return <Badge variant="destructive">{t('operator.reports.overloaded')}</Badge>;
        if (status === 'ideal') return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900 border-green-200">{t('operator.reports.atCapacity')}</Badge>;
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-green-900 border-blue-200">{t('operator.reports.available')}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('operator.reports.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('operator.reports.description')} (Demo)</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 h-fit">
                        <Eye className="w-3 h-3 mr-1" /> {t('demo.viewOnly')}
                    </Badge>
                    {stats.activePeriodName && (
                        <Badge variant="secondary" className="gap-2 px-3 py-1.5 text-sm w-fit">
                            <CalendarDays className="w-4 h-4" />
                            {stats.activePeriodName}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: GraduationCap, label: t('operator.stats.totalTeachers'), value: stats.totalTeachers },
                    { icon: Users, label: t('operator.stats.totalStudents'), value: stats.totalStudents },
                    { icon: BookOpen, label: t('operator.stats.totalCourses'), value: stats.totalCourses },
                    { icon: TrendingUp, label: t('operator.stats.totalEnrollments'), value: stats.totalEnrollments },
                ].map((card, idx) => (
                    <Card key={card.label}>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className={`p-3 rounded-xl ${STAT_COLORS[idx % STAT_COLORS.length].bg}`}>
                                <card.icon className={`w-6 h-6 ${STAT_COLORS[idx % STAT_COLORS.length].text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-muted-foreground truncate">{card.label}</p>
                                <p className="text-2xl font-bold">{card.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="pt-6 border-t border-border/50 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20 shadow-sm">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('operator.reports.available')}</p>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">12</h3>
                                    <span className="text-xs text-muted-foreground">{t('operator.reports.teachers')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20 shadow-sm">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('operator.reports.atCapacity')}</p>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">25</h3>
                                    <span className="text-xs text-muted-foreground">{t('operator.reports.teachers')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('operator.reports.overloaded')}</p>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-2xl font-bold text-destructive">5</h3>
                                    <span className="text-xs text-muted-foreground">{t('operator.reports.teachers')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                {t('operator.reports.distribution')} {t('operator.reports.hoursPerWeek')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hoursChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28}>
                                        {hoursChartData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-green-500" />
                                {t('operator.reports.distribution')} {t('operator.reports.studentLoad')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={studentsChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40} fill="hsl(160, 84%, 39%)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            {t('operator.reports.workloadTitle')}
                        </CardTitle>
                        <CardDescription>{t('operator.reports.workloadDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-border/50 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[250px]">{t('operator.schedules.teacher')}</TableHead>
                                        <TableHead className="text-center">{t('operator.reports.totalJTM')}</TableHead>
                                        <TableHead className="text-center">{t('operator.reports.studentLoad')}</TableHead>
                                        <TableHead className="text-right">{t('operator.reports.jtmCompliance')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workloadData.map((teacher) => (
                                        <TableRow key={teacher.teacherId} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                                        {teacher.teacherName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span>{teacher.teacherName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-primary">{teacher.totalWeeklyHours}</TableCell>
                                            <TableCell className="text-center">{teacher.studentCount}</TableCell>
                                            <TableCell className="text-right">{getStatusBadge(teacher.complianceStatus)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
