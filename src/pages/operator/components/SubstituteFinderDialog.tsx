import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAvailableTeachers } from '@/hooks/useAvailableTeachers';
import { useUpdateSchedule } from '@/hooks/useSchedules';
import { Loader2, Search, CalendarClock, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScheduleBlock {
    id: string;
    class_id: string;
    subject_id: string;
    teacher_id: string;
    day_of_week: string;
    day_of_week_num: number;
    start_time: string;
    end_time: string;
    subject_name?: string;
    teacher_name?: string;
    className?: string; // e.g X-1
}

interface SubstituteFinderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    schedule: ScheduleBlock | null;
}

export function SubstituteFinderDialog({ open, onOpenChange, schedule }: SubstituteFinderDialogProps) {
    const { t } = useTranslation();
    const updateSchedule = useUpdateSchedule();

    const [isSearching, setIsSearching] = useState(false);

    // Fetch available teachers only when the user explicitly clicks "Find Substitute"
    const { data: availableTeachers, isLoading, isError, error } = useAvailableTeachers({
        dayOfWeek: schedule?.day_of_week_num || 0,
        startTime: schedule?.start_time || '',
        endTime: schedule?.end_time || '',
        subjectId: schedule?.subject_id,
        enabled: isSearching && !!schedule
    });

    const handleFindSubstituteClick = () => {
        setIsSearching(true);
    };

    const handleAssignSubstitute = async (substituteId: string, substituteName: string) => {
        if (!schedule) return;

        try {
            await updateSchedule.mutateAsync({
                id: schedule.id,
                updates: { teacher_id: substituteId }
            });
            toast.success(t('operator.calendar.dialog.assignSuccess', { substitute: substituteName, teacher: schedule.teacher_name || '' }));
            onOpenChange(false);
            setIsSearching(false);
        } catch (err: unknown) {
            toast.error(t('operator.calendar.dialog.assignError'), {
                description: err instanceof Error ? err.message : String(err)
            });
        }
    };

    // Reset search state when dialog closes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) setIsSearching(false);
        onOpenChange(newOpen);
    };

    if (!schedule) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CalendarClock className="w-5 h-5 text-primary" />
                        {t('operator.calendar.dialog.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('operator.calendar.dialog.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {/* Current Schedule Summary */}
                    <div className="bg-muted p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg">{schedule.subject_name || t('operator.calendar.dialog.subject')}</h3>
                                <p className="text-muted-foreground text-sm">{t('operator.calendar.dialog.className')} {schedule.className}</p>
                            </div>
                            <Badge variant="outline" className="capitalize text-sm bg-background">
                                {schedule.day_of_week}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm bg-background p-3 rounded-lg border">
                            <div className="flex-1">
                                <span className="text-muted-foreground block mb-1">{t('operator.calendar.dialog.currentTeacher')}</span>
                                <div className="flex items-center gap-2 font-medium">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-[10px]">{schedule.teacher_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {schedule.teacher_name}
                                </div>
                            </div>
                            <div className="w-px h-8 bg-border"></div>
                            <div className="flex-1">
                                <span className="text-muted-foreground block mb-1">{t('operator.calendar.dialog.time')}</span>
                                <div className="font-medium">
                                    {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Find Substitute Section */}
                    {!isSearching ? (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl text-center space-y-4">
                            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                                <UserX className="w-6 h-6 text-destructive" />
                            </div>
                            <div>
                                <h4 className="font-semibold">{t('operator.calendar.dialog.teacherAbsent', { teacher: schedule.teacher_name })}</h4>
                                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                    {t('operator.calendar.dialog.findSubstituteDescription')}
                                </p>
                            </div>
                            <Button onClick={handleFindSubstituteClick} className="gap-2">
                                <Search className="w-4 h-4" /> {t('operator.calendar.dialog.findSubstituteBtn')}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <h4 className="font-semibold flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-primary" />
                                {t('operator.calendar.dialog.availableTeachers')}
                            </h4>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                                    <p>{t('operator.calendar.dialog.searching')}</p>
                                </div>
                            ) : isError ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="w-4 h-4" />
                                    <AlertDescription>
                                        {t('operator.calendar.dialog.errorFetching')}
                                        {typeof error === 'object' && error !== null && 'message' in error
                                            ? (error as any).message
                                            : String(error)}
                                    </AlertDescription>
                                </Alert>
                            ) : availableTeachers && availableTeachers.length > 0 ? (
                                <ScrollArea className="h-[300px] border rounded-lg p-4">
                                    <div className="space-y-3">
                                        {availableTeachers.map((teacher, idx) => (
                                            <div
                                                key={teacher.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${teacher.is_same_subject
                                                    ? 'bg-primary/5 border-primary/20'
                                                    : 'bg-background hover:bg-muted'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-muted-foreground w-4 text-xs font-mono">{idx + 1}.</div>
                                                    <Avatar>
                                                        <AvatarImage src={teacher.avatar_url || ''} />
                                                        <AvatarFallback>{teacher.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{teacher.name}</p>
                                                        {teacher.is_same_subject && (
                                                            <Badge variant="secondary" className="mt-1 text-[10px] bg-primary/10 text-primary hover:bg-primary/20">
                                                                {t('operator.calendar.dialog.taughtSubject')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={teacher.is_same_subject ? "default" : "outline"}
                                                    onClick={() => handleAssignSubstitute(teacher.id, teacher.name)}
                                                    disabled={updateSchedule.isPending}
                                                >
                                                    {t('operator.calendar.dialog.assignBtn')}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="text-center p-8 bg-muted rounded-lg">
                                    <p className="font-medium text-foreground">{t('operator.calendar.dialog.noTeachersAvailable')}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{t('operator.calendar.dialog.allBusy')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4 pt-4 border-t">
                    <Button variant="ghost" onClick={() => handleOpenChange(false)}>{t('operator.calendar.dialog.closeBtn')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
