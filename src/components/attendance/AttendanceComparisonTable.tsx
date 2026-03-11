import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isWeekend } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { useAttendanceMatrix, AttendanceStatus } from '@/hooks/useAttendanceMatrix';
import { useUpdateAttendanceManual } from '@/hooks/useAttendanceSessions';
import { toast } from "sonner";
import { TrendingUp, Check, X, Clock, FileText, AlertCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { AttendanceSummary } from './AttendanceSummary';
import { AttendanceCalendar } from './AttendanceCalendar';

interface AttendanceComparisonTableProps {
    courseId: string;
    classId?: string;
    courseName?: string;
    readOnly?: boolean;
    targetStudentId?: string;
}

export const AttendanceComparisonTable = ({
    courseId,
    classId,
    courseName,
    readOnly = false,
    targetStudentId
}: AttendanceComparisonTableProps) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
    const currentLocale = i18n.language === 'id' ? idLocale : enUS;

    const { data, isLoading, refetch } = useAttendanceMatrix({
        courseId,
        classId,
        month: selectedMonth
    });

    const { mutateAsync: updateManual } = useUpdateAttendanceManual();

    // Calculate aggregations
    const aggregateStats = useMemo(() => {
        if (!data) return { present: 0, late: 0, excused: 0, absent: 0, total: 0 };
        return data.rows.reduce((acc, row) => {
            acc.present += row.stats.present;
            acc.late += row.stats.late;
            acc.excused += row.stats.excused;
            acc.absent += row.stats.absent;
            acc.total += row.stats.total;
            return acc;
        }, { present: 0, late: 0, excused: 0, absent: 0, total: 0 });
    }, [data]);

    const classStats = useMemo(() => {
        if (!data) return { averagePercentage: 0, totalSessions: 0 };
        const totalPresentPlusLate = data.rows.reduce((acc, row) => acc + row.stats.present + row.stats.late, 0);
        const totalPossible = data.rows.reduce((acc, row) => acc + row.stats.total, 0);
        const averagePercentage = totalPossible === 0 ? 0 : (totalPresentPlusLate / totalPossible) * 100;
        return {
            averagePercentage,
            totalSessions: data.sessions.length,
        };
    }, [data]);

    // Restore: Auto-switch to latest session month if current is empty
    useEffect(() => {
        if (!courseId) return;

        const fetchLatestSession = async () => {
            const { supabase } = await import('@/integrations/supabase/client');
            let query = supabase
                .from('attendance_sessions')
                .select('session_date')
                .eq('course_id', courseId);

            if (classId) {
                query = query.eq('class_id', classId);
            }

            const { data: latestData } = await query
                .order('session_date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (latestData && latestData.session_date) {
                const latestDate = parseISO(latestData.session_date);
                if (!isSameDay(startOfMonth(new Date()), startOfMonth(latestDate))) {
                    setSelectedMonth(latestDate);
                }
            }
        };

        fetchLatestSession();
    }, [courseId, classId]);

    if (isLoading) {
        return (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="font-medium">{t('common.loading') || 'Loading attendance data...'}</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 bg-white rounded-md border p-1 shadow-sm">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10 transition-colors"
                            onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-[12px] font-bold uppercase tracking-widest text-primary px-2 min-w-[140px] text-center">
                            {format(selectedMonth, 'MMMM yyyy', { locale: currentLocale })}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10 transition-colors"
                            onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/5 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('attendance.status.present')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('attendance.status.late')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('attendance.status.excused')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('attendance.status.absent')}</span>
                    </div>
                </div>
            </div>

            {targetStudentId ? (
                (() => {
                    const targetStudentRow = data.rows.find(r => r.student_id === targetStudentId);
                    if (!targetStudentRow) return null;

                    const stats = targetStudentRow.stats;
                    const effectivePresent = stats.present + stats.late;

                    return (
                        <div className="space-y-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-grow">
                                    <AttendanceCalendar
                                        month={selectedMonth}
                                        sessions={data.sessions}
                                        attendance={targetStudentRow?.attendance || {}}
                                    />
                                </div>

                                <div className="w-full lg:w-[300px] flex flex-col gap-6">
                                    <Card className="border-none shadow-sm h-full">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('attendance.status.present')}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center justify-between cursor-help">
                                                            <div className="text-4xl font-extrabold text-emerald-600">
                                                                {Math.round(stats.percentage)}%
                                                            </div>
                                                            <div className="h-14 w-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center font-bold text-xs">
                                                                {effectivePresent}/{stats.total}
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="p-3 max-w-[250px]">
                                                        <p className="text-sm">
                                                            {t('attendance.statsTooltip', { count: effectivePresent, total: stats.total })}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                                                {t('attendance.historyDesc')}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    );
                })()
            ) : (
                <div className="space-y-6">
                    <AttendanceSummary stats={aggregateStats} />

                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-grow">
                            <AttendanceCalendar
                                mode="teacher"
                                month={selectedMonth}
                                sessions={data.sessions}
                                rows={data.rows}
                                onSessionClick={(sessionId) => navigate(`/teacher/courses/${courseId}/attendance/${sessionId}`)}
                            />
                        </div>

                        <div className="lg:w-80 flex-shrink-0 space-y-4">
                            <Card className="border-none shadow-sm overflow-hidden bg-primary/5">
                                <CardHeader className="pb-3 border-b border-primary/10 bg-white/50">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-primary/10">
                                            <TrendingUp className="w-4 h-4 text-primary" />
                                        </div>
                                        <CardTitle className="text-sm font-bold tracking-tight text-primary uppercase">
                                            {t('attendance.classAttendanceSummary') || 'Class Attendance'}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <div className="relative group cursor-help transition-transform hover:scale-105">
                                                        <div className="w-32 h-32 rounded-full border-8 border-primary/10 flex flex-col items-center justify-center bg-white shadow-inner">
                                                            <span className="text-3xl font-black text-primary">
                                                                {Math.round(classStats.averagePercentage)}%
                                                            </span>
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                                {t('attendance.present') || 'Hadir'}
                                                            </span>
                                                        </div>
                                                        <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent animate-[spin_3s_linear_infinite] opacity-20 pointer-events-none" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-primary text-primary-foreground font-bold text-xs p-2">
                                                    {t('attendance.statsTooltipClass') || 'Total class attendance this month across all students'}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <div className="w-full grid grid-cols-2 gap-2 pt-2">
                                            <div className="bg-white/60 p-3 rounded-xl border border-primary/5 shadow-sm">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                                    {t('attendance.totalSessions') || 'Sessions'}
                                                </p>
                                                <p className="text-xl font-black text-primary">{classStats.totalSessions}</p>
                                            </div>
                                            <div className="bg-white/60 p-3 rounded-xl border border-primary/5 shadow-sm">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                                    {t('attendance.students') || 'Students'}
                                                </p>
                                                <p className="text-xl font-black text-primary">{data.rows.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
