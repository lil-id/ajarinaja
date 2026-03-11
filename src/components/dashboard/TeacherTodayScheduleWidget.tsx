import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin, BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTeacherSchedules } from '@/hooks/useTeacherSchedules';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function TeacherTodayScheduleWidget() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: schedules = [], isLoading } = useTeacherSchedules();

    // JS Date.getDay() returns 0 (Sun) to 6 (Sat)
    // Our DB uses 1 (Mon) to 7 (Sun)
    const currentDayJs = new Date().getDay();
    const currentDayDb = currentDayJs === 0 ? 7 : currentDayJs;

    const todaySchedules = schedules.filter(s => s.day_of_week === currentDayDb);

    if (isLoading) {
        return (
            <Card className="border-0 shadow-card">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        {t('dashboard.todaysSchedule', 'Jadwal Hari Ini')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="w-16 h-12 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="w-3/4 h-4" />
                                <Skeleton className="w-1/2 h-3" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-card flex flex-col h-full bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        <Clock className="w-4 h-4" />
                    </div>
                    {t('dashboard.todaysSchedule', 'Jadwal Hari Ini')}
                </CardTitle>
                <Badge variant="outline" className="font-normal text-xs bg-background">
                    {todaySchedules.length} {t('common.classes', 'Kelas')}
                </Badge>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto min-h-[200px]">
                {todaySchedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                            <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            {t('dashboard.noSchedulesToday', 'Tidak ada jadwal mengajar hari ini.')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                            {t('dashboard.enjoyYourDay', 'Selamat beristirahat atau menyiapkan materi untuk pertemuan berikutnya.')}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => navigate('/teacher/schedules')}
                        >
                            {t('dashboard.viewWeeklySchedule', 'Lihat Jadwal Mingguan')}
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {todaySchedules.map((schedule) => {
                            // Determine if this class is currently ongoing
                            const now = new Date();
                            const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                            const isOngoing = currentTimeStr >= schedule.start_time && currentTimeStr <= schedule.end_time;

                            return (
                                <div
                                    key={schedule.id}
                                    className={`p-4 transition-colors hover:bg-muted/50 ${isOngoing ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                                >
                                    <div className="flex gap-4">
                                        {/* Time Block */}
                                        <div className="flex flex-col items-center justify-center min-w-[64px] rounded-lg bg-background border shadow-sm p-2 text-center">
                                            <span className="text-xs font-semibold text-foreground">
                                                {schedule.start_time.substring(0, 5)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground mt-0.5">
                                                {schedule.end_time.substring(0, 5)}
                                            </span>
                                        </div>

                                        {/* Class Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h4 className="text-sm font-semibold truncate text-foreground flex items-center gap-1.5">
                                                    {schedule.course?.title || 'Unknown Course'}
                                                    {isOngoing && (
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                        </span>
                                                    )}
                                                </h4>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {schedule.class?.name || 'Unknown Class'} (Kls {schedule.class?.grade_level})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate">{schedule.room || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="flex flex-col justify-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                onClick={() => navigate(`/teacher/courses/${schedule.course_id}`)}
                                                title="Ke Halaman Kelas"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {isOngoing && (
                                        <div className="mt-3 pl-20">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="w-full text-xs h-7 shadow-sm"
                                                onClick={() => navigate('/teacher/attendance')}
                                            >
                                                Mulai Sesi Absensi
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
            {todaySchedules.length > 0 && (
                <div className="p-3 border-t border-border/50 bg-muted/20">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => navigate('/teacher/schedules')}
                    >
                        {t('dashboard.viewAllSchedules', 'Lihat Jadwal Lengkap Mingguan')}
                    </Button>
                </div>
            )}
        </Card>
    );
}
