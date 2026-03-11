import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useExams } from '@/hooks/useExams';
import { useAssignments } from '@/hooks/useAssignments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BookOpen, FileText, TrendingUp, Loader2, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { id, enUS } from 'date-fns/locale';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { RecentSubmissionsWidget } from '@/components/dashboard/RecentSubmissionsWidget';
import { PendingGradingWidget } from '@/components/dashboard/PendingGradingWidget';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { LiveSessionWidget } from '@/components/dashboard/LiveSessionWidget';
import { SchoolAnnouncementsBanner } from '@/components/dashboard/SchoolAnnouncementsBanner';
import { TeacherTodayScheduleWidget } from '@/components/dashboard/TeacherTodayScheduleWidget';

/**
 * Teacher Dashboard Overview page.
 * 
 * Main landing page for teachers.
 * Features:
 * - Key statistics with visual hierarchy
 * - Activity performance chart
 * - Recent submissions widget
 * - Pending grading widget
 * - Calendar widget with deadlines
 * - Course grid with engagement metrics
 * 
 * @returns {JSX.Element} The rendered Overview page.
 */
const TeacherOverview = () => {
  const { t, i18n } = useTranslation();

  const getDateLocale = () => (i18n.language === 'id' ? id : enUS);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { courses, isLoading: coursesLoading } = useTeacherCourses();
  const { exams, isLoading: examsLoading } = useExams();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();

  const isLoading = coursesLoading || examsLoading || assignmentsLoading;

  // Filter exams to only show those for teacher's courses
  const teacherCourseIds = courses.map(c => c.id);
  const teacherExams = exams.filter(e => teacherCourseIds.includes(e.course_id));
  const teacherAssignments = assignments.filter(a => teacherCourseIds.includes(a.course_id));

  const publishedCourses = courses.filter(c => c.status === 'published').length;

  const stats = [
    {
      label: t('dashboard.totalCourses'),
      value: courses.length,
      icon: BookOpen,
      color: 'bg-primary/10 text-primary',
      href: '/teacher/courses'
    },
    {
      label: t('dashboard.totalPublishedCourses'),
      value: publishedCourses,
      icon: TrendingUp,
      color: 'bg-secondary/10 text-secondary',
      href: '/teacher/courses'
    },
    {
      label: t('dashboard.totalExams'),
      value: teacherExams.length,
      icon: FileText,
      color: 'bg-accent/20 text-accent-foreground',
      href: '/teacher/exams'
    },
    {
      label: t('dashboard.totalAssignments'),
      value: teacherAssignments.length,
      icon: ClipboardList,
      color: 'bg-muted text-muted-foreground',
      href: '/teacher/assignments'
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('dashboard.welcome')}, {profile?.name?.split(' ')[0] || t('auth.teacher')}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.recentActivity')}
          </p>
        </div>

        {/* Live Attendance Session Widget */}
        <LiveSessionWidget />

        {/* School-Wide Announcements */}
        <SchoolAnnouncementsBanner />

        {/* Stats Grid - Clickable */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(stat.href)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 2: Activity Chart & Pending Grading */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ActivityChart />
          <TeacherTodayScheduleWidget />
        </div>

        {/* Row 3: Recent Submissions & Calendar Widget */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentSubmissionsWidget />
          </div>
          <div className="lg:col-span-3">
            <CalendarWidget />
          </div>
        </div>

        {/* Pending Grading - Full Width Bottom */}
        <PendingGradingWidget />
      </div>
    </TooltipProvider>
  );
};

export default TeacherOverview;
