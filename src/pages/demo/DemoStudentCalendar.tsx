import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isPast } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, FileText, ClipboardList, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { demoCourses, demoExams, demoAssignments } from '@/data/demoData';
import { cn } from '@/lib/utils';

/**
 * Represents a calendar event (exam or assignment).
 * @interface CalendarEvent
 */
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'exam' | 'assignment';
  courseName: string;
  isPastDue: boolean;
}

/**
 * Demo Student Calendar page.
 * 
 * Provides an interactive calendar view of upcoming exams and assignment deadlines.
 * Features:
 * - Monthly view with navigation
 * - Day selection to view specific events
 * - Visual indicators for different event types (Exams vs Assignments)
 * - Alert for upcoming deadlines within the next 7 days
 * 
 * @returns {JSX.Element} The rendered Student Calendar page.
 */
export default function DemoStudentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const enrolledCourses = demoCourses.filter(c => c.status === 'published');
  const enrolledCourseIds = enrolledCourses.map(c => c.id);

  // Build events from demo data
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    const now = new Date();

    // Add exam events for enrolled courses
    demoExams
      .filter(e => enrolledCourseIds.includes(e.course_id) && e.status === 'published')
      .forEach((exam) => {
        if (exam.end_date) {
          const endDate = new Date(exam.end_date);
          allEvents.push({
            id: exam.id,
            title: exam.title,
            date: endDate,
            type: 'exam',
            courseName: exam.course_title,
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
            courseName: exam.course_title,
            isPastDue: false,
          });
        }
      });

    // Add assignment events for enrolled courses
    demoAssignments
      .filter(a => enrolledCourseIds.includes(a.course_id) && a.status === 'published')
      .forEach((assignment) => {
        const dueDate = new Date(assignment.due_date);
        allEvents.push({
          id: assignment.id,
          title: assignment.title,
          date: dueDate,
          type: 'assignment',
          courseName: assignment.course_title,
          isPastDue: isPast(dueDate),
        });
      });

    return allEvents;
  }, [enrolledCourseIds]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();

  const getEventsForDay = (day: Date) => events.filter((e) => isSameDay(e.date, day));
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events
      .filter(e => e.date >= now && e.date <= nextWeek && !e.id.includes('-start'))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

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
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 p-1" />
              ))}

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
              <p className="text-muted-foreground text-sm">Click on a date to view its events</p>
            ) : selectedDateEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No deadlines on this date</p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
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
                            'text-xs',
                            event.type === 'exam'
                              ? 'border-destructive text-destructive'
                              : 'border-orange-500 text-orange-600 dark:text-orange-400'
                          )}
                        >
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
              <div className="w-3 h-3 rounded bg-destructive/20" />
              <span className="text-sm">Exam</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500/20" />
              <span className="text-sm">Assignment</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
