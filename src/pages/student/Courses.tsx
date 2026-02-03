import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCourses } from '@/hooks/useCourses';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useExams } from '@/hooks/useExams';
import { useCourseMaterials } from '@/hooks/useCourseMaterials';
import { useExamSubmissions, useMaterialViews, useAllAssignmentSubmissions } from '@/hooks/useProgress';
import { useAllAssignmentsBasic } from '@/hooks/useAssignments';
import { BookOpen, Loader2, ArrowRight } from 'lucide-react';

/**
 * Student Courses page.
 * 
 * Displays list of enrolled courses with progress tracking.
 * Features:
 * - Card view of enrolled courses
 * - Progress bar visualization (exams + materials)
 * - Navigation to course details
 * 
 * @returns {JSX.Element} The rendered Courses page.
 */
const StudentCourses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { exams } = useExams();
  const { materials } = useCourseMaterials();
  const { data: submissions = [] } = useExamSubmissions();
  const { data: materialViews = [] } = useMaterialViews();
  const { data: allAssignments = [] } = useAllAssignmentsBasic();
  const { data: assignmentSubmissions = [] } = useAllAssignmentSubmissions();

  const isLoading = coursesLoading || enrollmentsLoading;

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));

  // Calculate progress for each course
  /**
   * Calculates overall course progress based on exams and materials.
   * @param {string} courseId - The ID of the course
   * @returns {number} Progress percentage (0-100)
   */
  const getCourseProgress = (courseId: string) => {
    const courseExams = exams.filter(e => e.course_id === courseId && e.status === 'published');
    const courseMaterials = materials.filter(m => m.course_id === courseId);
    const courseAssignments = allAssignments.filter(a => a.course_id === courseId);

    const completedExams = submissions.filter(s => courseExams.some(e => e.id === s.exam_id)).length;
    const viewedMaterials = materialViews.filter(v => courseMaterials.some(m => m.id === v.material_id)).length;
    const completedAssignments = courseAssignments.filter(a => assignmentSubmissions.includes(a.id)).length;

    const examProgress = courseExams.length > 0 ? (completedExams / courseExams.length) * 100 : 100;
    const materialProgress = courseMaterials.length > 0 ? (viewedMaterials / courseMaterials.length) * 100 : 100;
    const assignmentProgress = courseAssignments.length > 0 ? (completedAssignments / courseAssignments.length) * 100 : 100;

    // Calculate overall progress as average of components that have items
    let components = 0;
    let totalProgress = 0;

    if (courseExams.length > 0) {
      components++;
      totalProgress += examProgress;
    }
    if (courseMaterials.length > 0) {
      components++;
      totalProgress += materialProgress;
    }
    if (courseAssignments.length > 0) {
      components++;
      totalProgress += assignmentProgress;
    }

    return components > 0 ? Math.round(totalProgress / components) : 0;
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('courses.myCourses')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('courses.viewEnrolledCourses')}
        </p>
      </div>

      {enrolledCourses.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('courses.noCoursesYet')}</h3>
            <p className="text-muted-foreground text-center">
              {t('courses.exploreAndEnroll')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course, index) => {
            const progress = getCourseProgress(course.id);
            return (
              <Card
                key={course.id}
                className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up overflow-hidden cursor-pointer group"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/student/courses/${course.id}`)}
              >
                <div className="h-32 bg-gradient-hero flex items-center justify-center overflow-hidden relative">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-primary-foreground/50" />
                  )}
                  {/* Progress Badge */}
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-foreground">
                    {progress}% {t('courses.complete')}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{t('courses.enrolled')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description || t('courses.noDescriptionAvailable')}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t('dashboard.progress')}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {t('courses.viewDetails')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentCourses;
