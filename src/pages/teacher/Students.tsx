import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BookOpen, Loader2, AlertTriangle, AlertCircle, Info, TrendingDown, ClipboardList, FileText } from 'lucide-react';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAtRiskStudents, RiskFactor } from '@/hooks/useAtRiskStudents';
import { cn } from '@/lib/utils';

const getRiskIcon = (type: RiskFactor['type']) => {
  switch (type) {
    case 'no_material_views':
      return BookOpen;
    case 'missed_deadline':
      return ClipboardList;
    case 'low_score':
      return TrendingDown;
    case 'no_exam_submissions':
      return FileText;
    default:
      return Info;
  }
};

const getRiskLabel = (type: RiskFactor['type']) => {
  switch (type) {
    case 'no_material_views':
      return 'Low Engagement';
    case 'missed_deadline':
      return 'Missed Deadline';
    case 'low_score':
      return 'Below KKM';
    case 'no_exam_submissions':
      return 'Missing Exams';
    default:
      return 'Risk Factor';
  }
};

const TeacherStudents = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { courses, isLoading: coursesLoading } = useTeacherCourses();
  const courseIds = courses.map(c => c.id);
  
  const { atRiskStudents, isLoading: atRiskLoading, highRiskCount, mediumRiskCount, lowRiskCount } = useAtRiskStudents();

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['teacher-enrollments', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .in('course_id', courseIds);
      
      if (enrollmentError) throw enrollmentError;
      if (!enrollmentData || enrollmentData.length === 0) return [];
      
      const studentIds = [...new Set(enrollmentData.map(e => e.student_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', studentIds);
      
      if (profilesError) throw profilesError;
      
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      return enrollmentData.map(enrollment => ({
        ...enrollment,
        profiles: profilesMap.get(enrollment.student_id) || null
      }));
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
  
  // Get at-risk student IDs for marking
  const atRiskStudentIds = new Set(atRiskStudents.map(s => s.studentId));

  const isLoading = coursesLoading || enrollmentsLoading || atRiskLoading;

  if (isLoading) {
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
          View and monitor students enrolled in your courses
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{highRiskCount}</p>
              <p className="text-sm text-muted-foreground">High Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{mediumRiskCount}</p>
              <p className="text-sm text-muted-foreground">Medium Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{lowRiskCount}</p>
              <p className="text-sm text-muted-foreground">Low Risk</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for All Students vs At-Risk */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Students ({students.length})</TabsTrigger>
          <TabsTrigger value="at-risk">At-Risk ({atRiskStudents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Enrolled Courses</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student: any) => {
                        const isAtRisk = atRiskStudentIds.has(student.id);
                        const studentRisk = atRiskStudents.find(s => s.studentId === student.id);
                        
                        return (
                          <tr 
                            key={student.id}
                            className={cn(
                              "border-b border-border/50 hover:bg-muted/50 transition-colors",
                              isAtRisk && studentRisk?.riskLevel === 'high' && 'bg-destructive/5',
                              isAtRisk && studentRisk?.riskLevel === 'medium' && 'bg-orange-50 dark:bg-orange-950/10',
                              isAtRisk && studentRisk?.riskLevel === 'low' && 'bg-yellow-50 dark:bg-yellow-950/10'
                            )}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className={cn(
                                    "text-sm",
                                    isAtRisk && studentRisk?.riskLevel === 'high' && 'bg-destructive/20 text-destructive',
                                    isAtRisk && studentRisk?.riskLevel === 'medium' && 'bg-orange-500/20 text-orange-600',
                                    isAtRisk && studentRisk?.riskLevel === 'low' && 'bg-yellow-500/20 text-yellow-600',
                                    !isAtRisk && 'bg-secondary/20 text-secondary'
                                  )}>
                                    {student.profile?.name?.charAt(0) || 'S'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">
                                  {student.profile?.name || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {student.profile?.email || '-'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-md">
                                {student.courses.slice(0, 3).map((course: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {course}
                                  </Badge>
                                ))}
                                {student.courses.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{student.courses.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isAtRisk ? (
                                <Badge
                                  variant={studentRisk?.riskLevel === 'high' ? 'destructive' : 'outline'}
                                  className={cn(
                                    'text-xs',
                                    studentRisk?.riskLevel === 'medium' && 'border-orange-500 text-orange-600',
                                    studentRisk?.riskLevel === 'low' && 'border-yellow-500 text-yellow-600'
                                  )}
                                >
                                  {studentRisk?.riskLevel} risk
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                                  On Track
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="at-risk" className="mt-6">
          {atRiskStudents.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">All Students On Track</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Great news! No students are currently showing risk factors based on KKM thresholds.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Students Requiring Attention</CardTitle>
                <CardDescription>
                  {atRiskStudents.length} student{atRiskStudents.length !== 1 ? 's' : ''} flagged based on KKM thresholds and engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {atRiskStudents.map((student) => (
                    <div
                      key={`${student.studentId}-${student.courseId}`}
                      className={cn(
                        'p-4 rounded-xl border transition-colors',
                        student.riskLevel === 'high' && 'border-destructive/50 bg-destructive/5',
                        student.riskLevel === 'medium' && 'border-orange-500/50 bg-orange-50 dark:bg-orange-950/10',
                        student.riskLevel === 'low' && 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/10'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className={cn(
                            student.riskLevel === 'high' && 'bg-destructive/20 text-destructive',
                            student.riskLevel === 'medium' && 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
                            student.riskLevel === 'low' && 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                          )}>
                            {student.studentName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground">{student.studentName}</h3>
                            <Badge
                              variant={student.riskLevel === 'high' ? 'destructive' : 'outline'}
                              className={cn(
                                'w-fit',
                                student.riskLevel === 'medium' && 'border-orange-500 text-orange-600 dark:text-orange-400',
                                student.riskLevel === 'low' && 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                              )}
                            >
                              {student.riskLevel.charAt(0).toUpperCase() + student.riskLevel.slice(1)} Risk
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                          <p className="text-sm text-muted-foreground mb-3">Course: {student.courseName}</p>
                          
                          {/* Risk Factors */}
                          <div className="flex flex-wrap gap-2">
                            {student.riskFactors.map((factor, index) => {
                              const Icon = getRiskIcon(factor.type);
                              return (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border text-sm"
                                >
                                  <Icon className={cn(
                                    'w-4 h-4',
                                    factor.severity === 'high' && 'text-destructive',
                                    factor.severity === 'medium' && 'text-orange-600 dark:text-orange-400',
                                    factor.severity === 'low' && 'text-yellow-600 dark:text-yellow-400'
                                  )} />
                                  <span className="text-muted-foreground">{factor.description}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherStudents;
