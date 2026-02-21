import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useCourses } from '@/hooks/useCourses';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useExams } from '@/hooks/useExams';
import { useSubmissions } from '@/hooks/useSubmissions';
import { FileText, Clock, Award, ArrowRight, CheckCircle, Loader2, Eye, Calendar, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Student Exams page.
 * 
 * Hub for all exam-related activities.
 * Features:
 * - Exam list filtering (Available, Completed, Upcoming)
 * - Status indicators (Taken, Graded, Pending)
 * - Timed availability checks
 * - Search and course filtering
 * 
 * @returns {JSX.Element} The rendered Exams page.
 */
const StudentExams = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { exams, isLoading: examsLoading } = useExams();
  const { submissions, isLoading: submissionsLoading } = useSubmissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  const isLoading = coursesLoading || enrollmentsLoading || examsLoading || submissionsLoading;

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));

  const now = new Date();

  // Apply search and course filter
  const filterExams = (examList: typeof exams) => {
    return examList.filter(exam => {
      const course = courses.find(c => c.id === exam.course_id);
      const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCourse = selectedCourse === 'all' || exam.course_id === selectedCourse;
      return matchesSearch && matchesCourse;
    });
  };

  const completedExamIds = submissions.map(s => s.exam_id);

  // Completed exams: All exams with submissions, for enrolled courses.
  // We do NOT check for 'published' status here to ensure history is preserved even if exam is archived.
  const rawCompletedExams = exams.filter(e =>
    completedExamIds.includes(e.id) &&
    enrolledCourseIds.includes(e.course_id)
  );
  const completedExams = filterExams(rawCompletedExams);

  // Available exams: Published, Enrolled, Within Schedule, Not Completed
  const rawAvailableExams = exams.filter(e => {
    if (completedExamIds.includes(e.id)) return false;
    if (e.status !== 'published') return false;
    if (!enrolledCourseIds.includes(e.course_id)) return false;

    // Check schedule
    if (e.start_date && new Date(e.start_date) > now) return false;
    if (e.end_date && new Date(e.end_date) < now) return false;

    return true;
  });
  const availableExams = filterExams(rawAvailableExams);

  // Missed exams: Published, Enrolled, Expired, Not Completed
  const rawMissedExams = exams.filter(e => {
    if (completedExamIds.includes(e.id)) return false;
    if (e.status !== 'published') return false;
    if (!enrolledCourseIds.includes(e.course_id)) return false;

    // Must be expired
    if (e.end_date && new Date(e.end_date) < now) return true;

    return false;
  });

  // Combine Completed and Missed into "History"
  const rawHistoryExams = [...rawCompletedExams, ...rawMissedExams].sort((a, b) =>
    new Date(b.end_date || b.created_at).getTime() - new Date(a.end_date || a.created_at).getTime()
  );
  const historyExams = filterExams(rawHistoryExams);

  // Upcoming exams: Published, Enrolled, Future Start Date
  const rawUpcomingExams = exams.filter(e => {
    if (e.status !== 'published') return false;
    if (!enrolledCourseIds.includes(e.course_id)) return false;
    if (e.start_date && new Date(e.start_date) > now) return true;
    return false;
  });
  const upcomingExams = filterExams(rawUpcomingExams);

  const pendingExams = availableExams;

  // Calculate stats
  const filteredExamsCount = availableExams.length + upcomingExams.length + historyExams.length;
  const submittedCount = rawCompletedExams.length;
  const gradedCount = completedExams.filter(e => {
    const sub = submissions.find(s => s.exam_id === e.id);
    return sub && sub.score !== null;
  }).length;

  const completionRate = filteredExamsCount > 0
    ? Math.round((submittedCount / filteredExamsCount) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  const renderExamCard = (exam: typeof exams[0], index: number) => {
    const course = courses.find(c => c.id === exam.course_id);
    const isCompleted = completedExamIds.includes(exam.id);
    const isMissed = !isCompleted && exam.end_date && new Date(exam.end_date) < now;
    const submission = submissions.find(s => s.exam_id === exam.id);

    return (
      <Card
        key={exam.id}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (isCompleted) navigate(`/student/exam/${exam.id}/results`);
        }}
        className={cn(
          "border-0 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isMissed && "opacity-75 bg-muted/30"
        )}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-secondary/10' : isMissed ? 'bg-destructive/10' : 'bg-primary/10'
                }`}>
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-secondary" />
                ) : isMissed ? (
                  <Clock className="w-6 h-6 text-destructive" />
                ) : (
                  <FileText className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{exam.title}</h3>
                  {isMissed && <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive font-medium">{t('exams.missing')}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{course?.title}</p>
                {exam.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{exam.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {exam.duration} {t('common.min')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {exam.total_points} {t('common.pts')}
                  </span>
                  {exam.end_date && (
                    <span className={cn("flex items-center gap-1", isMissed ? "text-destructive" : "text-destructive")}>
                      <Calendar className="w-4 h-4" />
                      {t('exams.dueBy')}: {format(new Date(exam.end_date), 'MMM d, h:mm a')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isCompleted && submission && (
                <div>
                  {submission.score !== null ? (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('assignments.graded')}: {submission.score}/{exam.total_points}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {t('assignments.submitted')}
                    </Badge>
                  )}
                </div>
              )}
              {isMissed && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('courses.status')}</p>
                  <p className="text-lg font-bold text-destructive">
                    {t('exams.missing')}
                  </p>
                </div>
              )}
              {isCompleted ? (
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/student/exam/${exam.id}/results`);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {t('exams.viewResults')}
                </Button>
              ) : !isMissed ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/student/exam/${exam.id}`);
                  }}
                >
                  {t('exams.takeExam')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  {t('exams.missing')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderUpcomingExamCard = (exam: typeof exams[0], index: number) => {
    const course = courses.find(c => c.id === exam.course_id);

    return (
      <Card
        key={exam.id}
        className="border-0 shadow-card opacity-75 animate-slide-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted">
                <Calendar className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{exam.title}</h3>
                <p className="text-sm text-muted-foreground">{course?.title}</p>
                {exam.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{exam.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {exam.duration} {t('common.min')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {exam.total_points} {t('common.pts')}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('exams.availableFrom')}</p>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(exam.start_date!), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('exams.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('exams.viewAndTakeExams')}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('exams.searchExams')}
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
            <CardDescription>{t('exams.totalExams')}</CardDescription>
            <CardTitle className="text-2xl">{filteredExamsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('assignments.submitted')}</CardDescription>
            <CardTitle className="text-2xl">{submittedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('assignments.graded')}</CardDescription>
            <CardTitle className="text-2xl">{gradedCount}</CardTitle>
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

      {availableExams.length === 0 && upcomingExams.length === 0 && completedExams.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('exams.noExams')}</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery || selectedCourse !== 'all'
                ? t('exams.noExamsMatchSearch')
                : t('exams.enrollToAccessExams')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">
              {t('exams.available')} ({pendingExams.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              {t('exams.upcoming')} ({upcomingExams.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              {t('exams.completed')} ({historyExams.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {pendingExams.length === 0 ? (
              <Card className="border-0 shadow-card">
                <CardContent className="py-8 text-center text-muted-foreground">
                  {t('exams.noAvailableExams')}
                </CardContent>
              </Card>
            ) : (
              pendingExams.map((exam, index) => renderExamCard(exam, index))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {historyExams.length === 0 ? (
              <Card className="border-0 shadow-card">
                <CardContent className="py-8 text-center text-muted-foreground">
                  {t('exams.noCompletedExams')}
                </CardContent>
              </Card>
            ) : (
              historyExams.map((exam, index) => renderExamCard(exam, index))
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingExams.length === 0 ? (
              <Card className="border-0 shadow-card">
                <CardContent className="py-8 text-center text-muted-foreground">
                  {t('exams.noUpcomingExams')}
                </CardContent>
              </Card>
            ) : (
              upcomingExams.map((exam, index) => renderUpcomingExamCard(exam, index))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default StudentExams;