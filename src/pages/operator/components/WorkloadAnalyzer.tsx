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

    const chartData = workload.slice(0, 10).map(w => ({
        name: w.teacherName.split(' ')[0], // Short name for x-axis
        fullName: w.teacherName,
        hours: w.totalWeeklyHours,
        students: w.studentCount,
    }));

    const getStatusBadge = (utilization: number) => {
        if (utilization > 100) return <Badge variant="destructive">{t('operator.reports.overloaded')}</Badge>;
        if (utilization >= 80) return <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200">{t('operator.reports.atCapacity')}</Badge>;
        return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200">{t('operator.reports.available')}</Badge>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hours Distribution Chart */}
                <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            {t('operator.reports.hoursPerWeek')}
                        </CardTitle>
                        <CardDescription>{t('operator.reports.standardWorkload')}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <RechartsTooltip
                                    contentStyle={{
                                        background: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                    }}
                                    formatter={(value: number) => [`${value} Jam`, '']}
                                />
                                <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={32}>
                                    {chartData.map((_entry, index) => (
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
                            {t('operator.reports.studentLoad')}
                        </CardTitle>
                        <CardDescription>{t('operator.reports.topCoursesDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <RechartsTooltip
                                    contentStyle={{
                                        background: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                    }}
                                    formatter={(value: number) => [`${value} Siswa`, '']}
                                />
                                <Bar dataKey="students" radius={[4, 4, 0, 0]} barSize={32} fill="hsl(160, 84%, 39%)" />
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
                                    <TableHead className="text-center">{t('operator.reports.hoursPerWeek')}</TableHead>
                                    <TableHead className="text-center">{t('operator.reports.courseDiversity')}</TableHead>
                                    <TableHead className="text-center">{t('operator.reports.studentLoad')}</TableHead>
                                    <TableHead className="text-right">{t('operator.reports.utilizationPercentage')}</TableHead>
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
                                                <span className="font-bold">{teacher.totalWeeklyHours}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">Jam</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold">{teacher.courseCount}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{t('operator.reports.courses')}</span>
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
                                                    <span className={`text-sm font-bold ${teacher.utilizationIndex > 100 ? 'text-destructive' : ''}`}>
                                                        {teacher.utilizationIndex}%
                                                    </span>
                                                    {getStatusBadge(teacher.utilizationIndex)}
                                                </div>
                                                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${teacher.utilizationIndex > 100 ? 'bg-destructive' :
                                                            teacher.utilizationIndex >= 80 ? 'bg-orange-500' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min(100, teacher.utilizationIndex)}%` }}
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
