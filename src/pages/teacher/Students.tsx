import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockEnrollments, mockCourses, mockUsers } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, BookOpen } from 'lucide-react';

const TeacherStudents = () => {
  const { user } = useAuth();
  const teacherCourses = mockCourses.filter(c => c.teacherId === user?.id);
  
  // Get all students enrolled in teacher's courses
  const enrollments = mockEnrollments.filter(e => 
    teacherCourses.some(c => c.id === e.courseId)
  );
  
  const studentIds = [...new Set(enrollments.map(e => e.studentId))];
  const students = mockUsers.filter(u => studentIds.includes(u.id));

  const getStudentCourses = (studentId: string) => {
    const studentEnrollments = enrollments.filter(e => e.studentId === studentId);
    return studentEnrollments.map(e => 
      teacherCourses.find(c => c.id === e.courseId)?.title
    ).filter(Boolean);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Students</h1>
        <p className="text-muted-foreground mt-1">
          View students enrolled in your courses
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{students.length}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{enrollments.length}</p>
                <p className="text-sm text-muted-foreground">Enrollments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No students enrolled yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Enrolled in:</p>
                    <div className="flex flex-wrap gap-1 justify-end mt-1">
                      {getStudentCourses(student.id).map((course, i) => (
                        <span 
                          key={i}
                          className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherStudents;
