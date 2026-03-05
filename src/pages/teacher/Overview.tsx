import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useExams } from '@/hooks/useExams';
import { useAssignments } from '@/hooks/useAssignments';
import { useCourseMetrics } from '@/hooks/useCourseMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BookOpen, FileText, TrendingUp, Loader2, ClipboardList, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { RecentSubmissionsWidget } from '@/components/dashboard/RecentSubmissionsWidget';
import { PendingGradingWidget } from '@/components/dashboard/PendingGradingWidget';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { LiveSessionWidget } from '@/components/dashboard/LiveSessionWidget';

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

  const courseIds = courses.map(c => c.id);
  const { data: courseMetrics = [], isLoading: metricsLoading } = useCourseMetrics(courseIds);

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
          <PendingGradingWidget />
        </div>

        {/* Row 3: Recent Submissions & Calendar Widget */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <RecentSubmissionsWidget />
          </div>
          <div className="lg:col-span-3">
            <CalendarWidget />
          </div>
        </div>

        {/* My Courses - Grid Layout with Engagement Metrics */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">{t('courses.myCourses')}</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('courses.noCourses')}
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.slice(0, 6).map((course) => {
                  const metrics = courseMetrics.find(m => m.course_id === course.id);

                  return (
                    <Card
                      key={course.id}
                      onClick={() => navigate(`/teacher/courses/${course.id}`)}
                      className="border border-border hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-5 h-5 text-secondary-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">{course.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                {metrics?.student_count || 0} {t('courses.students')}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={course.status === 'published' ? 'secondary' : 'outline'}
                            className="text-xs flex-shrink-0"
                          >
                            {course.status === 'published' ? t('common.published') : t('common.draft')}
                          </Badge>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{metrics?.exam_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClipboardList className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{metrics?.assignment_count || 0}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {metrics && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{t('courses.avgProgress')}</span>
                              <span className="font-medium">{metrics.avg_progress}%</span>
                            </div>
                            <Progress value={metrics.avg_progress} className="h-1.5" />
                          </div>
                        )}

                        {/* Pending Grading Alert */}
                        {metrics && metrics.pending_grading_count > 0 && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            <span className="text-xs text-amber-700 dark:text-amber-300">
                              {metrics.pending_grading_count} {t('courses.pendingGrading')}
                            </span>
                          </div>
                        )}

                        {/* Next Deadline */}
                        {metrics?.upcoming_deadline && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground truncate">
                              <span className="font-medium">{t('courses.nextDeadline')}:</span>{' '}
                              {metrics.upcoming_deadline.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(metrics.upcoming_deadline.date), {
                                addSuffix: true,
                                locale: getDateLocale()
                              })}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default TeacherOverview;
