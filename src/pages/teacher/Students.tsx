import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Loader2 } from 'lucide-react';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const TeacherStudents = () => {
  const { courses, isLoading: coursesLoading } = useTeacherCourses();
  const courseIds = courses.map(c => c.id);

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['teacher-enrollments', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, profiles:student_id(name, email)')
        .in('course_id', courseIds);
      
      if (error) throw error;
      return data;
    },
    enabled: !coursesLoading && courseIds.length > 0,
  });

  // Group students by unique student_id
  const studentsMap = new Map();
  enrollments.forEach((enrollment: any) => {
    if (!studentsMap.has(enrollment.student_id)) {
      studentsMap.set(enrollment.student_id, {
        id: enrollment.student_id,
        profile: enrollment.profiles,
        courses: [],
      });
    }
    const course = courses.find(c => c.id === enrollment.course_id);
    if (course) {
      studentsMap.get(enrollment.student_id).courses.push(course.title);
    }
  });

  const students = Array.from(studentsMap.values());

  if (coursesLoading || enrollmentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

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
              {students.map((student: any) => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {student.profile?.name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{student.profile?.name || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">{student.profile?.email || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Enrolled in:</p>
                    <div className="flex flex-wrap gap-1 justify-end mt-1">
                      {student.courses.map((course: string, i: number) => (
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
