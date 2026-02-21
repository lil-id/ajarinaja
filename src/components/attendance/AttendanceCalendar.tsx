import { useTranslation } from 'react-i18next';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, startOfWeek, endOfWeek } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { Check, X, Clock, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendanceStatus } from '@/hooks/useAttendanceMatrix';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface AttendanceCalendarProps {
    month: Date;
    attendance?: Record<string, AttendanceStatus>;
    sessions: Array<{
        id: string;
        date: string;
        topic?: string;
        status: string;
    }>;
    mode?: 'student' | 'teacher';
    rows?: any[]; // For teacher mode to calculate class stats
    onSessionClick?: (sessionId: string) => void;
}

export const AttendanceCalendar = ({
    month,
    attendance = {},
    sessions,
    mode = 'student',
    rows = [],
    onSessionClick
}: AttendanceCalendarProps) => {
    const { t, i18n } = useTranslation();
    const currentLocale = i18n.language === 'id' ? idLocale : enUS;

    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present':
                return <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm"><Check className="w-5 h-5" strokeWidth={3} /></div>;
            case 'absent':
                return <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm"><X className="w-5 h-5" strokeWidth={3} /></div>;
            case 'late':
                return <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm font-bold text-sm">T</div>;
            case 'excused':
                return <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm font-bold text-sm">E</div>;
            case 'sick':
                return <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-sm font-bold text-sm">S</div>;
            default:
                return <div className="w-2 h-2 rounded-full bg-slate-200" />;
        }
    };

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* Week Headers */}
            <div className="grid grid-cols-7 border-b bg-muted/30">
                {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day) => (
                    <div key={day} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {t(`calendar.weekdays.${day}`)}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {days.map((day, idx) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isOutsideMonth = !isSameDay(startOfMonth(day), startOfMonth(month));
                    const session = sessions.find(s => s.date === dateStr);
                    const statusData = attendance[dateStr];
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div
                            key={dateStr}
                            className={cn(
                                "min-h-[100px] border-r border-b p-2 transition-colors relative",
                                isOutsideMonth ? "bg-slate-50/50" : "bg-white",
                                isToday && "bg-primary/[0.02]",
                                idx % 7 === 6 && "border-r-0",
                                mode === 'teacher' && session && "cursor-pointer hover:bg-muted/30"
                            )}
                            onClick={() => mode === 'teacher' && session && onSessionClick?.(session.id)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                    "text-sm font-medium",
                                    isOutsideMonth ? "text-muted-foreground/40" : "text-foreground",
                                    isToday && "text-primary font-bold"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {isToday && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase transition-all animate-pulse">
                                        {t('calendar.today')}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col items-center justify-center pt-1">
                                {session ? (
                                    mode === 'teacher' ? (() => {
                                        // Calculate class statistics for this specific session date
                                        const dateRecords = rows.map(r => r.attendance[dateStr]).filter(Boolean);
                                        const presentCount = dateRecords.filter(r => r.status === 'present' || r.status === 'late').length;
                                        const totalStudents = rows.length;
                                        const percentage = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

                                        return (
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-[10px] shadow-sm transition-transform hover:scale-110",
                                                    percentage >= 80 ? "border-emerald-500/20 border-t-emerald-500 text-emerald-600" :
                                                        percentage >= 60 ? "border-amber-500/20 border-t-amber-500 text-amber-600" :
                                                            "border-rose-500/20 border-t-rose-500 text-rose-600"
                                                )}>
                                                    {Math.round(percentage)}%
                                                </div>
                                                <span className="text-[9px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                                                    {presentCount}/{totalStudents}
                                                </span>
                                            </div>
                                        );
                                    })() : (
                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <div className="cursor-help">
                                                        {getStatusIcon(statusData?.status || 'none')}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="p-3 max-w-[200px] space-y-2">
                                                    <div className="font-bold flex items-center gap-2 border-b pb-1 mb-1">
                                                        <Clock className="w-3.5 h-3.5 text-primary" />
                                                        {format(day, 'd MMMM yyyy', { locale: currentLocale })}
                                                    </div>
                                                    {session.topic && (
                                                        <div>
                                                            <span className="text-[10px] uppercase text-muted-foreground block mb-0.5">{t('attendance.session')}</span>
                                                            <p className="text-sm font-medium leading-tight">{session.topic}</p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-[10px] uppercase text-muted-foreground block mb-0.5">{t('attendance.checkInStatus')}</span>
                                                        <div className="flex items-center gap-1.5 font-bold">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                statusData?.status === 'present' ? 'bg-emerald-500' :
                                                                    statusData?.status === 'absent' ? 'bg-rose-500' :
                                                                        statusData?.status === 'late' ? 'bg-amber-500' :
                                                                            statusData?.status === 'excused' ? 'bg-blue-500' :
                                                                                statusData?.status === 'sick' ? 'bg-purple-500' : 'bg-slate-300'
                                                            )} />
                                                            {statusData?.status ? t(`attendance.status.${statusData.status}`) : t('attendance.status.pending')}
                                                        </div>
                                                    </div>
                                                    {statusData?.notes && (
                                                        <div className="bg-muted p-2 rounded text-xs italic text-muted-foreground border-l-2 border-primary/20">
                                                            "{statusData.notes}"
                                                        </div>
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )) : (
                                    <div className="h-8" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
