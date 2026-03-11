import { useMemo, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTeacherSchedules } from '@/hooks/useTeacherSchedules';
import { Calendar as CalendarIcon, MapPin, BookOpen, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DAY_LABELS } from '@/hooks/useSchedules';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Constants for timetable rendering
const HOUR_HEIGHT = 80; // pixels per hour
const START_HOUR = 7; // 07:00
const END_HOUR = 17; // 17:00 (10 hours total span)
const HOURS_SPAN = END_HOUR - START_HOUR;

export default function TeacherSchedules() {
    const { t } = useTranslation();
    const { data: schedules = [], isLoading } = useTeacherSchedules();

    const currentDayJs = new Date().getDay();
    const currentDayDb = currentDayJs === 0 ? 7 : currentDayJs;

    // Helper functions for time calculations
    const timeToMinutes = (timeStr: string) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const calculatePosition = (startTime: string, endTime: string) => {
        const startMins = timeToMinutes(startTime);
        const endMins = timeToMinutes(endTime);
        const gridStartMins = START_HOUR * 60;

        // Boundaries safety
        const boundedStart = Math.max(gridStartMins, startMins);
        const boundedEnd = Math.min(END_HOUR * 60, endMins);

        const top = ((boundedStart - gridStartMins) / 60) * HOUR_HEIGHT;
        const height = ((boundedEnd - boundedStart) / 60) * HOUR_HEIGHT;

        return { top, height };
    };

    // Which days to show: Always Mon-Fri (1-5), plus Sat/Sun if there are schedules
    const activeDays = useMemo(() => {
        const days = [1, 2, 3, 4, 5];
        if (schedules.some(s => s.day_of_week === 6) && !days.includes(6)) days.push(6);
        if (schedules.some(s => s.day_of_week === 7) && !days.includes(7)) days.push(7);
        return days;
    }, [schedules]);

    const getSchedulesForDay = (day: number) => {
        return schedules.filter(s => s.day_of_week === day);
    };

    // Auto-scroll to current time line on mount
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [currentTimePosition, setCurrentTimePosition] = useState(-1);

    useEffect(() => {
        const updateCurrentTime = () => {
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            const gridStartMins = START_HOUR * 60;
            const gridEndMins = END_HOUR * 60;

            if (currentMins >= gridStartMins && currentMins <= gridEndMins) {
                const pos = ((currentMins - gridStartMins) / 60) * HOUR_HEIGHT;
                setCurrentTimePosition(pos);
            } else {
                setCurrentTimePosition(-1);
            }
        };

        updateCurrentTime();
        const interval = setInterval(updateCurrentTime, 60000); // UI update every minute

        // Initial scroll to center the current time
        setTimeout(() => {
            if (scrollContainerRef.current) {
                const now = new Date();
                const pos = ((now.getHours() - START_HOUR) * HOUR_HEIGHT) - 100; // -100px for padding
                if (pos > 0) {
                    scrollContainerRef.current.scrollTo({ top: pos, behavior: 'smooth' });
                }
            }
        }, 300);

        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('schedules.title', 'Jadwal Mengajar')}</h1>
                    <p className="text-muted-foreground mt-1 text-lg">{t('schedules.description', 'Jadwal mengajar mingguan Anda.')}</p>
                </div>
                <Skeleton className="h-[600px] w-full rounded-xl" />
            </div>
        );
    }

    if (schedules.length === 0) {
        return (
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('schedules.title', 'Jadwal Mengajar')}</h1>
                    <p className="text-muted-foreground mt-1 text-lg">{t('schedules.description', 'Jadwal mengajar mingguan Anda.')}</p>
                </div>
                <div className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden rounded-xl">
                    <div className="flex flex-col items-center justify-center py-20 text-center relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm ring-1 ring-primary/20">
                            <CalendarIcon className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">{t('schedules.noData', 'Tidak ada data')}</h2>
                        <p className="text-muted-foreground max-w-md text-base leading-relaxed">
                            {t('schedules.noSchedulesRegistered', 'Anda belum memiliki jadwal mengajar yang didaftarkan oleh operator akademik untuk periode ini.')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Generate hour labels (e.g., 07:00, 08:00)
    const hoursList = Array.from({ length: HOURS_SPAN + 1 }, (_, i) => START_HOUR + i);

    return (
        <TooltipProvider delayDuration={200}>
            <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto overflow-x-hidden pb-10">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('schedules.title', 'Jadwal Mengajar')}</h1>
                    <p className="text-muted-foreground mt-1 text-lg">{t('schedules.description', 'Jadwal mengajar mingguan Anda.')}</p>
                </div>

                <div className="rounded-xl border border-border/60 shadow-sm bg-card overflow-hidden flex flex-col h-[70vh] min-h-[600px]">
                    {/* Header Row (Days) */}
                    <div className="flex bg-muted/30 border-b border-border/50 sticky top-0 z-20 shadow-sm">
                        {/* Empty corner cell */}
                        <div className="w-16 sm:w-20 shrink-0 border-r border-border/50 bg-muted/40 backdrop-blur-md"></div>

                        {/* Day headers */}
                        <div className="flex flex-1 overflow-x-hidden">
                            {activeDays.map(day => {
                                const isToday = currentDayDb === day;
                                return (
                                    <div
                                        key={`header-${day}`}
                                        className={`flex-1 min-w-[140px] px-3 py-4 text-center border-r border-border/50 last:border-r-0 relative transition-colors ${isToday ? 'bg-primary/[0.03]' : ''
                                            }`}
                                    >
                                        {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />}
                                        <div className="font-semibold text-sm sm:text-base flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                                            <span className={isToday ? 'text-primary' : 'text-foreground'}>
                                                {t(DAY_LABELS[day as keyof typeof DAY_LABELS])}
                                            </span>
                                            {isToday && (
                                                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary hover:bg-primary/30 border-none uppercase tracking-wider hidden sm:flex">
                                                    {t('schedules.today', 'Hari Ini')}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Scrollable Timetable Body */}
                    <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">
                        {/* Current Time Indicator Line */}
                        {currentTimePosition >= 0 && (
                            <div
                                className="absolute left-16 sm:left-20 right-0 h-[2px] bg-red-500 z-10 pointer-events-none flex items-center"
                                style={{ top: `${currentTimePosition}px` }}
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
                            </div>
                        )}

                        <div className="flex min-w-max md:min-w-0" style={{ height: `${HOURS_SPAN * HOUR_HEIGHT}px` }}>
                            {/* Y-Axis: Time Labels */}
                            <div className="w-16 sm:w-20 shrink-0 border-r border-border/50 bg-background/95 sticky left-0 z-10">
                                {hoursList.map(hour => (
                                    <div
                                        key={`time-${hour}`}
                                        className="relative border-b border-border/20 last:border-0"
                                        style={{ height: `${HOUR_HEIGHT}px` }}
                                    >
                                        <span className="absolute -top-3 left-0 right-3 text-right text-xs font-medium text-muted-foreground bg-background/80 px-1 rounded">
                                            {hour.toString().padStart(2, '0')}:00
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* X-Axis: Schedule Grid per Day */}
                            <div className="flex flex-1 relative bg-stripe-pattern">
                                {/* Horizontal grid lines spanning all days behind the cards */}
                                <div className="absolute inset-0 pointer-events-none flex flex-col">
                                    {hoursList.map(hour => (
                                        <div
                                            key={`gridline-${hour}`}
                                            className="w-full border-b border-border/20"
                                            style={{ height: `${HOUR_HEIGHT}px` }}
                                        />
                                    ))}
                                </div>

                                {activeDays.map(day => {
                                    const daySchedules = getSchedulesForDay(day);
                                    const isToday = currentDayDb === day;

                                    return (
                                        <div
                                            key={`col-${day}`}
                                            className={`flex-1 min-w-[140px] border-r border-border/30 last:border-r-0 relative ${isToday ? 'bg-primary/[0.015]' : ''
                                                }`}
                                        >
                                            {daySchedules.map(schedule => {
                                                const { top, height } = calculatePosition(schedule.start_time, schedule.end_time);

                                                // Identify if this specific logic is currently ongoing
                                                const now = new Date();
                                                const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                                                const isOngoingClass = isToday && currentTimeStr >= schedule.start_time && currentTimeStr <= schedule.end_time;
                                                const isPastClass = isToday && currentTimeStr > schedule.end_time;

                                                const courseTitle = schedule.course?.title || t('schedules.course', 'Unknown Course');
                                                const className = schedule.class?.name || t('schedules.class', 'Unknown Class');
                                                const timeText = `${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)}`;
                                                const roomName = schedule.room || '-';

                                                return (
                                                    <Tooltip key={schedule.id}>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className="absolute left-1 right-1 sm:left-2 sm:right-2 rounded-lg border overflow-hidden p-2 sm:p-3 transition-all cursor-pointer hover:shadow-md hover:ring-2 hover:ring-primary/40 hover:z-10 bg-background"
                                                                style={{
                                                                    top: `${top}px`,
                                                                    height: `${height - 2}px`, // -2px for margin
                                                                    borderColor: isOngoingClass ? 'var(--primary)' : 'var(--border)'
                                                                }}
                                                            >
                                                                {/* Left colored bar */}
                                                                <div className={`absolute top-0 bottom-0 left-0 w-1 sm:w-1.5 ${isOngoingClass ? 'bg-primary' : isPastClass ? 'bg-muted-foreground/30' : 'bg-primary/50'}`}></div>

                                                                {/* Content container - clipped nicely if height is too small */}
                                                                <div className={`h-full flex flex-col ml-1 sm:ml-2 overflow-hidden ${isPastClass ? 'opacity-60' : ''}`}>
                                                                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 shrink-0 mb-0.5">
                                                                        <Clock className="w-3 h-3" />
                                                                        {timeText}
                                                                    </span>

                                                                    <span className={`text-xs sm:text-sm font-bold leading-tight line-clamp-2 ${isOngoingClass ? 'text-primary' : 'text-foreground'}`}>
                                                                        {courseTitle}
                                                                    </span>

                                                                    {/* Only show these if there's enough height (> 60px) */}
                                                                    {height > 60 && (
                                                                        <div className="mt-auto pt-1 flex flex-col gap-0.5">
                                                                            <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 truncate">
                                                                                <BookOpen className="w-3 h-3 shrink-0" />
                                                                                <span className="truncate">{className}</span>
                                                                            </span>
                                                                            <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 truncate">
                                                                                <MapPin className="w-3 h-3 shrink-0" />
                                                                                <span className="truncate">{roomName}</span>
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="p-4 max-w-[250px] space-y-3 z-50">
                                                            <div>
                                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 w-fit px-2 py-1 rounded-md mb-2">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {timeText}
                                                                </div>
                                                                <div className="font-bold text-base leading-snug">{courseTitle}</div>
                                                            </div>
                                                            <div className="space-y-1.5 pt-2 border-t border-border/50">
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <BookOpen className="w-4 h-4 text-foreground/50" />
                                                                    {className}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <MapPin className="w-4 h-4 text-foreground/50" />
                                                                    Ruangan: {roomName}
                                                                </div>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
