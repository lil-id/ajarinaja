import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/useCourses';
import { useEnrollments } from '@/hooks/useEnrollments';
import { BookOpen, FileText, Loader2, ArrowRight } from 'lucide-react';

const StudentCourses = () => {
  const navigate = useNavigate();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();

  const isLoading = coursesLoading || enrollmentsLoading;

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));

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
        <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
        <p className="text-muted-foreground mt-1">
          View your enrolled courses
        </p>
      </div>

      {enrolledCourses.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No courses yet</h3>
            <p className="text-muted-foreground text-center">
              Explore and enroll in courses from the dashboard
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course, index) => (
            <Card 
              key={course.id}
              className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up overflow-hidden cursor-pointer group"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(`/student/courses/${course.id}`)}
            >
              <div className="h-32 bg-gradient-hero flex items-center justify-center overflow-hidden">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <BookOpen className="w-12 h-12 text-primary-foreground/50" />
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>Enrolled</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {course.description || 'No description available'}
                </p>
                <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  View Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCourses;
