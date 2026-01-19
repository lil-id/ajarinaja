import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, FileText, ClipboardList, Calendar as CalendarIcon, Loader2, Plus, Star, Trash2 } from 'lucide-react';
import { useExams } from '@/hooks/useExams';
import { useAssignments } from '@/hooks/useAssignments';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent } from '@/hooks/useCalendarEvents';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'exam' | 'assignment' | 'custom';
  courseName: string;
  status: string;
  href?: string;
  isCustom?: boolean;
}

export default function TeacherCalendar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventType, setNewEventType] = useState<'exam' | 'assignment' | 'custom'>('custom');
  const [customEventForm, setCustomEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '09:00',
  });

  const { courses } = useTeacherCourses();
  const courseIds = courses.map((c) => c.id);
  
  // Fetch all exams and assignments
  const { exams, isLoading: examsLoading } = useExams();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const { events: customEvents, isLoading: customEventsLoading } = useCalendarEvents();
  const createCustomEvent = useCreateCalendarEvent();
  const deleteCustomEvent = useDeleteCalendarEvent();

  const isLoading = examsLoading || assignmentsLoading || customEventsLoading;

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
            href: `/teacher/exams/${exam.id}/edit`,
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
            href: `/teacher/exams/${exam.id}/edit`,
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
            href: `/teacher/assignments/${assignment.id}/edit`,
          });
        }
      });

    // Add custom events
    customEvents.forEach((event) => {
      allEvents.push({
        id: event.id,
        title: event.title,
        date: new Date(event.event_date),
        type: 'custom',
        courseName: event.course_id ? courseMap.get(event.course_id) || 'General' : 'General',
        status: 'active',
        isCustom: true,
      });
    });

    return allEvents;
  }, [exams, assignments, customEvents, courseIds, courseMap]);

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

  const handleAddEvent = async () => {
    if (newEventType === 'exam') {
      navigate('/teacher/exams');
      setIsAddEventOpen(false);
    } else if (newEventType === 'assignment') {
      navigate('/teacher/assignments/new');
      setIsAddEventOpen(false);
    } else {
      // Create custom event
      if (!customEventForm.title.trim() || !customEventForm.date) {
        toast.error(t('toast.fillRequiredFields'));
        return;
      }
      try {
        const eventDateTime = new Date(`${customEventForm.date}T${customEventForm.time}`);
        await createCustomEvent.mutateAsync({
          title: customEventForm.title,
          description: customEventForm.description,
          event_date: eventDateTime.toISOString(),
          event_type: 'custom',
        });
        toast.success(t('toast.customEventCreated'));
        setIsAddEventOpen(false);
        setCustomEventForm({ title: '', description: '', date: '', time: '09:00' });
        setNewEventType('custom');
      } catch (error) {
        toast.error(t('toast.failedToCreateEvent'));
      }
    }
  };

  const handleDeleteCustomEvent = async (eventId: string) => {
    try {
      await deleteCustomEvent.mutateAsync(eventId);
      toast.success(t('toast.eventDeleted'));
    } catch (error) {
      toast.error(t('toast.failedToDeleteEvent'));
    }
  };

  // Pre-fill date when opening dialog with selected date
  const handleOpenAddEvent = () => {
    if (selectedDate) {
      setCustomEventForm(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd'),
      }));
    }
    setIsAddEventOpen(true);
  };

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
          <p className="text-muted-foreground">View all exams, assignments, and custom events</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button variant="default" onClick={handleOpenAddEvent}>
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
                  <Label>Event Type</Label>
                  <Select value={newEventType} onValueChange={(v) => setNewEventType(v as 'exam' | 'assignment' | 'custom')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Event</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newEventType === 'custom' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        value={customEventForm.title}
                        onChange={(e) => setCustomEventForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Event title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={customEventForm.description}
                        onChange={(e) => setCustomEventForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Event description (optional)"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          value={customEventForm.date}
                          onChange={(e) => setCustomEventForm(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={customEventForm.time}
                          onChange={(e) => setCustomEventForm(prev => ({ ...prev, time: e.target.value }))}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You'll be redirected to create a new {newEventType} with your desired schedule.
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddEvent} disabled={createCustomEvent.isPending}>
                    {createCustomEvent.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {newEventType === 'custom' ? 'Create Event' : 'Continue'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={goToToday}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Today
          </Button>
        </div>
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
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'h-24 p-1 border rounded-lg text-left transition-colors hover:bg-muted/50 overflow-hidden',
                      isSelected && 'ring-2 ring-destructive bg-destructive/5',
                      isCurrentDay && !isSelected && 'bg-muted',
                      hasEvents && !isSelected && 'border-destructive/50'
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm font-medium mb-1',
                        isCurrentDay && 'text-destructive font-bold',
                        hasEvents && 'text-destructive'
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
                              : event.type === 'assignment'
                              ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                              : 'bg-primary/20 text-primary'
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
                    onClick={() => event.href && navigate(event.href)}
                    className={cn(
                      'flex items-start gap-3 p-3 border rounded-lg transition-colors',
                      event.href ? 'cursor-pointer hover:bg-muted/50' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        event.type === 'exam' 
                          ? 'bg-destructive/10' 
                          : event.type === 'assignment' 
                          ? 'bg-orange-500/10'
                          : 'bg-primary/10'
                      )}
                    >
                      {event.type === 'exam' ? (
                        <FileText className="h-4 w-4 text-destructive" />
                      ) : event.type === 'assignment' ? (
                        <ClipboardList className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <Star className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.courseName}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          event.type === 'exam' 
                            ? 'border-destructive text-destructive' 
                            : event.type === 'assignment' 
                            ? 'border-orange-500 text-orange-600'
                            : 'border-primary text-primary'
                        )}>
                          {event.type === 'exam' ? 'Exam' : event.type === 'assignment' ? 'Assignment' : 'Custom'}
                        </Badge>
                        {event.type !== 'custom' && (
                          <Badge
                            variant={event.status === 'published' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {event.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(event.date, 'h:mm a')}
                      </p>
                    </div>
                    {event.isCustom && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomEvent(event.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
              <div className="w-3 h-3 rounded bg-destructive/20" />
              <span className="text-sm">Exam</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500/20" />
              <span className="text-sm">Assignment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/20" />
              <span className="text-sm">Custom Event</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
