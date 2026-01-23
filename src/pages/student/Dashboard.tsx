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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          onClick={() => navigate('/student/assignments')}
        >
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {assignments.filter(a => a.status === 'published' && enrolledCourseIds.includes(a.course_id)).length}
            </p>
            <p className="text-sm text-muted-foreground">{t('dashboard.totalAssignments')}</p>
          </CardContent>
        </Card>
        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/student/exams')}
        >
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{upcomingExams.length}</p>
            <p className="text-sm text-muted-foreground">{t('dashboard.totalExams')}</p>
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
    </div>
  );
};

export default StudentDashboard;
