import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isFuture, differenceInDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, Clock, CheckCircle, AlertCircle, Upload, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { useAssignments } from '@/hooks/useAssignments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

/**
 * Student Assignments page.
 * 
 * Core interface for managing assignments.
 * Features:
 * - Assignment list with filtering (Status, Course, Search)
 * - Grouping by deadline (Upcoming, Overdue, Submitted)
 * - Status indicators (Graded, Submitted, Overdue)
 * - Navigation to submission details
 * 
 * @returns {JSX.Element} The rendered Assignments page.
 */
export default function StudentAssignments() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollments = [] } = useEnrollments();
  const { courses = [] } = useCourses();
  const { data: allAssignments = [] } = useAssignments();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  // Get student's file/text submissions
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

  // Get student's question-based submissions
  const { data: myQuestionSubmissions = [] } = useQuery({
    queryKey: ['my-all-question-submissions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('assignment_question_submissions')
        .select('*')
        .eq('student_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));
  const courseMap = new Map(courses.map(c => [c.id, c.title]));

  // Filter assignments for enrolled courses only
  const assignments = allAssignments
    .filter(a => enrolledCourseIds.includes(a.course_id) && a.status === 'published')
    .map(a => {
      // Check both submission types based on assignment type
      const fileSubmission = mySubmissions.find(s => s.assignment_id === a.id);
      const questionSubmission = myQuestionSubmissions.find(s => s.assignment_id === a.id);
      const submission = fileSubmission || questionSubmission;
      return { ...a, submission };
    });

  // Apply search and course filter
  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (courseMap.get(a.course_id) || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || a.course_id === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const upcoming = filteredAssignments.filter(a => !a.submission && isFuture(new Date(a.due_date)));
  const pending = filteredAssignments.filter(a => !a.submission && isPast(new Date(a.due_date)));
  const submitted = filteredAssignments.filter(a => a.submission);
  const graded = submitted.filter(a => a.submission?.graded);

  const completionRate = filteredAssignments.length > 0
    ? Math.round((submitted.length / filteredAssignments.length) * 100)
    : 0;

  const getDaysUntilDue = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days === 0) return t('assignments.dueToday');
    if (days === 1) return t('assignments.dueTomorrow');
    if (days < 0) return `${Math.abs(days)} ${t('assignments.daysOverdue')}`;
    return `${days} ${t('assignments.daysLeft')}`;
  };

  /**
   * Renders a single assignment card with status logic.
   * @param {any} assignment - The assignment object
   * @returns {JSX.Element} The rendered card
   */
  const renderAssignmentCard = (assignment: any) => {
    const isOverdue = isPast(new Date(assignment.due_date)) && !assignment.submission;
    const isSubmitted = !!assignment.submission;
    const isGraded = assignment.submission?.graded;

    return (
      <Card
        key={assignment.id}
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/student/assignments/${assignment.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/student/assignments/${assignment.id}`);
          }
        }}
        className="hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
              <CardDescription>
                {courseMap.get(assignment.course_id) || t('materials.unknownCourse')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isGraded && (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('assignments.graded')}: {assignment.submission.score}/{assignment.max_points}
                </Badge>
              )}
              {isSubmitted && !isGraded && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {t('assignments.submitted')}
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t('assignments.overdue')}
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
              <span>{assignment.max_points} {t('common.points')}</span>
            </div>
            <Button
              variant={isSubmitted ? 'outline' : 'default'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/student/assignments/${assignment.id}`);
              }}
            >
              {isSubmitted ? (
                <>{t('assignments.viewSubmission')}</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('common.submit')}
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
          <h1 className="text-3xl font-bold">{t('assignments.title')}</h1>
          <p className="text-muted-foreground">{t('assignments.viewAndSubmit')}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('assignments.noAssignments')}</h3>
            <p className="text-muted-foreground text-center">
              {t('assignments.enrollInCoursesToSeeAssignments')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('assignments.title')}</h1>
          <p className="text-muted-foreground">{t('assignments.viewAndSubmit')}</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('assignments.searchAssignments')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('common.allCourses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.allCourses')}</SelectItem>
              {enrolledCourses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('assignments.totalAssignments')}</CardDescription>
            <CardTitle className="text-2xl">{filteredAssignments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('assignments.submitted')}</CardDescription>
            <CardTitle className="text-2xl">{submitted.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('assignments.graded')}</CardDescription>
            <CardTitle className="text-2xl">{graded.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('assignments.completionRate')}</CardDescription>
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
            {t('assignments.upcoming')} ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            {t('assignments.overdue')} ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            {t('assignments.submitted')} ({submitted.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t('assignments.noUpcomingAssignments')}
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
                {t('assignments.noOverdueAssignments')}
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
                {t('assignments.noSubmittedAssignments')}
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