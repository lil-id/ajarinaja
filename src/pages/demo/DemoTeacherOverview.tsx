import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, FileText, ClipboardCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { demoStats, demoCourses, demoExams, demoAssignments, demoStudents } from '@/data/demoData';

/**
 * Demo Teacher Overview page.
 * 
 * The main dashboard for the teacher demo.
 * Displays:
 * - Aggregate statistics (Students, Courses, Exams)
 * - At-risk students alerts
 * - Recent activity and course list
 * 
 * @returns {JSX.Element} The rendered Teacher Overview page.
 */
export default function DemoTeacherOverview() {
  const stats = demoStats.teacher;
  const atRiskStudents = demoStudents.filter(s => s.status === 'at-risk');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, Demo Teacher!</h1>
        <p className="text-muted-foreground">Here's what's happening in your courses</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">{demoCourses.filter(c => c.status === 'published').length} published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeExams}</div>
            <p className="text-xs text-muted-foreground">Ready to take</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">Need grading</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* At-Risk Students */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>At-Risk Students</CardTitle>
            </div>
            <CardDescription>Students needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No at-risk students</p>
            ) : (
              <div className="space-y-3">
                {atRiskStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                    <Badge variant="destructive">{student.risk_reason}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Your Courses</CardTitle>
            </div>
            <CardDescription>Quick overview of your courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-sm text-muted-foreground">{course.enrolled_count} students</p>
                  </div>
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Recent Exams & Assignments</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Exams</h4>
              <div className="space-y-2">
                {demoExams.slice(0, 3).map((exam) => (
                  <div key={exam.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{exam.title}</p>
                      <Badge variant={exam.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                        {exam.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{exam.course_title}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Assignments</h4>
              <div className="space-y-2">
                {demoAssignments.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{assignment.title}</p>
                      <Badge variant={assignment.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                        {assignment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{assignment.course_title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
