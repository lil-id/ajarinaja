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
import { StudentActiveSessionWidget } from '@/components/attendance/StudentActiveSessionWidget';
import { StudentCalendarWidget } from '@/components/dashboard/StudentCalendarWidget';
import { StudentRecentActivityWidget } from '@/components/dashboard/StudentRecentActivityWidget';
import { StudentActivityChart } from '@/components/dashboard/StudentActivityChart';
import { StudentWaitingGradingWidget } from '@/components/dashboard/StudentWaitingGradingWidget';
import { StudentEnrolledCoursesWidget } from '@/components/dashboard/StudentEnrolledCoursesWidget';

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
      toast.success(t('dashboardToast.enrollSuccess'));
    } catch (error) {
      toast.error(t('dashboardToast.enrollFailed'));
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

      {/* Attendance Check-in Widget */}
      <StudentActiveSessionWidget />

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

      {/* Main Content Rows */}
      <div className="space-y-6">

        {/* Row 1: Recent Activity (40%) & Calendar (60%) */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 h-full">
            <StudentRecentActivityWidget />
          </div>
          <div className="lg:col-span-3 h-full">
            <StudentCalendarWidget />
          </div>
        </div>

        {/* Row 2: Activity Chart (50%) & Waiting Grading (50%) */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-full">
            <StudentActivityChart />
          </div>
          <div className="h-full">
            <StudentWaitingGradingWidget />
          </div>
        </div>

        {/* Row 3: Enrolled Courses */}
        <div>
          <StudentEnrolledCoursesWidget />
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
