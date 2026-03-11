import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useExams } from '@/hooks/useExams';
import { useAssignments } from '@/hooks/useAssignments';
import { useEffectiveCourseIds } from '@/hooks/useEffectiveCourseIds';
import { useAllAssignmentSubmissions } from '@/hooks/useProgress';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, isAfter, startOfDay, addDays, isPast } from 'date-fns';
import { Calendar as CalendarIcon, ChevronRight, FileText, ClipboardList, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCourses } from '@/hooks/useCourses';

interface DashboardEvent {
    id: string;
    title: string;
    date: Date;
    type: 'exam' | 'assignment';
    courseName: string;
    courseId: string;
    status?: string;
    isSubmitted?: boolean;
    isPastDue?: boolean;
}

export function StudentCalendarWidget() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [date, setDate] = useState<Date | undefined>(new Date());

    // Fetch data
    const { effectiveCourseIds: enrolledCourseIds, enrolledClassIds, isLoading: enrollmentsLoading } = useEffectiveCourseIds();
    const { courses, isLoading: coursesLoading } = useCourses();
    const { exams, isLoading: examsLoading } = useExams();
    const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
    const { data: submittedAssignmentIds = [], isLoading: subLoading } = useAllAssignmentSubmissions();

    const isLoading = enrollmentsLoading || coursesLoading || examsLoading || assignmentsLoading || subLoading;

    // Process data into events
    const events = useMemo(() => {
        if (isLoading) return [];

        // Create course lookup map
        const courseMap = new Map(courses.map(c => [c.id, c.title]));

        const allEvents: DashboardEvent[] = [];

        /**
         * Determines whether a given exam or assignment should be visible to this student.
         * - Class-targeted: ONLY show to students in that specific class
         * - Global (no class_id): show to anyone enrolled in the course
         */
        const isEventVisible = (event: { course_id: string; class_id?: string | null }) => {
            if (event.class_id) {
                return enrolledClassIds.includes(event.class_id);
            }
            return enrolledCourseIds.includes(event.course_id);
        };

        // Filter and map exams
        exams
            .filter(e => isEventVisible(e) && e.status === 'published')
            .forEach(exam => {
                // Add end date event if exists (Deadline)
                if (exam.end_date) {
                    const endDate = new Date(exam.end_date);
                    allEvents.push({
                        id: exam.id,
                        title: `${exam.title}`,
                        date: endDate,
                        type: 'exam',
                        courseName: courseMap.get(exam.course_id) || (t('courses.unknownCourse') as string),
                        courseId: exam.course_id,
                        isPastDue: isPast(endDate)
                    });
                }
            });

        // Filter and map assignments
        assignments
            .filter(a => isEventVisible(a) && a.status === 'published')
            .forEach(assignment => {
                if (assignment.due_date) {
                    const dueDate = new Date(assignment.due_date);
                    const isSubmitted = submittedAssignmentIds.includes(assignment.id);

                    allEvents.push({
                        id: assignment.id,
                        title: assignment.title,
                        date: dueDate,
                        type: 'assignment',
                        courseName: courseMap.get(assignment.course_id) || (t('courses.unknownCourse') as string),
                        courseId: assignment.course_id,
                        isSubmitted: isSubmitted,
                        isPastDue: !isSubmitted && isPast(dueDate)
                    });
                }
            });

        // Sort by date ascending
        return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [exams, assignments, courses, enrolledCourseIds, enrolledClassIds, submittedAssignmentIds, isLoading, t]);

    // Modifiers for the calendar (highlight days with events)
    const eventDays = useMemo(() => events.map(e => e.date), [events]);

    // Get upcoming events (from today onwards)
    const upcomingEvents = useMemo(() => {
        const today = startOfDay(new Date());
        return events
            .filter(e => (isAfter(e.date, today) || isSameDay(e.date, today)) && !e.isSubmitted)
            .slice(0, 5);
    }, [events]);

    // Get selected date events
    const selectedDateEvents = useMemo(() => {
        if (!date) return [];
        return events.filter(e => isSameDay(e.date, date));
    }, [date, events]);

    if (isLoading) {
        return (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    return (
        <Card className="flex flex-col h-full border-0 shadow-card">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            {t('calendar.title')}
                        </CardTitle>
                        <CardDescription>{t('dashboard.upcomingDeadlines')}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-primary" onClick={() => navigate('/student/calendar')}>
                        {t('common.viewAll')} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col md:flex-row gap-6">
                {/* Calendar View */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border p-3 pointer-events-auto"
                        modifiers={{
                            event: eventDays
                        }}
                        modifiersClassNames={{
                            event: "bg-primary/10 font-bold text-primary aria-selected:bg-primary aria-selected:text-primary-foreground"
                        }}
                    />
                </div>

                {/* Events List */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <h4 className="font-medium text-sm mb-3 text-muted-foreground">
                        {date ? format(date, 'EEEE, d MMMM yyyy') : t('calendar.selectDate')}
                    </h4>

                    <ScrollArea className="flex-1 h-[280px] md:h-auto pr-4">
                        {selectedDateEvents.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDateEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(event.type === 'exam' ? `/student/exam/${event.id}` : `/student/assignments/${event.id}`)}
                                    >
                                        <div className={cn(
                                            "w-2 h-10 rounded-full flex-shrink-0",
                                            event.type === 'exam' ? "bg-red-500" : "bg-blue-500"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{event.title}</h5>
                                            <p className="text-xs text-muted-foreground truncate">{event.courseName}</p>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                                                    {event.type === 'exam' ? t('calendar.exam') : t('calendar.assignment')}
                                                </Badge>

                                                {event.isSubmitted && (
                                                    <Badge className="text-[10px] h-5 px-1.5 bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1 flex items-center">
                                                        <CheckCircle className="w-3 h-3" />
                                                        {event.type === 'exam' ? t('common.completed') : t('common.submitted')}
                                                    </Badge>
                                                )}

                                                {event.isPastDue && !event.isSubmitted && (
                                                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5 gap-1 flex items-center">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {t('calendar.pastDue')}
                                                    </Badge>
                                                )}

                                                <span className="text-[10px] text-muted-foreground ml-auto">
                                                    {format(event.date, 'HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
                                <p className="text-sm">{t('calendar.noDeadlines')}</p>
                                {upcomingEvents.length > 0 && date && !isSameDay(date, new Date()) && (
                                    <div className="mt-4">
                                        <p className="text-xs font-medium mb-2">{t('dashboard.upcomingDeadlines')}:</p>
                                        <ul className="text-xs space-y-1">
                                            {upcomingEvents.map(e => (
                                                <li key={e.id} className="text-primary cursor-pointer hover:underline" onClick={() => setDate(e.date)}>
                                                    {e.title} ({format(e.date, 'MMM d')})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
