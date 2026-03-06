/**
 * @fileoverview Dashboard Alerts Component
 * @description Displays real-time operational alerts (e.g., Unassigned Schedules) for Operators.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CalendarDays, ArrowRight } from 'lucide-react';
import { useUnassignedSchedules, DAY_LABELS } from '@/hooks/useSchedules';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardAlerts = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: unassignedSchedules, isLoading } = useUnassignedSchedules();

    if (isLoading) {
        return (
            <Card className="border-destructive/20 hidden md:block">
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-60 mt-2" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </CardContent>
            </Card>
        );
    }

    // Don't render the alert box if everything is perfect (empty state)
    if (!unassignedSchedules || unassignedSchedules.length === 0) {
        return null;
    }

    return (
        <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    {t('operator.dashboard.actionRequired')}
                    <Badge variant="destructive" className="ml-2 rounded-full">
                        {unassignedSchedules.length}
                    </Badge>
                </CardTitle>
                <CardDescription className="text-destructive/80">
                    {t('operator.dashboard.unassignedAlertsDesc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {unassignedSchedules.slice(0, 5).map((schedule) => (
                    <div
                        key={schedule.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-destructive/20 bg-background/50 backdrop-blur-sm"
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">
                                    {(schedule.course as unknown as { title: string })?.title ?? '—'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                    {(schedule.class as unknown as { name: string })?.name ?? '—'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    {DAY_LABELS[schedule.day_of_week]}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full sm:w-auto gap-1"
                            onClick={() => navigate('/operator/schedules')}
                        >
                            {t('operator.dashboard.assignTeacher')}
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                ))}

                {unassignedSchedules.length > 5 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate('/operator/schedules')}
                    >
                        {t('operator.dashboard.viewAllAlerts', { count: unassignedSchedules.length - 5 })}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};
