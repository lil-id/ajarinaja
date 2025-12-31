import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useExams } from '@/hooks/useExams';
import { useSubmissions } from '@/hooks/useSubmissions';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Users, Award, Target, BookOpen, 
  CheckCircle, XCircle, Loader2, BarChart3, PieChartIcon,
  Download, FileText, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

const CHART_COLORS = ['hsl(var(--secondary))', 'hsl(var(--primary))', '#f59e0b', '#ef4444', '#8b5cf6'];

const TeacherAnalytics = () => {
  const navigate = useNavigate();

  const { courses, isLoading: coursesLoading } = useTeacherCourses();
  const { exams, isLoading: examsLoading } = useExams();
  const { submissions, isLoading: submissionsLoading } = useSubmissions();
  
  // Default to first course instead of 'all'
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');

  const isLoading = coursesLoading || examsLoading || submissionsLoading;

  // Set default course when courses load
  if (courses.length > 0 && !selectedCourse) {
    setSelectedCourse(courses[0].id);
  }

  // Filter data based on selections
  const teacherCourseIds = courses.map(c => c.id);
  const teacherExams = exams.filter(e => teacherCourseIds.includes(e.course_id));
  
  const filteredExams = selectedCourse 
    ? teacherExams.filter(e => e.course_id === selectedCourse)
    : teacherExams;

  const examIds = filteredExams.map(e => e.id);
  const filteredSubmissions = submissions.filter(s => examIds.includes(s.exam_id));
  const gradedSubmissions = filteredSubmissions.filter(s => s.graded && s.score !== null);

  // Calculate overall statistics using actual values
  const totalStudents = new Set(filteredSubmissions.map(s => s.student_id)).size;
  const totalSubmissions = filteredSubmissions.length;
  
  // Calculate average score using actual points
  const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
  const avgScore = gradedSubmissions.length > 0 ? Math.round(totalScore / gradedSubmissions.length) : 0;

  // Get KKM from selected course exams (use first exam's KKM or default 60)
  const courseKKM = (filteredExams[0] as any)?.kkm || 60;

  // Calculate pass rate based on KKM
  const passCount = gradedSubmissions.filter(s => {
    const exam = teacherExams.find(e => e.id === s.exam_id);
    if (!exam) return false;
    const examKKM = (exam as any).kkm || 60;
    const percentage = ((s.score || 0) / exam.total_points) * 100;
    return percentage >= examKKM;
  }).length;
  const passRate = gradedSubmissions.length > 0 
    ? Math.round((passCount / gradedSubmissions.length) * 100) 
    : 0;

  // Score distribution using actual score ranges (histogram)
  const scoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0, label: 'F' },
    { range: '21-40', min: 21, max: 40, count: 0, label: 'D' },
    { range: '41-60', min: 41, max: 60, count: 0, label: 'C' },
    { range: '61-80', min: 61, max: 80, count: 0, label: 'B' },
    { range: '81-100', min: 81, max: 100, count: 0, label: 'A' },
  ];

  gradedSubmissions.forEach(s => {
    const score = s.score || 0;
    const range = scoreRanges.find(r => score >= r.min && score <= r.max);
    if (range) range.count++;
  });

  // Submission status breakdown (pie chart)
  const submissionStatus = [
    { name: 'Graded', value: gradedSubmissions.length, color: CHART_COLORS[0] },
    { name: 'Pending', value: filteredSubmissions.length - gradedSubmissions.length, color: CHART_COLORS[3] },
  ].filter(s => s.value > 0);

  // Exam performance with actual scores and student count distribution
  const examPerformance = filteredExams.map(exam => {
    const examSubmissions = gradedSubmissions.filter(s => s.exam_id === exam.id);
    const examKKM = (exam as any).kkm || 60;
    const totalExamScore = examSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgExamScore = examSubmissions.length > 0 ? Math.round(totalExamScore / examSubmissions.length) : 0;
    const passedCount = examSubmissions.filter(s => {
      const percentage = ((s.score || 0) / exam.total_points) * 100;
      return percentage >= examKKM;
    }).length;
    
    return {
      examId: exam.id,
      name: exam.title.length > 20 ? exam.title.substring(0, 20) + '...' : exam.title,
      fullName: exam.title,
      submissions: examSubmissions.length,
      avgScore: avgExamScore,
      totalPoints: exam.total_points,
      kkm: examKKM,
      passedCount,
      failedCount: examSubmissions.length - passedCount,
    };
  }).filter(e => e.submissions > 0);

  // Export handlers
  const handleExportCSV = () => {
    const courseName = selectedCourse 
      ? courses.find(c => c.id === selectedCourse)?.title
      : 'All Courses';
    
    exportToCSV({
      totalStudents,
      totalSubmissions,
      avgScore,
      passRate,
      scoreRanges,
      examPerformance,
      courseName,
      exportDate: new Date().toLocaleDateString(),
    }, `analytics-report-${new Date().toISOString().split('T')[0]}`);
    
    toast.success('CSV report downloaded');
  };

  const handleExportPDF = () => {
    const courseName = selectedCourse 
      ? courses.find(c => c.id === selectedCourse)?.title
      : undefined;
    
    exportToPDF({
      totalStudents,
      totalSubmissions,
      avgScore,
      passRate,
      scoreRanges,
      examPerformance,
      courseName,
      exportDate: new Date().toLocaleDateString(),
    }, `analytics-report-${new Date().toISOString().split('T')[0]}`);
    
    toast.success('PDF report downloaded');
  };

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
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!selectedCourse ? (
        <Card className="border-0 shadow-card">
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Select a Course</h3>
            <p className="text-muted-foreground">Choose a course to view its analytics</p>
          </CardContent>
        </Card>
      ) : (
        <>
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
                    <p className="text-sm text-muted-foreground">Pass Rate (KKM: {courseKKM})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row - Exam Performance and Submission Status */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Exam Performance Comparison */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-secondary" />
                  <CardTitle className="text-lg">Exam Performance Comparison</CardTitle>
                </div>
                <CardDescription>Average scores across exams</CardDescription>
              </CardHeader>
              <CardContent>
                {examPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={examPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        label={{ value: 'Avg Score', angle: -90, position: 'insideLeft' }}
                        allowDecimals={false}
                        tickFormatter={(value) => Math.floor(value).toString()}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'avgScore') return [`${value} pts`, 'Avg Score'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => {
                          const exam = examPerformance.find(e => e.name === label);
                          return exam?.fullName || label;
                        }}
                      />
                      <Bar 
                        dataKey="avgScore" 
                        fill="hsl(var(--secondary))" 
                        radius={[4, 4, 0, 0]}
                        name="avgScore"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No exam data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submission Status Pie */}
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

          {/* Detailed Exam Stats Table with actual values */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Exam Details</CardTitle>
              <CardDescription>Average scores and student distribution per exam</CardDescription>
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
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Max Points</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">KKM</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Passed</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Failed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examPerformance.map((exam, idx) => (
                        <tr
                          key={idx}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/teacher/exams/${exam.examId}/grade`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/teacher/exams/${exam.examId}/grade`);
                            }
                          }}
                          className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                          title="Open grading"
                        >
                          <td className="py-3 px-4">
                            <p className="font-medium text-foreground">{exam.fullName}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline">{exam.submissions}</Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-foreground">{exam.avgScore} pts</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-muted-foreground">{exam.totalPoints} pts</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="secondary">{exam.kkm}%</Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {exam.passedCount}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {exam.failedCount > 0 ? (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                <XCircle className="w-3 h-3 mr-1" />
                                {exam.failedCount}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
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
        </>
      )}
    </div>
  );
};

export default TeacherAnalytics;
