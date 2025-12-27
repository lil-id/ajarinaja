import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useExams, useExamWithQuestions, Question } from '@/hooks/useExams';
import { useSubmissions } from '@/hooks/useSubmissions';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, Award, Target, BookOpen, 
  CheckCircle, XCircle, Loader2, BarChart3, PieChartIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['hsl(var(--secondary))', 'hsl(var(--primary))', '#f59e0b', '#ef4444', '#8b5cf6'];

const TeacherAnalytics = () => {
  const { courses, isLoading: coursesLoading } = useTeacherCourses();
  const { exams, isLoading: examsLoading } = useExams();
  const { submissions, isLoading: submissionsLoading } = useSubmissions();
  
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedExam, setSelectedExam] = useState<string>('');

  const isLoading = coursesLoading || examsLoading || submissionsLoading;

  // Filter data based on selections
  const teacherCourseIds = courses.map(c => c.id);
  const teacherExams = exams.filter(e => teacherCourseIds.includes(e.course_id));
  
  const filteredExams = selectedCourse === 'all' 
    ? teacherExams 
    : teacherExams.filter(e => e.course_id === selectedCourse);

  const examIds = filteredExams.map(e => e.id);
  const filteredSubmissions = submissions.filter(s => examIds.includes(s.exam_id));
  const gradedSubmissions = filteredSubmissions.filter(s => s.graded && s.score !== null);

  // Calculate overall statistics
  const totalStudents = new Set(filteredSubmissions.map(s => s.student_id)).size;
  const totalSubmissions = filteredSubmissions.length;
  const avgScore = gradedSubmissions.length > 0
    ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length)
    : 0;

  // Calculate pass rate (assuming 60% is passing)
  const passCount = gradedSubmissions.filter(s => {
    const exam = teacherExams.find(e => e.id === s.exam_id);
    if (!exam) return false;
    return ((s.score || 0) / exam.total_points) >= 0.6;
  }).length;
  const passRate = gradedSubmissions.length > 0 
    ? Math.round((passCount / gradedSubmissions.length) * 100) 
    : 0;

  // Score distribution data
  const scoreRanges = [
    { range: '0-59%', min: 0, max: 59, count: 0, label: 'Failing' },
    { range: '60-69%', min: 60, max: 69, count: 0, label: 'D' },
    { range: '70-79%', min: 70, max: 79, count: 0, label: 'C' },
    { range: '80-89%', min: 80, max: 89, count: 0, label: 'B' },
    { range: '90-100%', min: 90, max: 100, count: 0, label: 'A' },
  ];

  gradedSubmissions.forEach(s => {
    const exam = teacherExams.find(e => e.id === s.exam_id);
    if (!exam || exam.total_points === 0) return;
    const percentage = Math.round(((s.score || 0) / exam.total_points) * 100);
    const range = scoreRanges.find(r => percentage >= r.min && percentage <= r.max);
    if (range) range.count++;
  });

  // Exam performance comparison
  const examPerformance = filteredExams.map(exam => {
    const examSubmissions = gradedSubmissions.filter(s => s.exam_id === exam.id);
    const avgExamScore = examSubmissions.length > 0
      ? Math.round(examSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / examSubmissions.length)
      : 0;
    const avgPercentage = exam.total_points > 0 
      ? Math.round((avgExamScore / exam.total_points) * 100) 
      : 0;
    
    return {
      name: exam.title.length > 20 ? exam.title.substring(0, 20) + '...' : exam.title,
      fullName: exam.title,
      submissions: examSubmissions.length,
      avgScore: avgPercentage,
      totalPoints: exam.total_points,
    };
  }).filter(e => e.submissions > 0);

  // Submission status breakdown
  const submissionStatus = [
    { name: 'Graded', value: gradedSubmissions.length, color: CHART_COLORS[0] },
    { name: 'Pending', value: filteredSubmissions.length - gradedSubmissions.length, color: CHART_COLORS[3] },
  ].filter(s => s.value > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track student performance and exam statistics
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
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
                <p className="text-2xl font-bold text-foreground">{totalSubmissions}</p>
                <p className="text-sm text-muted-foreground">Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgScore}</p>
                <p className="text-sm text-muted-foreground">Avg Score (pts)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{passRate}%</p>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              <CardTitle className="text-lg">Score Distribution</CardTitle>
            </div>
            <CardDescription>Grade breakdown across all exams</CardDescription>
          </CardHeader>
          <CardContent>
            {gradedSubmissions.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreRanges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--secondary))" 
                    radius={[4, 4, 0, 0]}
                    name="Students"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No graded submissions yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Status */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Submission Status</CardTitle>
            </div>
            <CardDescription>Graded vs pending submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSubmissions.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={submissionStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {submissionStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No submissions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exam Performance Comparison */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            <CardTitle className="text-lg">Exam Performance Comparison</CardTitle>
          </div>
          <CardDescription>Average score percentage by exam</CardDescription>
        </CardHeader>
        <CardContent>
          {examPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={examPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Avg Score']}
                />
                <Area 
                  type="monotone" 
                  dataKey="avgScore" 
                  stroke="hsl(var(--secondary))" 
                  fill="hsl(var(--secondary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name="Average Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No exam data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Exam Stats Table */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Exam Details</CardTitle>
          <CardDescription>Detailed statistics for each exam</CardDescription>
        </CardHeader>
        <CardContent>
          {examPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Exam</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Submissions</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Avg Score</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {examPerformance.map((exam, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{exam.fullName}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline">{exam.submissions}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-foreground">{exam.avgScore}%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {exam.avgScore >= 80 ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Excellent
                            </Badge>
                          ) : exam.avgScore >= 60 ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                              Good
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                              <XCircle className="w-3 h-3 mr-1" />
                              Needs Review
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No exam data available. Create exams and collect submissions to see analytics.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAnalytics;
