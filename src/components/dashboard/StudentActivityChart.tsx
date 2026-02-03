import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentActivityStats } from '@/hooks/useStudentActivityStats';
import { Loader2, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';

export function StudentActivityChart() {
    const { t } = useTranslation();
    const { data: activityData, isLoading } = useStudentActivityStats(7);

    if (isLoading) {
        return (
            <Card className="border-0 shadow-card h-full">
                <CardHeader>
                    <CardTitle className="text-lg">{t('dashboard.weeklyActivity')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const totalSubmissions = activityData?.reduce((sum, day) => sum + day.total, 0) || 0;

    return (
        <Card className="border-0 shadow-card h-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        {t('dashboard.weeklyActivity')}
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{totalSubmissions}</p>
                        <p className="text-xs text-muted-foreground">{t('dashboard.totalSubmissionsWeek')}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {activityData && activityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="colorAssignments" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="date"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    color: 'hsl(var(--card-foreground))',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '12px' }}
                                formatter={(value) => {
                                    if (value === 'assignment_submissions') return t('assignments.title');
                                    if (value === 'exam_submissions') return t('exams.title');
                                    return value;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="assignment_submissions"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fill="url(#colorAssignments)"
                                name={t('assignments.title')}
                            />
                            <Area
                                type="monotone"
                                dataKey="exam_submissions"
                                stroke="hsl(var(--secondary))"
                                strokeWidth={2}
                                fill="url(#colorExams)"
                                name={t('exams.title')}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center py-16">
                        <p className="text-sm text-muted-foreground">{t('dashboard.noActivityData')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
