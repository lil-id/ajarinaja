import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, FileText, ClipboardList, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useExams } from '@/hooks/useExams';
import { useAssignments } from '@/hooks/useAssignments';
import { useTeacherCourses } from '@/hooks/useCourses';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'exam' | 'assignment';
  courseName: string;
  status: string;
}

export default function TeacherCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { courses } = useTeacherCourses();
  const courseIds = courses.map((c) => c.id);
  
  // Fetch all exams and assignments
  const { exams, isLoading: examsLoading } = useExams();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();

  const isLoading = examsLoading || assignmentsLoading;

  // Build course map for names
  const courseMap = useMemo(() => {
    return new Map(courses.map((c) => [c.id, c.title]));
  }, [courses]);

  // Filter to only teacher's courses and build events
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Add exam events (using end_date as the deadline)
    (exams || [])
      .filter((e) => courseIds.includes(e.course_id))
      .forEach((exam) => {
        if (exam.end_date) {
          allEvents.push({
            id: exam.id,
            title: exam.title,
            date: new Date(exam.end_date),
            type: 'exam',
            courseName: courseMap.get(exam.course_id) || 'Unknown',
            status: exam.status,
          });
        }
        if (exam.start_date) {
          allEvents.push({
            id: `${exam.id}-start`,
            title: `${exam.title} (Start)`,
            date: new Date(exam.start_date),
            type: 'exam',
            courseName: courseMap.get(exam.course_id) || 'Unknown',
            status: exam.status,
          });
        }
      });

    // Add assignment events
    assignments
      .filter((a) => courseIds.includes(a.course_id))
      .forEach((assignment) => {
        if (assignment.due_date) {
          allEvents.push({
            id: assignment.id,
            title: assignment.title,
            date: new Date(assignment.due_date),
            type: 'assignment',
            courseName: courseMap.get(assignment.course_id) || 'Unknown',
            status: assignment.status,
          });
        }
      });

    return allEvents;
  }, [exams, assignments, courseIds, courseMap]);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">View all exams and assignment deadlines</p>
        </div>
        <Button variant="outline" onClick={goToToday}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Today
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
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
        <Card>
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
              <p className="text-muted-foreground text-sm">No events on this date</p>
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
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {event.type === 'exam' ? 'Exam' : 'Assignment'}
                        </Badge>
                        <Badge
                          variant={event.status === 'published' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {event.status}
                        </Badge>
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
      <Card>
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
