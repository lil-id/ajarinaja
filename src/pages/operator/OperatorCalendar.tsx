import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, Loader2, Users, SearchX, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchedules } from '@/hooks/useSchedules';
import { useRoleUsers } from '@/hooks/useRoleUsers';
import { SubstituteFinderDialog } from './components/SubstituteFinderDialog';
import { cn } from '@/lib/utils';
import { ClassSchedule, DAY_LABELS } from '@/hooks/useSchedules';

interface ScheduleBlock {
    id: string;
    class_id: string;
    subject_id: string;
    teacher_id: string | null;
    day_of_week: string;
    day_of_week_num: number;
    start_time: string;
    end_time: string;
    subject_name?: string;
    teacher_name?: string;
    className?: string;
}

export default function OperatorCalendar() {
    const { t } = useTranslation();
    const { schedules = [], isLoading: schedulesLoading } = useSchedules();
    const { data: teachers = [], isLoading: teachersLoading } = useRoleUsers('teacher');

    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleBlock | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const isLoading = schedulesLoading || teachersLoading;

    // We render a standard work week view (Monday to Friday, or Monday to Saturday)
    // For simplicity in a schedule context, we just map days 1 to 6
    const workDays = [1, 2, 3, 4, 5, 6];

    // Filter schedules by teacher if one is selected
    const filteredSchedules = useMemo(() => {
        if (selectedTeacherId === 'all') return schedules;
        if (selectedTeacherId === 'unassigned') return schedules.filter(s => !s.teacher_id);
        return schedules.filter(s => s.teacher_id === selectedTeacherId);
    }, [schedules, selectedTeacherId]);

    // Group schedules by day
    const schedulesByDay = useMemo(() => {
        const grouped: Record<number, ClassSchedule[]> = {};
        workDays.forEach(day => grouped[day] = []);

        filteredSchedules.forEach(schedule => {
            if (grouped[schedule.day_of_week]) {
                grouped[schedule.day_of_week].push(schedule);
            }
        });

        // Sort schedules within each day by start time
        Object.keys(grouped).forEach(key => {
            const dayNum = parseInt(key);
            grouped[dayNum].sort((a, b) => a.start_time.localeCompare(b.start_time));
        });

        return grouped;
    }, [filteredSchedules]);

    const handleScheduleClick = (schedule: ClassSchedule) => {
        // Transform the data slightly for the dialog's expected props
        setSelectedSchedule({
            id: schedule.id,
            class_id: schedule.class_id,
            subject_id: schedule.course_id, // assuming course acts as subject
            teacher_id: schedule.teacher_id,
            day_of_week: DAY_LABELS[schedule.day_of_week],
            day_of_week_num: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            subject_name: schedule.course?.title,
            teacher_name: schedule.teacher?.name || 'Belum Ditugaskan',
            className: schedule.class?.name || 'Unknown Class'
        });
        setIsDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                <p>{t('operator.calendar.loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-primary" />
                        {t('operator.calendar.title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('operator.calendar.description')}
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:inline-block">Filter Jadwal:</span>
                    <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                        <SelectTrigger className="w-[220px] bg-background">
                            <SelectValue placeholder="Semua Guru" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Guru</SelectItem>
                            <SelectItem value="unassigned" className="text-destructive font-medium">Jadwal Kosong (Tanpa Guru)</SelectItem>
                            {teachers.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex justify-between items-center">
                        <span>{t('operator.calendar.weeklySchedule')}</span>
                        {selectedTeacherId !== 'all' && selectedTeacherId !== 'unassigned' && (
                            <Badge variant="secondary" className="font-normal text-xs">
                                {t('operator.calendar.teacherAvailability')}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredSchedules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3 bg-muted/30 rounded-lg border border-dashed">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                <SearchX className="w-6 h-6" />
                            </div>
                            <p>{t('operator.calendar.noScheduleFound')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {workDays.map(dayNum => (
                                <div key={dayNum} className="space-y-3">
                                    <div className="font-semibold text-center pb-2 mb-2 border-b text-sm text-muted-foreground uppercase tracking-wider">
                                        {DAY_LABELS[dayNum]}
                                    </div>
                                    <div className="space-y-3">
                                        {schedulesByDay[dayNum].length === 0 ? (
                                            <div className="text-center p-3 text-xs text-muted-foreground/50 border border-dashed rounded-lg bg-muted/10 h-24 flex items-center justify-center">
                                                {t('operator.calendar.noClass')}
                                            </div>
                                        ) : (
                                            schedulesByDay[dayNum].map(schedule => (
                                                <div
                                                    key={schedule.id}
                                                    onClick={() => handleScheduleClick(schedule)}
                                                    className={cn(
                                                        "p-3 rounded-lg border text-sm transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden group",
                                                        !schedule.teacher_id
                                                            ? "bg-destructive/10 border-destructive/30 hover:border-destructive"
                                                            : "bg-background hover:border-primary/50"
                                                    )}
                                                >
                                                    {!schedule.teacher_id && (
                                                        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-end bg-gradient-to-bl from-destructive/20 to-transparent p-1">
                                                            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <span className="font-semibold truncate pr-2" title={schedule.course?.title}>
                                                            {schedule.course?.title || 'Mapel'}
                                                        </span>
                                                        <Badge variant="outline" className="text-[10px] bg-muted/50 px-1 border-primary/20 whitespace-nowrap">
                                                            {schedule.class?.name}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center text-xs text-muted-foreground mb-2 gap-1.5">
                                                        <Clock className="w-3 h-3" />
                                                        {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                                        {schedule.teacher_id ? (
                                                            <>
                                                                <Avatar className="w-5 h-5">
                                                                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                                                        {schedule.teacher?.name?.charAt(0)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-xs truncate text-muted-foreground group-hover:text-foreground transition-colors">
                                                                    {schedule.teacher?.name}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs font-semibold text-destructive flex items-center gap-1.5 w-full">
                                                                {t('operator.calendar.needsSubstitute')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <SubstituteFinderDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                schedule={selectedSchedule}
            />
        </div>
    );
}
