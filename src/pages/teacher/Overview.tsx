import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockCourses, mockExams, mockEnrollments } from '@/data/mockData';
import { BookOpen, Users, FileText, TrendingUp } from 'lucide-react';

const TeacherOverview = () => {
  const { user } = useAuth();
  
  const teacherCourses = mockCourses.filter(c => c.teacherId === user?.id);
  const teacherExams = mockExams.filter(e => 
    teacherCourses.some(c => c.id === e.courseId)
  );
  const totalEnrollments = teacherCourses.reduce((sum, c) => sum + c.enrolledCount, 0);
  const publishedCourses = teacherCourses.filter(c => c.status === 'published').length;

  const stats = [
    { 
      label: 'Total Courses', 
      value: teacherCourses.length, 
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
      label: 'Total Students', 
      value: totalEnrollments, 
      icon: Users,
      color: 'bg-muted text-muted-foreground' 
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0] || 'Teacher'}!
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
            {teacherCourses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                You haven't created any courses yet.
              </p>
            ) : (
              teacherCourses.map((course) => (
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
                        {course.enrolledCount} students • {course.examCount} exams
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherOverview;
