import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Award, BookOpen, Target, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { demoStats } from '@/data/demoData';

// Sample student analytics data
const performanceHistory = [
  { name: 'Week 1', score: 65 },
  { name: 'Week 2', score: 72 },
  { name: 'Week 3', score: 68 },
  { name: 'Week 4', score: 78 },
  { name: 'Week 5', score: 82 },
  { name: 'Week 6', score: 85 },
];

const courseProgress = [
  { name: 'Mathematics', progress: 75, completed: 9, total: 12 },
  { name: 'Physics', progress: 60, completed: 6, total: 10 },
];

const recentGrades = [
  { title: 'Midterm Exam - Algebra', course: 'Mathematics', score: 85, maxScore: 100, date: '2024-02-15' },
  { title: 'Homework 1', course: 'Mathematics', score: 45, maxScore: 50, date: '2024-02-12' },
  { title: 'Quiz - Fractions', course: 'Mathematics', score: 42, maxScore: 50, date: '2024-02-08' },
  { title: 'Lab Report - Motion', course: 'Physics', score: 68, maxScore: 75, date: '2024-02-05' },
];

/**
 * Demo Student Analytics page.
 * 
 * Displays visual analytics for the student demo user, including:
 * - Key performance stats (Average Score, Enrolled Courses, etc.)
 * - Performance trend chart
 * - Course progress bars
 * - Recent grades list
 * 
 * Uses `recharts` for data visualization and static demo data.
 * 
 * @returns {JSX.Element} The rendered Student Analytics page.
 */
export default function DemoStudentAnalytics() {
  const stats = demoStats.student;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Analytics</h1>
        <p className="text-muted-foreground">Track your learning progress and performance</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageScore}</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
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
                <p className="text-2xl font-bold">{stats.enrolledCourses}</p>
                <p className="text-sm text-muted-foreground">Enrolled Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedItems}</p>
                <p className="text-sm text-muted-foreground">Completed Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingAssignments}</p>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-secondary" />
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {courseProgress.map((course) => (
              <div key={course.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{course.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {course.completed}/{course.total} completed
                  </span>
                </div>
                <Progress value={course.progress} className="h-3" />
                <p className="text-xs text-muted-foreground text-right">{course.progress}%</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Grades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Grades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentGrades.map((grade, index) => {
              const percentage = Math.round((grade.score / grade.maxScore) * 100);
              const isPassed = percentage >= 70;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{grade.title}</p>
                    <p className="text-sm text-muted-foreground">{grade.course}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant={isPassed ? 'default' : 'destructive'}>
                        {grade.score}/{grade.maxScore}
                      </Badge>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{grade.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
