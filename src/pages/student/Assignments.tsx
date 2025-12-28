import { useNavigate } from 'react-router-dom';
import { format, isPast, isFuture, differenceInDays } from 'date-fns';
import { FileText, Calendar, Clock, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { useAssignments } from '@/hooks/useAssignments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function StudentAssignments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollments = [] } = useEnrollments();
  const { courses = [] } = useCourses();
  const { data: allAssignments = [] } = useAssignments();

  // Get student's submissions
  const { data: mySubmissions = [] } = useQuery({
    queryKey: ['my-all-submissions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const courseMap = new Map(courses.map(c => [c.id, c.title]));

  // Filter assignments for enrolled courses only
  const assignments = allAssignments
    .filter(a => enrolledCourseIds.includes(a.course_id) && a.status === 'published')
    .map(a => {
      const submission = mySubmissions.find(s => s.assignment_id === a.id);
      return { ...a, submission };
    });

  const upcoming = assignments.filter(a => !a.submission && isFuture(new Date(a.due_date)));
  const pending = assignments.filter(a => !a.submission && isPast(new Date(a.due_date)));
  const submitted = assignments.filter(a => a.submission);
  const graded = submitted.filter(a => a.submission?.graded);

  const completionRate = assignments.length > 0 
    ? Math.round((submitted.length / assignments.length) * 100) 
    : 0;

  const getDaysUntilDue = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days < 0) return `${Math.abs(days)} days overdue`;
    return `${days} days left`;
  };

  const renderAssignmentCard = (assignment: any) => {
    const isOverdue = isPast(new Date(assignment.due_date)) && !assignment.submission;
    const isSubmitted = !!assignment.submission;
    const isGraded = assignment.submission?.graded;

    return (
      <Card key={assignment.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
              <CardDescription>
                {courseMap.get(assignment.course_id) || 'Unknown Course'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isGraded && (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Graded: {assignment.submission.score}/{assignment.max_points}
                </Badge>
              )}
              {isSubmitted && !isGraded && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
              {!isSubmitted && !isOverdue && (
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {getDaysUntilDue(assignment.due_date)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
              </span>
              <span>{assignment.max_points} points</span>
            </div>
            <Button 
              variant={isSubmitted ? 'outline' : 'default'}
              size="sm"
              onClick={() => navigate(`/student/assignments/${assignment.id}`)}
            >
              {isSubmitted ? (
                <>View Submission</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
          {assignment.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {assignment.description}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (enrollments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">View and submit your course assignments</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Assignments</h3>
            <p className="text-muted-foreground text-center">
              Enroll in courses to see assignments
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assignments</h1>
        <p className="text-muted-foreground">View and submit your course assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Assignments</CardDescription>
            <CardTitle className="text-2xl">{assignments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Submitted</CardDescription>
            <CardTitle className="text-2xl">{submitted.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Graded</CardDescription>
            <CardTitle className="text-2xl">{graded.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-2xl">{completionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={completionRate} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Overdue ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted ({submitted.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming assignments
              </CardContent>
            </Card>
          ) : (
            upcoming.map(renderAssignmentCard)
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No overdue assignments
              </CardContent>
            </Card>
          ) : (
            pending.map(renderAssignmentCard)
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {submitted.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No submitted assignments yet
              </CardContent>
            </Card>
          ) : (
            submitted.map(renderAssignmentCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
