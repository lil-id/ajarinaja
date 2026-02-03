import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/useCourses';
import { useEnrollments } from '@/hooks/useEnrollments';
import { BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function StudentEnrolledCoursesWidget() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { courses, isLoading: coursesLoading } = useCourses();
    const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();

    const isLoading = coursesLoading || enrollmentsLoading;

    if (isLoading) {
        return (
            <Card className="border-0 shadow-card">
                <CardHeader>
                    <CardTitle className="text-lg">{t('dashboard.enrolledCourses')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const enrolledCourseIds = enrollments.map(e => e.course_id);
    const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));

    return (
        <Card className="border-0 shadow-card">
            <CardHeader>
                <CardTitle>{t('dashboard.enrolledCourses')}</CardTitle>
                <CardDescription>{t('dashboard.continueProgress')}</CardDescription>
            </CardHeader>
            <CardContent>
                {enrolledCourses.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">{t('dashboard.noEnrolledCourses')}</p>
                        <Button onClick={() => navigate('/student/courses')}>
                            {t('dashboard.findCourses')}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {enrolledCourses.map((course) => (
                            <div
                                key={course.id}
                                className="group flex flex-col justify-between p-4 rounded-xl bg-card border hover:shadow-md transition-all cursor-pointer"
                                onClick={() => navigate(`/student/courses/${course.id}`)}
                            >
                                <div>
                                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {course.description}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <BookOpen className="w-4 h-4 mr-1" />
                                        <span>{t('courses.viewDetails')}</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
