import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useExams } from '@/hooks/useExams';
import { useAssignments } from '@/hooks/useAssignments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, FileText, TrendingUp, Loader2, ClipboardList, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

/**
 * Teacher Dashboard Overview page.
 * 
 * Main landing page for teachers.
 * Features:
 * - Key statistics (Total courses, Published, Exams, Assignments)
 * - Quick actions shortcuts
 * - Recent courses list
 * - Welcome message with teacher name
 * 
 * @returns {JSX.Element} The rendered Overview page.
 */
const TeacherOverview = () => {
  const { t } = useTranslation();
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

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => navigate('/teacher/calendar')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t('nav.calendar')}</h3>
              <p className="text-sm text-muted-foreground">{t('dashboard.upcomingDeadlines')}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => navigate('/teacher/students')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t('nav.students')}</h3>
              <p className="text-sm text-muted-foreground">{t('courses.enrolledStudents')}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => navigate('/teacher/analytics')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t('nav.analytics')}</h3>
              <p className="text-sm text-muted-foreground">{t('analytics.performance')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Courses - Clickable */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">{t('courses.myCourses')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('courses.noCourses')}
              </p>
            ) : (
              courses.slice(0, 5).map((course) => {
                const courseExams = teacherExams.filter(e => e.course_id === course.id);
                const upcomingExam = courseExams
                  .filter(e => e.end_date && new Date(e.end_date) > new Date())
                  .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())[0];

                return (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/teacher/courses/${course.id}`)}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{course.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {courseExams.length} {t('exams.title').toLowerCase()}
                        </p>
                        {upcomingExam && (
                          <p className="text-xs text-destructive mt-1">
                            {t('exams.deadline')}: {format(new Date(upcomingExam.end_date!), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${course.status === 'published'
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-muted text-muted-foreground'
                      }`}>
                      {course.status === 'published' ? t('common.published') : t('common.draft')}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherOverview;
