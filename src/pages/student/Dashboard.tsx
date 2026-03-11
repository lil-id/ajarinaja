import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/useCourses';
import { useEnroll } from '@/hooks/useEnrollments';
import { useEffectiveCourseIds } from '@/hooks/useEffectiveCourseIds';
import { useExams } from '@/hooks/useExams';
import { useAssignments } from '@/hooks/useAssignments';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, FileText, CheckCircle, ArrowRight, Loader2, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StudentActiveSessionWidget } from '@/components/attendance/StudentActiveSessionWidget';
import { StudentCalendarWidget } from '@/components/dashboard/StudentCalendarWidget';
import { StudentRecentActivityWidget } from '@/components/dashboard/StudentRecentActivityWidget';
import { StudentActivityChart } from '@/components/dashboard/StudentActivityChart';
import { StudentWaitingGradingWidget } from '@/components/dashboard/StudentWaitingGradingWidget';
import { StudentEnrolledCoursesWidget } from '@/components/dashboard/StudentEnrolledCoursesWidget';
import { SchoolAnnouncementsBanner } from '@/components/dashboard/SchoolAnnouncementsBanner';

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
  const {
    effectiveCourseIds,
    enrollments,
    enrolledClassIds,
    isLoading: effectiveCoursesLoading
  } = useEffectiveCourseIds();
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

  const isLoading = coursesLoading || effectiveCoursesLoading || examsLoading;

  const enrolledCourseIds = effectiveCourseIds;
  const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));
  const availableCourses = courses.filter(
    c => c.status === 'published' && !enrolledCourseIds.includes(c.id)
  );

  /**
   * Determines whether a given exam or assignment should be visible to this student.
   * - Class-targeted: ONLY show to students in that specific class
   * - Global (no class_id): show to anyone enrolled in the course
   */
  const isItemVisible = (item: { course_id: string; class_id?: string | null }) => {
    if (item.class_id) {
      return enrolledClassIds.includes(item.class_id);
    }
    return enrolledCourseIds.includes(item.course_id);
  };

  const upcomingExams = exams.filter(
    e => e.status?.toLowerCase() === 'published' && isItemVisible(e)
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

      {/* School-Wide Announcements */}
      <SchoolAnnouncementsBanner />

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate('/student/courses')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{t('dashboard.totalCourses')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-center">{t('studentAnalytics.tooltipTotalCourses')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-foreground mt-2">{enrolledCourses.length}</p>
              </div>
              <div className="h-12 w-12 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate('/student/assignments')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{t('dashboard.totalAssignments')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-center">{t('studentAnalytics.tooltipTotalAssignments')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {assignments.filter(a => a.status?.toLowerCase() === 'published' && isItemVisible(a)).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate('/student/exams')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{t('dashboard.totalExams')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-center">{t('studentAnalytics.tooltipTotalExams')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-foreground mt-2">{upcomingExams.length}</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate('/student/assignments')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{t('assignments.graded')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-center">{t('studentAnalytics.tooltipGradedAssignments')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-foreground mt-2">{completedAssignments}</p>
              </div>
              <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
            </div>
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
      </div>
    </div>
  );
};

export default StudentDashboard;
