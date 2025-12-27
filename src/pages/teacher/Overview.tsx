import { useAuth } from '@/contexts/AuthContext';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useExams } from '@/hooks/useExams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, FileText, TrendingUp, Loader2 } from 'lucide-react';

const TeacherOverview = () => {
  const { profile } = useAuth();
  const { courses, isLoading: coursesLoading } = useTeacherCourses();
  const { exams, isLoading: examsLoading } = useExams();

  const isLoading = coursesLoading || examsLoading;

  // Filter exams to only show those for teacher's courses
  const teacherCourseIds = courses.map(c => c.id);
  const teacherExams = exams.filter(e => teacherCourseIds.includes(e.course_id));
  
  const publishedCourses = courses.filter(c => c.status === 'published').length;

  const stats = [
    { 
      label: 'Total Courses', 
      value: courses.length, 
      icon: BookOpen,
      color: 'bg-primary/10 text-primary' 
    },
    { 
      label: 'Published', 
      value: publishedCourses, 
      icon: TrendingUp,
      color: 'bg-secondary/10 text-secondary' 
    },
    { 
      label: 'Total Exams', 
      value: teacherExams.length, 
      icon: FileText,
      color: 'bg-accent/20 text-accent-foreground' 
    },
    { 
      label: 'Draft Courses', 
      value: courses.length - publishedCourses, 
      icon: Users,
      color: 'bg-muted text-muted-foreground' 
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
          Welcome back, {profile?.name?.split(' ')[0] || 'Teacher'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your courses today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card 
            key={stat.label} 
            className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
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

      {/* Recent Courses */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">Your Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                You haven't created any courses yet. Go to Courses to create your first one!
              </p>
            ) : (
              courses.slice(0, 5).map((course) => {
                const courseExams = teacherExams.filter(e => e.course_id === course.id);
                return (
                  <div 
                    key={course.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{course.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {courseExams.length} exams
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      course.status === 'published' 
                        ? 'bg-secondary/10 text-secondary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {course.status}
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
