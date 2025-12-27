import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockCourses, mockEnrollments, mockExams } from '@/data/mockData';
import { Enrollment } from '@/types';
import { BookOpen, FileText, Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>(
    mockEnrollments.filter(e => e.studentId === user?.id)
  );
  
  const enrolledCourseIds = enrollments.map(e => e.courseId);
  const enrolledCourses = mockCourses.filter(c => enrolledCourseIds.includes(c.id));
  const availableCourses = mockCourses.filter(
    c => c.status === 'published' && !enrolledCourseIds.includes(c.id)
  );
  
  const upcomingExams = mockExams.filter(
    e => e.status === 'published' && enrolledCourseIds.includes(e.courseId)
  );

  const handleEnroll = (courseId: string) => {
    const newEnrollment: Enrollment = {
      id: String(Date.now()),
      studentId: user?.id || '3',
      courseId,
      enrolledAt: new Date().toISOString().split('T')[0],
    };
    setEnrollments([...enrollments, newEnrollment]);
    toast.success('Successfully enrolled in course!');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Hello, {user?.name?.split(' ')[0] || 'Student'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your learning dashboard
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-6 text-center">
            <BookOpen className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{enrolledCourses.length}</p>
            <p className="text-sm text-muted-foreground">Enrolled Courses</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{upcomingExams.length}</p>
            <p className="text-sm text-muted-foreground">Available Exams</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>Available Exams</CardTitle>
            <CardDescription>Take your course exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingExams.slice(0, 3).map((exam) => {
                const course = mockCourses.find(c => c.id === exam.courseId);
                return (
                  <div 
                    key={exam.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">{exam.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {course?.title} • {exam.duration} min • {exam.totalPoints} pts
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/student/exam/${exam.id}`)}
                    >
                      Take Exam
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Courses to Enroll */}
      {availableCourses.length > 0 && (
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>Discover Courses</CardTitle>
            <CardDescription>Enroll in new courses from our teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {availableCourses.map((course) => (
                <div 
                  key={course.id}
                  className="p-4 rounded-xl border border-border hover:border-secondary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        by {course.teacherName}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {course.description}
                      </p>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleEnroll(course.id)}
                      >
                        Enroll Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentDashboard;
