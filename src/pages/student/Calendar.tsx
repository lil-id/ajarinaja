import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isPast } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, FileText, ClipboardList, Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { useExams } from '@/hooks/useExams';
import { useAssignments } from '@/hooks/useAssignments';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'exam' | 'assignment';
  courseName: string;
  status: string;
  isPastDue: boolean;
}

export default function StudentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { exams, isLoading: examsLoading } = useExams();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();

  const isLoading = enrollmentsLoading || coursesLoading || examsLoading || assignmentsLoading;

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
            courseName: courseMap.get(exam.course_id) || 'Unknown',
            status: exam.status,
            isPastDue: isPast(endDate),
          });
        }
        if (exam.start_date) {
          const startDate = new Date(exam.start_date);
          allEvents.push({
            id: `${exam.id}-start`,
            title: `${exam.title} (Opens)`,
            date: startDate,
            type: 'exam',
            courseName: courseMap.get(exam.course_id) || 'Unknown',
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
          allEvents.push({
            id: assignment.id,
            title: assignment.title,
            date: dueDate,
            type: 'assignment',
            courseName: courseMap.get(assignment.course_id) || 'Unknown',
            status: assignment.status,
            isPastDue: isPast(dueDate),
          });
        }
      });

    return allEvents;
  }, [exams, assignments, enrolledCourseIds, courseMap]);

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
          <h1 className="text-2xl font-bold text-foreground">My Calendar</h1>
          <p className="text-muted-foreground">Track exams and assignment deadlines</p>
        </div>
        <Button variant="outline" onClick={goToToday}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Today
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
                  {upcomingDeadlines.length} deadline{upcomingDeadlines.length > 1 ? 's' : ''} coming up this week
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  {upcomingDeadlines.slice(0, 3).map(d => d.title).join(', ')}
                  {upcomingDeadlines.length > 3 && ` and ${upcomingDeadlines.length - 3} more`}
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
                      isSelected && 'ring-2 ring-primary bg-primary/5',
                      isCurrentDay && !isSelected && 'bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm font-medium mb-1',
                        isCurrentDay && 'text-primary font-bold'
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
                              ? 'bg-primary/20 text-primary'
                              : 'bg-secondary/20 text-secondary-foreground'
                          )}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayEvents.length - 2} more
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
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-muted-foreground text-sm">
                Click on a date to view its events
              </p>
            ) : selectedDateEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No deadlines on this date</p>
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
                        event.type === 'exam' ? 'bg-primary/10' : 'bg-secondary/10'
                      )}
                    >
                      {event.type === 'exam' ? (
                        <FileText className="h-4 w-4 text-primary" />
                      ) : (
                        <ClipboardList className="h-4 w-4 text-secondary-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.courseName}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {event.type === 'exam' ? 'Exam' : 'Assignment'}
                        </Badge>
                        {event.isPastDue && (
                          <Badge variant="destructive" className="text-xs">
                            Past Due
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
            <span className="text-sm font-medium text-muted-foreground">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/20" />
              <span className="text-sm">Exam</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-secondary/20" />
              <span className="text-sm">Assignment</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
