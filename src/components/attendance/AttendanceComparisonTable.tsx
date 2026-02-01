import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isWeekend } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { useAttendanceMatrix, AttendanceStatus } from '@/hooks/useAttendanceMatrix';
import { useUpdateAttendanceManual } from '@/hooks/useAttendanceSessions';
import { toast } from "sonner";
import { Check, X, Clock, FileText, AlertCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";

interface AttendanceComparisonTableProps {
    courseId: string | undefined;
    readOnly?: boolean;
    targetStudentId?: string;
}

export const AttendanceComparisonTable = ({
    courseId,
    readOnly = false,
    targetStudentId
}: AttendanceComparisonTableProps) => {
    const { t, i18n } = useTranslation();
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
    const currentLocale = i18n.language === 'id' ? idLocale : enUS;

    const { data, isLoading, refetch } = useAttendanceMatrix({
        courseId,
        month: selectedMonth
    });

    const { mutateAsync: updateManual } = useUpdateAttendanceManual();

    // Generate all days for the selected month
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(selectedMonth),
        end: endOfMonth(selectedMonth)
    });

    // Restore: Auto-switch to latest session month if current is empty
    useEffect(() => {
        if (!courseId) return;

        const fetchLatestSession = async () => {
            // Dynamic import to avoid top-level dependency issues if any
            const { supabase } = await import('@/integrations/supabase/client');

            const { data, error } = await supabase
                .from('attendance_sessions')
                .select('session_date')
                .eq('course_id', courseId)
                .order('session_date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data && data.session_date) {
                const latestDate = parseISO(data.session_date);
                // If latest session is NOT in current view default (today's month), switch to it.
                // Or better: always switch to latest session month on first load? 
                // Let's stick to "if not in current month" to avoid jumping if user navigates back to today.
                // Actually, on mount we want to show data.

                // Logic: If selectedMonth is default (today) and data is old -> switch.
                // We don't have a "isDefault" flag easily, but check against today.
                if (!isSameDay(startOfMonth(new Date()), startOfMonth(latestDate))) {
                    setSelectedMonth(latestDate);
                }
            }
        };

        fetchLatestSession();
    }, [courseId]);

    const handlePrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

    const handleBulkUpdate = async (sessionId: string, status: string) => {
        if (!data) return;

        const loadingToast = toast.loading("Updating attendance...");
        try {
            const updates = data.rows
                .map(row => {
                    const sessionDate = data.sessions.find(s => s.id === sessionId)?.date;
                    if (!sessionDate) return null;

                    const cellData = row.attendance[sessionDate];
                    // FIX: Pass 'newStatus' instead of 'status'
                    return {
                        recordId: cellData?.record_id,
                        // Note: useUpdateAttendanceManual hook expects 'newStatus', not 'status' in mutationFn arg
                        // But we are calling updateManual which is the mutateAsync function. 
                        // Check useAttendanceSessions.ts: mutationFn takes { recordId, newStatus, notes }
                        newStatus: status as any,
                        notes: cellData?.notes
                    };
                });

            // Filter nulls (though logic above doesn't map to null explicitly unless session is missing, but map returns array of items)
            // Wait, map returns Objects.

            await Promise.all(updates.map(u => {
                if (!u) return Promise.resolve();
                // Pass correctly to mutation
                // The Type of variable might need to match exactly what useMutation expects.
                // If recordId is undefined, the RPC might handle it or we might need to skip?
                // The hook wrapper expects recordId as string.
                // If recordId is missing, this usually means we need to CREATE a record.
                // RPC `update_attendance_manual` might fail if record ID is null?
                // Let's assume for bulk updates we only update existing. 
                // Or if we want to create, we need a different approach.
                // For now, let's proceed with valid recordIds.
                if (!u.recordId) return Promise.resolve();
                return updateManual({
                    recordId: u.recordId,
                    newStatus: u.newStatus,
                    notes: u.notes
                });
            }));

            toast.dismiss(loadingToast);
            toast.success(`Updated students`);
            refetch();
        } catch (error) {
            console.error(error);
            toast.dismiss(loadingToast);
            toast.error("Failed to update records");
        }
    };

    const handleSingleUpdate = async (studentId: string, sessionId: string, recordId: string | undefined, newStatus: string, currentNotes?: string) => {
        const studentName = data?.rows.find(r => r.student_id === studentId)?.student_name || 'Student';

        // If no recordId, we can't update manual? We might need to handle creation.
        // But assuming user clicks on a cell with a session, there might be a record or not.
        // If not, we probably can't use `update_attendance_manual` unless it handles upsert by student_id + session_id?
        // Let's check the hook again? No, hook takes recordId.
        // Limitation: Can only update existing records.
        // Workaround: We need a way to upsert.
        // For now, let's assume records exist or let's try to pass recordId if valid.

        if (!recordId) {
            toast.error("Cannot update: Record not initialized. Ensure session is open.");
            return;
        }

        toast.promise(
            updateManual({
                recordId: recordId,
                newStatus: newStatus, // CORRECT KEY: newStatus
                notes: currentNotes
            }),
            {
                loading: 'Updating...',
                success: `${studentName}: ${newStatus}`,
                error: 'Failed to update'
            }
        );
    };


    const latestSessionRef = useRef<HTMLTableCellElement>(null);

    // Effect: Auto-scroll to the latest session
    useEffect(() => {
        if (latestSessionRef.current) {
            latestSessionRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [data, selectedMonth]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 space-x-2 text-muted-foreground animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading calendar...</span>
            </div>
        );
    }

    if (!data) return null;

    // Identify the latest session date string for scrolling target
    const latestSessionRaw = data.sessions[data.sessions.length - 1];
    const latestSessionDateStr = latestSessionRaw ? (latestSessionRaw.date.includes('T') ? latestSessionRaw.date.split('T')[0] : latestSessionRaw.date) : null;

    return (
        <div className="space-y-4 font-sans">
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 bg-white rounded-md border p-1 shadow-sm">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="px-4 py-1 text-sm font-semibold uppercase tracking-wide text-foreground min-w-[140px] text-center">
                        {format(selectedMonth, 'MMMM yyyy', { locale: currentLocale })}
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                {/* Legend (Compact) */}
                <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>{t('common.present') || 'Present'}</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div>{t('common.absent') || 'Absent'}</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div>{t('common.late') || 'Late'}</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>{t('common.excused') || 'Excused'}</div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden select-none">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max min-w-full">
                        <Table className="border-collapse w-full">
                            <TableHeader>
                                <TableRow className="h-14 border-b border-border/60 bg-muted/5">
                                    {/* Sticky Name Column Header */}
                                    <TableHead className="w-[250px] min-w-[250px] sticky left-0 z-30 bg-background border-r shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]">
                                        <div className="flex flex-col justify-center h-full px-6">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('attendance.studentName') || 'Student Name'}</span>
                                        </div>
                                    </TableHead>

                                    {/* All Days in Month */}
                                    {daysInMonth.map((day) => {
                                        // Robust transformation
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        // Ensure we match purely on string YYYY-MM-DD
                                        const session = data.sessions.find(s => {
                                            // Handle potential timestamp in s.date if any (though types say string)
                                            const sDate = s.date.includes('T') ? s.date.split('T')[0] : s.date;
                                            return sDate === dateStr;
                                        });

                                        const isToday = isSameDay(day, new Date());
                                        const isWeekendDay = isWeekend(day);
                                        const isLatestSession = dateStr === latestSessionDateStr;

                                        return (
                                            <TableHead
                                                key={dateStr}
                                                ref={isLatestSession ? latestSessionRef : null}
                                                className={cn(
                                                    "w-[54px] min-w-[54px] p-0 text-center border-r last:border-0 transition-colors relative group",
                                                    isWeekendDay ? "bg-muted/20" : "",
                                                    session ? "hover:bg-muted/50 cursor-pointer" : "opacity-50"
                                                )}
                                            >
                                                {!readOnly && session ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <div className="flex flex-col items-center justify-center h-full w-full py-1">
                                                                <span className={cn(
                                                                    "text-[10px] font-semibold uppercase leading-none mb-1",
                                                                    isToday ? "text-primary" : "text-muted-foreground"
                                                                )}>
                                                                    {format(day, 'EEE', { locale: currentLocale })}
                                                                </span>
                                                                <span className={cn(
                                                                    "text-sm font-bold leading-none",
                                                                    isToday ? "text-primary" : "text-foreground"
                                                                )}>
                                                                    {format(day, 'dd')}
                                                                </span>
                                                                {/* Dot for session existence */}
                                                                <div className="w-1 h-1 rounded-full bg-primary/40 mt-1" />
                                                            </div>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="center">
                                                            <DropdownMenuLabel>{format(day, 'dd MMMM yyyy', { locale: currentLocale })}</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleBulkUpdate(session.id, 'present')}>
                                                                <Check className="w-3 h-3 mr-2 text-emerald-500" /> {t('attendance.markAllPresent') || 'Mark All Present'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleBulkUpdate(session.id, 'absent')}>
                                                                <X className="w-3 h-3 mr-2 text-rose-500" /> {t('attendance.markAllAbsent') || 'Mark All Absent'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleBulkUpdate(session.id, 'late')}>
                                                                <Clock className="w-3 h-3 mr-2 text-amber-500" /> {t('attendance.markAllLate') || 'Mark All Late'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                ) : (
                                                    <div className={cn(
                                                        "flex flex-col items-center justify-center h-full w-full py-1",
                                                        !session && "opacity-40"
                                                    )}>
                                                        <span className={cn(
                                                            "text-[10px] font-semibold uppercase leading-none mb-1",
                                                            isToday ? "text-primary" : "text-muted-foreground"
                                                        )}>
                                                            {format(day, 'EEE', { locale: currentLocale })}
                                                        </span>
                                                        <span className={cn(
                                                            "text-sm font-bold leading-none",
                                                            isToday ? "text-primary" : "text-foreground text-opacity-80"
                                                        )}>
                                                            {format(day, 'dd')}
                                                        </span>
                                                        {session && <div className="w-1 h-1 rounded-full bg-primary/40 mt-1" />}
                                                    </div>
                                                )}
                                            </TableHead>
                                        );
                                    })}

                                    {/* Summary Header */}
                                    <TableHead className="w-[120px] min-w-[120px] sticky right-0 z-30 bg-background border-l shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.1)] text-center">
                                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Summary</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {data.rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={daysInMonth.length + 2} className="h-32 text-center text-muted-foreground">
                                            No students enrolled.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.rows
                                        // Filter for targetStudentId if provided (Student View)
                                        .filter(row => !targetStudentId || row.student_id === targetStudentId)
                                        .map((row, index) => (
                                            <TableRow
                                                key={row.student_id}
                                                className={cn(
                                                    "h-14 border-b border-border/40 transition-colors bg-background hover:bg-muted/10",
                                                    index % 2 !== 0 ? "bg-muted/[0.03]" : ""
                                                )}
                                            >

                                                {/* Sticky Name Cell */}
                                                <TableCell
                                                    className={cn(
                                                        "sticky left-0 z-20 border-r shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] p-0",
                                                        index % 2 !== 0 ? "bg-muted/[0.03]" : "bg-background"
                                                    )}
                                                >
                                                    <div className="flex items-center h-full px-6 gap-3">
                                                        {/* Avatar Placeholder or Initials */}
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                                                            {row.student_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col justify-center overflow-hidden">
                                                            <div className="font-semibold text-sm text-foreground truncate max-w-[160px]">
                                                                {row.student_name}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground truncate opacity-70">
                                                                {row.student_email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Days Cells */}
                                                {daysInMonth.map((day) => {
                                                    const dateStr = format(day, 'yyyy-MM-dd');
                                                    const session = data.sessions.find(s => s.date === dateStr);

                                                    if (!session) {
                                                        // Empty cell for days with no session
                                                        return (
                                                            <TableCell key={dateStr} className={cn("p-0 border-r border-border/20 last:border-0", isWeekend(day) ? "bg-muted/10 opacity-50" : "bg-muted/5")} />
                                                        );
                                                    }

                                                    // If session exists, render status
                                                    const statusData = row.attendance[dateStr];
                                                    const status = statusData?.status;

                                                    let iconContent;

                                                    if (!status) {
                                                        iconContent = <div className="w-2 h-2 rounded-full bg-slate-200 hover:scale-150 transition-transform cursor-pointer" />;
                                                    } else {
                                                        switch (status) {
                                                            case 'present':
                                                                iconContent = <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform"><Check className="w-5 h-5" strokeWidth={3} /></div>;
                                                                break;
                                                            case 'absent':
                                                                iconContent = <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform"><X className="w-5 h-5" strokeWidth={3} /></div>;
                                                                break;
                                                            case 'late':
                                                                iconContent = <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform font-bold">T</div>;
                                                                break;
                                                            case 'excused':
                                                                iconContent = <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform font-bold">E</div>;
                                                                break;
                                                            case 'sick':
                                                                iconContent = <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform font-bold">S</div>;
                                                                break;
                                                        }
                                                    }

                                                    return (
                                                        <TableCell
                                                            key={`${row.student_id}-${dateStr}`}
                                                            className="p-0 border-r border-border/20 last:border-0 relative"
                                                        >
                                                            {readOnly ? (
                                                                <div className="w-full h-full flex items-center justify-center min-h-[56px]">
                                                                    {iconContent}
                                                                </div>
                                                            ) : (
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <div className="w-full h-full flex items-center justify-center cursor-pointer min-h-[56px] hover:bg-muted/30">
                                                                            {iconContent}
                                                                        </div>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-auto p-2" align="center">
                                                                        <div className="flex gap-2">
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        size="icon"
                                                                                        variant={status === 'present' ? 'default' : 'outline'}
                                                                                        className={cn("w-9 h-9 rounded-full", status === 'present' && "bg-emerald-500 hover:bg-emerald-600 border-none")}
                                                                                        onClick={() => handleSingleUpdate(row.student_id, session.id, statusData?.record_id, 'present', statusData?.notes)}
                                                                                    >
                                                                                        <Check className="w-4 h-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent><p>{t('common.present') || 'Present'}</p></TooltipContent>
                                                                            </Tooltip>

                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        size="icon"
                                                                                        variant={status === 'absent' ? 'default' : 'outline'}
                                                                                        className={cn("w-9 h-9 rounded-full", status === 'absent' && "bg-rose-500 hover:bg-rose-600 border-none")}
                                                                                        onClick={() => handleSingleUpdate(row.student_id, session.id, statusData?.record_id, 'absent', statusData?.notes)}
                                                                                    >
                                                                                        <X className="w-4 h-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent><p>{t('common.absent') || 'Absent'}</p></TooltipContent>
                                                                            </Tooltip>

                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        size="icon"
                                                                                        variant={status === 'late' ? 'default' : 'outline'}
                                                                                        className={cn("w-9 h-9 rounded-full", status === 'late' && "bg-amber-500 hover:bg-amber-600 border-none")}
                                                                                        onClick={() => handleSingleUpdate(row.student_id, session.id, statusData?.record_id, 'late', statusData?.notes)}
                                                                                    >
                                                                                        <Clock className="w-4 h-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent><p>{t('common.late') || 'Late'}</p></TooltipContent>
                                                                            </Tooltip>

                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        size="icon"
                                                                                        variant={status === 'excused' ? 'default' : 'outline'}
                                                                                        className={cn("w-9 h-9 rounded-full", status === 'excused' && "bg-blue-500 hover:bg-blue-600 border-none")}
                                                                                        onClick={() => handleSingleUpdate(row.student_id, session.id, statusData?.record_id, 'excused', statusData?.notes)}
                                                                                    >
                                                                                        <FileText className="w-4 h-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent><p>{t('common.excused') || 'Excused'}</p></TooltipContent>
                                                                            </Tooltip>
                                                                        </div>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}

                                                {/* Summary Cell */}
                                                <TableCell
                                                    className={cn(
                                                        "sticky right-0 z-20 border-l shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.1)] p-0 text-center",
                                                        index % 2 !== 0 ? "bg-muted/[0.03]" : "bg-background"
                                                    )}
                                                >
                                                    <div className="flex flex-col items-center justify-center h-full space-y-1">
                                                        <div className={cn(
                                                            "text-sm font-bold",
                                                            row.stats.percentage >= 80 ? "text-emerald-600" :
                                                                row.stats.percentage >= 60 ? "text-amber-600" : "text-rose-600"
                                                        )}>
                                                            {Math.round(row.stats.percentage)}%
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full">
                                                            {row.stats.present}/{row.stats.total}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <ScrollBar orientation="horizontal" className="h-2.5" />
                </ScrollArea>
            </div>
        </div>
    );
};
