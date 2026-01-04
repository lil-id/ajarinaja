import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isPast, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, FileText, ClipboardList, Calendar as CalendarIcon, Plus, Lock } from 'lucide-react';
import { demoCourses, demoExams, demoAssignments, demoCalendarEvents } from '@/data/demoData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'exam' | 'assignment' | 'custom';
  courseName?: string;
  description?: string;
}

export default function DemoTeacherCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    course_id: '',
  });

  // Build events from demo data
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    const now = new Date();

    // Add exam events
    demoExams.forEach((exam) => {
      if (exam.end_date) {
        allEvents.push({
          id: exam.id,
          title: exam.title,
          date: new Date(exam.end_date),
          type: 'exam',
          courseName: exam.course_title,
        });
      }
      if (exam.start_date) {
        allEvents.push({
          id: `${exam.id}-start`,
          title: `${exam.title} (Opens)`,
          date: new Date(exam.start_date),
          type: 'exam',
          courseName: exam.course_title,
        });
      }
    });

    // Add assignment events
    demoAssignments.forEach((assignment) => {
      allEvents.push({
        id: assignment.id,
        title: assignment.title,
        date: new Date(assignment.due_date),
        type: 'assignment',
        courseName: assignment.course_title,
      });
    });

    // Add custom events
    demoCalendarEvents.forEach((event) => {
      allEvents.push({
        id: event.id,
        title: event.title,
        date: new Date(event.event_date),
        type: 'custom',
        description: event.description,
        courseName: event.course_id ? demoCourses.find(c => c.id === event.course_id)?.title : undefined,
      });
    });

    return allEvents;
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();

  const getEventsForDay = (day: Date) => events.filter((e) => isSameDay(e.date, day));
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleAddEvent = () => {
    toast.info('Save is disabled in demo mode. Contact us for full access!', {
      action: {
        label: 'Contact',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">Manage exams, assignments, and events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goToToday}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Event Title</Label>
                  <Input
                    placeholder="e.g., Faculty Meeting"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Course (Optional)</Label>
                  <Select value={newEvent.course_id} onValueChange={(v) => setNewEvent({ ...newEvent, course_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Course</SelectItem>
                      {demoCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Event details..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-400">Saving is disabled in demo mode</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAddEventOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleAddEvent} className="flex-1">
                    Add Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                      isSelected && 'ring-2 ring-primary bg-primary/5',
                      isCurrentDay && !isSelected && 'bg-muted',
                      dayEvents.length > 0 && !isSelected && 'border-primary/50'
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm font-medium mb-1',
                        isCurrentDay && 'text-primary font-bold',
                        dayEvents.length > 0 && 'text-primary'
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
                            event.type === 'exam' && 'bg-destructive/20 text-destructive',
                            event.type === 'assignment' && 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
                            event.type === 'custom' && 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
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
              <p className="text-muted-foreground text-sm">No events on this date</p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        event.type === 'exam' && 'bg-destructive/10',
                        event.type === 'assignment' && 'bg-orange-500/10',
                        event.type === 'custom' && 'bg-blue-500/10'
                      )}
                    >
                      {event.type === 'exam' ? (
                        <FileText className="h-4 w-4 text-destructive" />
                      ) : event.type === 'assignment' ? (
                        <ClipboardList className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      {event.courseName && <p className="text-xs text-muted-foreground">{event.courseName}</p>}
                      {event.description && <p className="text-xs text-muted-foreground mt-1">{event.description}</p>}
                      <Badge
                        variant="outline"
                        className={cn(
                          'mt-2 text-xs',
                          event.type === 'exam' && 'border-destructive text-destructive',
                          event.type === 'assignment' && 'border-orange-500 text-orange-600',
                          event.type === 'custom' && 'border-blue-500 text-blue-600'
                        )}
                      >
                        {event.type === 'exam' ? 'Exam' : event.type === 'assignment' ? 'Assignment' : 'Event'}
                      </Badge>
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
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/20" />
              <span className="text-sm">Custom Event</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
