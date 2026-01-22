import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/useCourses';
import { useEnrollments, useEnroll } from '@/hooks/useEnrollments';
import { useExams } from '@/hooks/useExams';
import { useAssignments } from '@/hooks/useAssignments';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, FileText, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Student Dashboard page.
 * 
 * Main landing page for students.
 * Features:
 * - Overview stats (Enrolled courses, deadlines, grades)
 * - Quick access links
 * - Recommended/Upcoming items feed
 * 
 * @returns {JSX.Element} The rendered Dashboard page.
 */
const StudentDashboard = () => {
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { exams, isLoading: examsLoading } = useExams();
  const { data: assignments = [] } = useAssignments();
  const enroll = useEnroll();

  // Get completed assignments count
  const { data: completedAssignments = 0 } = useQuery({
    queryKey: ['completed-assignments-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Count file-based submissions
      const { count: fileCount } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('graded', true);

      // Count question-based submissions
      const { count: questionCount } = await supabase
        .from('assignment_question_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('graded', true);

      return (fileCount || 0) + (questionCount || 0);
    },
    enabled: !!user,
  });

  const isLoading = coursesLoading || enrollmentsLoading || examsLoading;

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));
  const availableCourses = courses.filter(
    c => c.status === 'published' && !enrolledCourseIds.includes(c.id)
  );

  const upcomingExams = exams.filter(
    e => e.status === 'published' && enrolledCourseIds.includes(e.course_id)
  );

  const handleEnroll = async (courseId: string) => {
    try {
      await enroll.mutateAsync(courseId);
      toast.success('Successfully enrolled in course!');
    } catch (error) {
      toast.error('Failed to enroll in course');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t('dashboard.welcome')}, {profile?.name?.split(' ')[0] || t('auth.student')}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('dashboard.recentActivity')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/student/courses')}
        >
          <CardContent className="p-6 text-center">
            <BookOpen className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{enrolledCourses.length}</p>
            <p className="text-sm text-muted-foreground">{t('dashboard.totalCourses')}</p>
          </CardContent>
        </Card>
        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/student/exams')}
        >
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{upcomingExams.length}</p>
            <p className="text-sm text-muted-foreground">{t('exams.title')}</p>
          </CardContent>
        </Card>
        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/student/assignments')}
        >
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{completedAssignments}</p>
            <p className="text-sm text-muted-foreground">{t('assignments.graded')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>{t('exams.title')}</CardTitle>
            <CardDescription>{t('exams.takeExam')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingExams.slice(0, 3).map((exam) => {
                const course = courses.find(c => c.id === exam.course_id);
                return (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">{exam.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {course?.title} • {exam.duration} min • {exam.total_points} pts
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/student/exam/${exam.id}`)}
                    >
                      {t('exams.takeExam')}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Courses to Enroll */}
      {availableCourses.length > 0 && (
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>{t('nav.exploreCourses')}</CardTitle>
            <CardDescription>{t('courses.enrollNow')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {availableCourses.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  className="p-4 rounded-xl border border-border hover:border-secondary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {course.description || t('common.noData')}
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEnroll(course.id)}
                        disabled={enroll.isPending}
                      >
                        {enroll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {t('courses.enrollNow')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {availableCourses.length === 0 && enrolledCourses.length === 0 && (
        <Card className="border-0 shadow-card">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('courses.noCourses')}</h3>
            <p className="text-muted-foreground">{t('courses.noEnrollments')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentDashboard;
