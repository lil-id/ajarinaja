import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, ClipboardCheck, Award, Calendar, TrendingUp } from 'lucide-react';
import { demoStats, demoCourses, demoExams, demoAssignments } from '@/data/demoData';
import { format } from 'date-fns';

export default function DemoStudentDashboard() {
  const stats = demoStats.student;
  const enrolledCourses = demoCourses.filter(c => c.status === 'published').slice(0, 2);
  const upcomingAssignments = demoAssignments.filter(a => a.status === 'published').slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, Demo Student!</h1>
        <p className="text-muted-foreground">Track your progress and stay on top of your studies</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrolledCourses}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingExams}</div>
            <p className="text-xs text-muted-foreground">Scheduled this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">Need submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Across all exams</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>My Courses</CardTitle>
            </div>
            <CardDescription>Your enrolled courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <h4 className="font-medium">{course.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{course.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{course.exam_count} exams</Badge>
                    <Badge variant="secondary">{course.assignment_count} assignments</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Upcoming Deadlines</CardTitle>
            </div>
            <CardDescription>Assignments due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">{assignment.course_title}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{assignment.max_points} pts</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due {format(new Date(assignment.due_date), 'MMM d')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Exams */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Available Exams</CardTitle>
          </div>
          <CardDescription>Exams you can take</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {demoExams.filter(e => e.status === 'published').map((exam) => (
              <div key={exam.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{exam.title}</h4>
                  <Badge>{exam.duration} min</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{exam.course_title}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{exam.total_points} points</span>
                  <span>•</span>
                  <span>KKM: {exam.kkm}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>Your Achievements</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-medium text-sm">Perfect Score</p>
                <p className="text-xs text-muted-foreground">2 times</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-medium text-sm">Early Bird</p>
                <p className="text-xs text-muted-foreground">5 submissions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
              <span className="text-2xl">📚</span>
              <div>
                <p className="font-medium text-sm">Quick Learner</p>
                <p className="text-xs text-muted-foreground">All materials read</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
