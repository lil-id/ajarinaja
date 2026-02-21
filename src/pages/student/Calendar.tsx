import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isPast } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, FileText, ClipboardList, Calendar as CalendarIcon, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useExams } from '@/hooks/useExams';
import { useSubmissions } from '@/hooks/useSubmissions';
import { useAssignments } from '@/hooks/useAssignments';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { useAllAssignmentSubmissions } from '@/hooks/useProgress';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'exam' | 'assignment';
  courseName: string;
  status: string;
  isPastDue: boolean;
  isSubmitted?: boolean;
}

/**
 * Student Calendar page.
 * 
 * Timeline view of course deadlines.
 * Features:
 * - Monthly calendar view
 * - Event indicators for Exams and Assignments
 * - Interactive date selection for daily details
 * - "Upcoming Deadlines" alert system
 * 
 * @returns {JSX.Element} The rendered Calendar page.
 */
export default function StudentCalendar() {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { exams, isLoading: examsLoading } = useExams();
  const { submissions, isLoading: submissionsLoading } = useSubmissions();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const { data: submittedAssignmentIds = [] } = useAllAssignmentSubmissions();

  const isLoading = enrollmentsLoading || coursesLoading || examsLoading || assignmentsLoading || submissionsLoading;

  // Get enrolled course IDs
  const enrolledCourseIds = enrollments.map(e => e.course_id);

  // Build course map for names
  const courseMap = useMemo(() => {
    return new Map(courses.map((c) => [c.id, c.title]));
  }, [courses]);

  // Filter to only enrolled courses and build events
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    const now = new Date();

    // Add exam events
    const completedExamIds = submissions.map(s => s.exam_id);

    (exams || [])
      .filter((e) => enrolledCourseIds.includes(e.course_id) && e.status === 'published')
      .forEach((exam) => {
        if (exam.end_date) {
          const endDate = new Date(exam.end_date);
          allEvents.push({
            id: exam.id,
            title: exam.title,
            date: endDate,
            type: 'exam',
            courseName: courseMap.get(exam.course_id) || t('calendar.unknown'),
            status: exam.status,
            isPastDue: isPast(endDate) && !completedExamIds.includes(exam.id),
            isSubmitted: completedExamIds.includes(exam.id),
          });
        }
        if (exam.start_date) {
          const startDate = new Date(exam.start_date);
          allEvents.push({
            id: `${exam.id}-start`,
            title: `${exam.title} (${t('calendar.opens')})`,
            date: startDate,
            type: 'exam',
            courseName: courseMap.get(exam.course_id) || t('calendar.unknown'),
            status: exam.status,
            isPastDue: false,
          });
        }
      });

    // Add assignment events
    assignments
      .filter((a) => enrolledCourseIds.includes(a.course_id) && a.status === 'published')
      .forEach((assignment) => {
        if (assignment.due_date) {
          const dueDate = new Date(assignment.due_date);
          const isSubmitted = submittedAssignmentIds.includes(assignment.id);

          allEvents.push({
            id: assignment.id,
            title: assignment.title,
            date: dueDate,
            type: 'assignment',
            courseName: courseMap.get(assignment.course_id) || t('calendar.unknown'),
            status: assignment.status,
            isPastDue: !isSubmitted && isPast(dueDate),
            isSubmitted,
          });
        }
      });

    return allEvents;
  }, [exams, assignments, enrolledCourseIds, courseMap, submittedAssignmentIds]);

  // Get days in current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((e) => isSameDay(e.date, day));
  };

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events
      .filter(e => e.date >= now && e.date <= nextWeek && !e.id.includes('-start'))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  // Navigation
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Get first day of week offset
  const firstDayOfWeek = monthStart.getDay();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('calendar.myCalendar')}</h1>
          <p className="text-muted-foreground">{t('calendar.trackDeadlines')}</p>
        </div>
        <Button variant="outline" onClick={goToToday}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          {t('calendar.today')}
        </Button>
      </div>

      {/* Upcoming Deadlines Alert */}
      {upcomingDeadlines.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900 dark:text-orange-200">
                  {t('calendar.deadlinesComingUp', { count: upcomingDeadlines.length })}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  {upcomingDeadlines.slice(0, 3).map(d => d.title).join(', ')}
                  {upcomingDeadlines.length > 3 && ` ${t('calendar.andMore', { count: upcomingDeadlines.length - 3 })}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-0 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 p-1" />
              ))}

              {/* Days of month */}
              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentDay = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'h-24 p-1 border rounded-lg text-left transition-colors hover:bg-muted/50 overflow-hidden',
                      isSelected && 'ring-2 ring-destructive bg-destructive/5',
                      isCurrentDay && !isSelected && 'bg-muted',
                      dayEvents.length > 0 && !isSelected && 'border-destructive/50'
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm font-medium mb-1',
                        isCurrentDay && 'text-destructive font-bold',
                        dayEvents.length > 0 && 'text-destructive'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            'text-xs px-1 py-0.5 rounded truncate',
                            event.type === 'exam'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                          )}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayEvents.length - 2} {t('calendar.more')}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected date details */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : t('calendar.selectDate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-muted-foreground text-sm">
                {t('calendar.clickToView')}
              </p>
            ) : selectedDateEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('calendar.noDeadlines')}</p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        event.type === 'exam' ? 'bg-destructive/10' : 'bg-orange-500/10'
                      )}
                    >
                      {event.type === 'exam' ? (
                        <FileText className="h-4 w-4 text-destructive" />
                      ) : (
                        <ClipboardList className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.courseName}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            event.type === 'exam'
                              ? 'border-destructive text-destructive'
                              : 'border-orange-500 text-orange-600 dark:text-orange-400'
                          )}
                        >
                          {event.type === 'exam' ? t('calendar.exam') : t('calendar.assignment')}
                        </Badge>
                        {event.isSubmitted && (
                          <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                            {event.type === 'exam' ? t('common.completed') : t('common.submitted')}
                          </Badge>
                        )}
                        {event.isPastDue && (
                          <Badge variant="destructive" className="text-xs">
                            {t('calendar.pastDue')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(event.date, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card className="border-0 shadow-card">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-muted-foreground">{t('calendar.legend')}:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-destructive/20" />
              <span className="text-sm">{t('calendar.exam')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500/20" />
              <span className="text-sm">{t('calendar.assignment')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
