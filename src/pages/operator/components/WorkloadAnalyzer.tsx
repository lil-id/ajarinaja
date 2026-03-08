/**
 * @fileoverview WorkloadAnalyzer Component
 * @description Visualizes teacher workload metrics using graphs and tables.
 */
import { useTranslation } from 'react-i18next';
import { useTeacherWorkload, TeacherWorkload } from '@/hooks/useTeacherWorkload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { BarChart3, Users, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CHART_COLORS = [
    'hsl(221, 83%, 53%)',  // blue
    'hsl(160, 84%, 39%)',  // green
    'hsl(33, 100%, 50%)',  // amber
    'hsl(271, 91%, 55%)',  // violet
    'hsl(346, 77%, 50%)',  // rose
];

export function WorkloadAnalyzer() {
    const { t } = useTranslation();
    const { workload, isLoading, error } = useTeacherWorkload();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-12 bg-destructive/10 rounded-xl border border-destructive/20 text-destructive">
                <AlertCircle className="w-6 h-6 mr-2" />
                <p>{t('toast.errorOccurred')}</p>
            </div>
        );
    }

    // Aggregate data into distribution buckets
    const hoursDistribution = {
        '0-4': 0, '5-8': 0, '9-12': 0, '13-16': 0, '17-20': 0, '21-24': 0, '24+': 0
    };

    const studentsDistribution = {
        '0-20': 0, '21-50': 0, '51-100': 0, '100+': 0
    };

    let overloadedCount = 0;
    let idealCount = 0;
    let underloadCount = 0;

    workload.forEach(w => {
        // Status counts based on JTM Compliance
        if (w.complianceStatus === 'overload') overloadedCount++;
        else if (w.complianceStatus === 'ideal') idealCount++;
        else underloadCount++;

        // Hours buckets (using total JTM)
        if (w.totalWeeklyHours <= 4) hoursDistribution['0-4']++;
        else if (w.totalWeeklyHours <= 8) hoursDistribution['5-8']++;
        else if (w.totalWeeklyHours <= 12) hoursDistribution['9-12']++;
        else if (w.totalWeeklyHours <= 16) hoursDistribution['13-16']++;
        else if (w.totalWeeklyHours <= 20) hoursDistribution['17-20']++;
        else if (w.totalWeeklyHours <= 24) hoursDistribution['21-24']++;
        else hoursDistribution['24+']++;

        // Students buckets
        if (w.studentCount <= 20) studentsDistribution['0-20']++;
        else if (w.studentCount <= 50) studentsDistribution['21-50']++;
        else if (w.studentCount <= 100) studentsDistribution['51-100']++;
        else studentsDistribution['100+']++;
    });

    const hoursChartData = [
        { name: t('operator.reports.hours_0_4'), count: hoursDistribution['0-4'] },
        { name: t('operator.reports.hours_5_8'), count: hoursDistribution['5-8'] },
        { name: t('operator.reports.hours_9_12'), count: hoursDistribution['9-12'] },
        { name: t('operator.reports.hours_13_16'), count: hoursDistribution['13-16'] },
        { name: t('operator.reports.hours_17_20'), count: hoursDistribution['17-20'] },
        { name: t('operator.reports.hours_21_24'), count: hoursDistribution['21-24'] },
        { name: t('operator.reports.hours_24_plus'), count: hoursDistribution['24+'] },
    ];

    const studentsChartData = [
        { name: t('operator.reports.students_0_20'), count: studentsDistribution['0-20'] },
        { name: t('operator.reports.students_21_50'), count: studentsDistribution['21-50'] },
        { name: t('operator.reports.students_51_100'), count: studentsDistribution['51-100'] },
        { name: t('operator.reports.students_100_plus'), count: studentsDistribution['100+'] },
    ];

    const getStatusBadge = (status: 'underload' | 'ideal' | 'overload') => {
        if (status === 'overload') return <Badge variant="destructive">{t('operator.reports.overloaded')}</Badge>;
        if (status === 'ideal') return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900 border-green-200">{t('operator.reports.atCapacity')}</Badge>;
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 border-blue-200">{t('operator.reports.available')}</Badge>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('operator.reports.available')}</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{underloadCount}</h3>
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
                                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{idealCount}</h3>
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
                                <h3 className="text-2xl font-bold text-destructive">{overloadedCount}</h3>
                                <span className="text-xs text-muted-foreground">{t('operator.reports.teachers')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hours Distribution Chart */}
                <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            {t('operator.reports.distribution')} {t('operator.reports.hoursPerWeek')}
                        </CardTitle>
                        <CardDescription>{t('operator.reports.standardWorkload')}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hoursChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                                    contentStyle={{
                                        background: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                    }}
                                    formatter={(value: number) => [`${value} ${t('operator.reports.teachers')}`, '']}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28}>
                                    {hoursChartData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Student Load Chart */}
                <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-500" />
                            {t('operator.reports.distribution')} {t('operator.reports.studentLoad')}
                        </CardTitle>
                        <CardDescription>{t('operator.reports.topCoursesDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={studentsChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                                    contentStyle={{
                                        background: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                    }}
                                    formatter={(value: number) => [`${value} ${t('operator.reports.teachers')}`, '']}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40} fill="hsl(160, 84%, 39%)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            {/* Detailed Table */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                {t('operator.reports.workloadTitle')}
                            </CardTitle>
                            <CardDescription>{t('operator.reports.workloadDesc')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[250px]">{t('operator.schedules.teacher')}</TableHead>
                                    <TableHead className="text-center">{t('operator.reports.baseJTM')}</TableHead>
                                    <TableHead className="text-center">{t('operator.reports.additionalJTM')}</TableHead>
                                    <TableHead className="text-center">{t('operator.reports.totalJTM')}</TableHead>
                                    <TableHead className="text-center">{t('operator.reports.studentLoad')}</TableHead>
                                    <TableHead className="text-right">{t('operator.reports.jtmCompliance')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workload.map((teacher) => (
                                    <TableRow key={teacher.teacherId} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                                    {teacher.teacherName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className="truncate max-w-[160px]">{teacher.teacherName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold">{teacher.baseWeeklyHours}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">Jam</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold">+{teacher.additionalHours}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">Jam</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-primary">{teacher.totalWeeklyHours}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">Total Jam</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold">{teacher.studentCount}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{t('operator.reports.students')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(teacher.complianceStatus)}
                                                </div>
                                                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${teacher.complianceStatus === 'overload' ? 'bg-destructive' :
                                                            teacher.complianceStatus === 'ideal' ? 'bg-green-500' : 'bg-blue-500'
                                                            }`}
                                                        style={{ width: `${Math.min(100, (teacher.totalWeeklyHours / 40) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
