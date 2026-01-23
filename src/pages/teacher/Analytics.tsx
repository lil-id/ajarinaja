import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useExams } from '@/hooks/useExams';
import { useSubmissions } from '@/hooks/useSubmissions';
import { useAssignments } from '@/hooks/useAssignments';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, Users, Award, Target, BookOpen,
  CheckCircle, XCircle, Loader2, BarChart3, PieChartIcon,
  Download, FileText, FileSpreadsheet, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const CHART_COLORS = ['hsl(var(--secondary))', 'hsl(var(--primary))', '#f59e0b', '#ef4444', '#8b5cf6'];

/**
 * Teacher Analytics page.
 * 
 * Provides comprehensive analytics for teacher's courses.
 * Features:
 * - Stats overview (Total students, submissions, avg score, pass rate)
 * - Performance charts (Bar chart for scores, Pie chart for status)
 * - Detailed table data for exams and assignments
 * - Export functionality (CSV, PDF)
 * 
 * @returns {JSX.Element} The rendered Analytics page.
 */
const TeacherAnalytics = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { courses, isLoading: coursesLoading } = useTeacherCourses();
  const { exams, isLoading: examsLoading } = useExams();
  const { submissions: examSubmissions, isLoading: examSubmissionsLoading } = useSubmissions();
  const { data: allAssignments = [], isLoading: assignmentsLoading } = useAssignments();

  // Fetch assignment submissions
  const { data: assignmentSubmissions = [], isLoading: assignmentSubmissionsLoading } = useQuery({
    queryKey: ['all-assignment-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: questionSubmissions = [], isLoading: questionSubmissionsLoading } = useQuery({
    queryKey: ['all-question-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_question_submissions')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  // Default to first course instead of 'all'
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [analyticsType, setAnalyticsType] = useState<string>('exams');

  const isLoading = coursesLoading || examsLoading || examSubmissionsLoading ||
    assignmentsLoading || assignmentSubmissionsLoading || questionSubmissionsLoading;

  // Set default course when courses load
  if (courses.length > 0 && !selectedCourse) {
    setSelectedCourse(courses[0].id);
  }

  // Filter data based on selections
  const teacherCourseIds = courses.map(c => c.id);
  const teacherExams = exams.filter(e => teacherCourseIds.includes(e.course_id));
  const teacherAssignments = allAssignments.filter(a => teacherCourseIds.includes(a.course_id));

  const filteredExams = selectedCourse
    ? teacherExams.filter(e => e.course_id === selectedCourse)
    : teacherExams;

  const filteredAssignments = selectedCourse
    ? teacherAssignments.filter(a => a.course_id === selectedCourse)
    : teacherAssignments;

  // Exam analytics calculations
  const examIds = filteredExams.map(e => e.id);
  const filteredExamSubmissions = examSubmissions.filter(s => examIds.includes(s.exam_id));
  const gradedExamSubmissions = filteredExamSubmissions.filter(s => s.graded && s.score !== null);

  const examTotalStudents = new Set(filteredExamSubmissions.map(s => s.student_id)).size;
  const examTotalSubmissions = filteredExamSubmissions.length;
  const examTotalScore = gradedExamSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
  const examAvgScore = gradedExamSubmissions.length > 0 ? Math.round(examTotalScore / gradedExamSubmissions.length) : 0;
  const examKKM = (filteredExams[0] as any)?.kkm || 60;

  // KKM is an integer threshold - student passes if score >= kkm directly
  const examPassCount = gradedExamSubmissions.filter(s => {
    const exam = teacherExams.find(e => e.id === s.exam_id);
    if (!exam) return false;
    const kkm = (exam as any).kkm || 60;
    return (s.score || 0) >= kkm;
  }).length;
  const examPassRate = gradedExamSubmissions.length > 0
    ? Math.round((examPassCount / gradedExamSubmissions.length) * 100)
    : 0;

  // Assignment analytics calculations
  const assignmentIds = filteredAssignments.map(a => a.id);
  const filteredAssignmentSubs = [
    ...assignmentSubmissions.filter(s => assignmentIds.includes(s.assignment_id)),
    ...questionSubmissions.filter(s => assignmentIds.includes(s.assignment_id))
  ];
  const gradedAssignmentSubs = filteredAssignmentSubs.filter(s => s.graded && s.score !== null);

  const assignmentTotalStudents = new Set(filteredAssignmentSubs.map(s => s.student_id)).size;
  const assignmentTotalSubmissions = filteredAssignmentSubs.length;
  const assignmentTotalScore = gradedAssignmentSubs.reduce((sum, s) => sum + (s.score || 0), 0);
  const assignmentAvgScore = gradedAssignmentSubs.length > 0 ? Math.round(assignmentTotalScore / gradedAssignmentSubs.length) : 0;
  const assignmentKKM = (filteredAssignments[0] as any)?.kkm || 60;

  // KKM is an integer threshold - student passes if score >= kkm directly
  const assignmentPassCount = gradedAssignmentSubs.filter(s => {
    const assignment = teacherAssignments.find(a => a.id === s.assignment_id);
    if (!assignment) return false;
    const kkm = (assignment as any).kkm || 60;
    return (s.score || 0) >= kkm;
  }).length;
  const assignmentPassRate = gradedAssignmentSubs.length > 0
    ? Math.round((assignmentPassCount / gradedAssignmentSubs.length) * 100)
    : 0;

  // Score distribution for exams
  const examScoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0, label: 'F' },
    { range: '21-40', min: 21, max: 40, count: 0, label: 'D' },
    { range: '41-60', min: 41, max: 60, count: 0, label: 'C' },
    { range: '61-80', min: 61, max: 80, count: 0, label: 'B' },
    { range: '81-100', min: 81, max: 100, count: 0, label: 'A' },
  ];

  gradedExamSubmissions.forEach(s => {
    const score = s.score || 0;
    const range = examScoreRanges.find(r => score >= r.min && score <= r.max);
    if (range) range.count++;
  });

  // Score distribution for assignments
  const assignmentScoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0, label: 'F' },
    { range: '21-40', min: 21, max: 40, count: 0, label: 'D' },
    { range: '41-60', min: 41, max: 60, count: 0, label: 'C' },
    { range: '61-80', min: 61, max: 80, count: 0, label: 'B' },
    { range: '81-100', min: 81, max: 100, count: 0, label: 'A' },
  ];

  gradedAssignmentSubs.forEach(s => {
    const score = s.score || 0;
    const range = assignmentScoreRanges.find(r => score >= r.min && score <= r.max);
    if (range) range.count++;
  });

  // Submission status breakdown
  const examSubmissionStatus = [
    { name: t('assignments.graded'), value: gradedExamSubmissions.length, color: CHART_COLORS[0] },
    { name: t('common.pending'), value: filteredExamSubmissions.length - gradedExamSubmissions.length, color: CHART_COLORS[3] },
  ].filter(s => s.value > 0);

  const assignmentSubmissionStatus = [
    { name: t('assignments.graded'), value: gradedAssignmentSubs.length, color: CHART_COLORS[0] },
    { name: t('common.pending'), value: filteredAssignmentSubs.length - gradedAssignmentSubs.length, color: CHART_COLORS[3] },
  ].filter(s => s.value > 0);

  // Exam performance data - KKM is integer threshold (score >= kkm)
  const examPerformance = filteredExams.map(exam => {
    const subs = gradedExamSubmissions.filter(s => s.exam_id === exam.id);
    const kkm = (exam as any).kkm || 60;
    const totalScore = subs.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgScore = subs.length > 0 ? Math.round(totalScore / subs.length) : 0;
    const passedCount = subs.filter(s => (s.score || 0) >= kkm).length;

    return {
      id: exam.id,
      name: exam.title.length > 20 ? exam.title.substring(0, 20) + '...' : exam.title,
      fullName: exam.title,
      submissions: subs.length,
      avgScore,
      totalPoints: exam.total_points,
      kkm,
      passedCount,
      failedCount: subs.length - passedCount,
    };
  }).filter(e => e.submissions > 0);

  // Assignment performance data - KKM is integer threshold (score >= kkm)
  const assignmentPerformance = filteredAssignments.map(assignment => {
    const subs = gradedAssignmentSubs.filter(s => s.assignment_id === assignment.id);
    const kkm = (assignment as any).kkm || 60;
    const totalScore = subs.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgScore = subs.length > 0 ? Math.round(totalScore / subs.length) : 0;
    const passedCount = subs.filter(s => (s.score || 0) >= kkm).length;

    return {
      id: assignment.id,
      name: assignment.title.length > 20 ? assignment.title.substring(0, 20) + '...' : assignment.title,
      fullName: assignment.title,
      submissions: subs.length,
      avgScore,
      maxPoints: assignment.max_points,
      kkm,
      passedCount,
      failedCount: subs.length - passedCount,
    };
  }).filter(a => a.submissions > 0);

  // Current analytics data based on type
  const currentStats = analyticsType === 'exams'
    ? { students: examTotalStudents, submissions: examTotalSubmissions, avgScore: examAvgScore, passRate: examPassRate, kkm: examKKM }
    : { students: assignmentTotalStudents, submissions: assignmentTotalSubmissions, avgScore: assignmentAvgScore, passRate: assignmentPassRate, kkm: assignmentKKM };

  const currentSubmissionStatus = analyticsType === 'exams' ? examSubmissionStatus : assignmentSubmissionStatus;
  const currentPerformance = analyticsType === 'exams' ? examPerformance : assignmentPerformance;
  const currentSubmissions = analyticsType === 'exams' ? filteredExamSubmissions : filteredAssignmentSubs;

  // Export handlers
  const handleExportCSV = () => {
    const courseName = selectedCourse
      ? courses.find(c => c.id === selectedCourse)?.title
      : t('common.allCourses');

    // Map performance data to have consistent totalPoints field
    const performanceData = currentPerformance.map(p => ({
      ...p,
      totalPoints: (p as any).totalPoints || (p as any).maxPoints || 0,
    }));

    exportToCSV({
      totalStudents: currentStats.students,
      totalSubmissions: currentStats.submissions,
      avgScore: currentStats.avgScore,
      passRate: currentStats.passRate,
      scoreRanges: analyticsType === 'exams' ? examScoreRanges : assignmentScoreRanges,
      examPerformance: performanceData,
      courseName,
      exportDate: new Date().toLocaleDateString(),
    }, `${analyticsType}-analytics-${new Date().toISOString().split('T')[0]}`);

    toast.success('CSV report downloaded');
  };

  const handleExportPDF = () => {
    const courseName = selectedCourse
      ? courses.find(c => c.id === selectedCourse)?.title
      : undefined;

    // Map performance data to have consistent totalPoints field
    const performanceData = currentPerformance.map(p => ({
      ...p,
      totalPoints: (p as any).totalPoints || (p as any).maxPoints || 0,
    }));

    exportToPDF({
      totalStudents: currentStats.students,
      totalSubmissions: currentStats.submissions,
      avgScore: currentStats.avgScore,
      passRate: currentStats.passRate,
      scoreRanges: analyticsType === 'exams' ? examScoreRanges : assignmentScoreRanges,
      examPerformance: performanceData,
      courseName,
      exportDate: new Date().toLocaleDateString(),
    }, `${analyticsType}-analytics-${new Date().toISOString().split('T')[0]}`);

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
          <h1 className="text-3xl font-bold text-foreground">{t('analytics.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('analytics.overview')}
          </p>
        </div>

        <div className="flex gap-3">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('materials.chooseCourse')} />
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
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('materials.selectCourse')}</h3>
            <p className="text-muted-foreground">{t('materials.chooseCourse')}</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={analyticsType} onValueChange={setAnalyticsType} className="space-y-6">
          <TabsList>
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('nav.exams')}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              {t('nav.assignments')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exams" className="space-y-6">
            {renderAnalyticsContent('exams')}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            {renderAnalyticsContent('assignments')}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );

  function renderAnalyticsContent(type: 'exams' | 'assignments') {
    const stats = type === 'exams'
      ? { students: examTotalStudents, submissions: examTotalSubmissions, avgScore: examAvgScore, passRate: examPassRate, kkm: examKKM }
      : { students: assignmentTotalStudents, submissions: assignmentTotalSubmissions, avgScore: assignmentAvgScore, passRate: assignmentPassRate, kkm: assignmentKKM };

    const submissionStatus = type === 'exams' ? examSubmissionStatus : assignmentSubmissionStatus;
    const performance = type === 'exams' ? examPerformance : assignmentPerformance;
    const submissions = type === 'exams' ? filteredExamSubmissions : filteredAssignmentSubs;

    return (
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
                  <p className="text-2xl font-bold text-foreground">{stats.students}</p>
                  <p className="text-sm text-muted-foreground">{t('students.totalStudents')}</p>
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
                  <p className="text-2xl font-bold text-foreground">{stats.submissions}</p>
                  <p className="text-sm text-muted-foreground">{t('assignments.submissions')}</p>
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
                  <p className="text-2xl font-bold text-foreground">{stats.avgScore}</p>
                  <p className="text-sm text-muted-foreground">{t('dashboard.averageScore')} (pts)</p>
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
                  <p className="text-2xl font-bold text-foreground">{stats.passRate}%</p>
                  <p className="text-sm text-muted-foreground">Pass Rate ({t('reportCards.kkm')}: {stats.kkm} pts)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Performance Comparison */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-secondary" />
                <CardTitle className="text-lg">
                  {type === 'exams' ? t('nav.exams') : t('nav.assignments')} {t('analytics.performance')}
                </CardTitle>
              </div>
              <CardDescription>Average scores across {type === 'exams' ? t('nav.exams') : t('nav.assignments')}</CardDescription>
            </CardHeader>
            <CardContent>
              {performance.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      label={{ value: t('dashboard.averageScore'), angle: -90, position: 'insideLeft' }}
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
                        if (name === 'avgScore') return [`${value} pts`, t('dashboard.averageScore')];
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        const item = performance.find(e => e.name === label);
                        return item?.fullName || label;
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
                  No {type === 'exams' ? t('nav.exams') : t('nav.assignments')} data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission Status Pie */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{t('analytics.submissionRate')}</CardTitle>
              </div>
              <CardDescription>{t('assignments.graded')} vs {t('common.pending')}</CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length > 0 ? (
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
                  {t('assignments.noSubmittedAssignments')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats Table */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">{type === 'exams' ? t('nav.exams') : t('nav.assignments')} Details</CardTitle>
            <CardDescription>Average scores and student distribution per {type === 'exams' ? 'exam' : 'assignment'}</CardDescription>
          </CardHeader>
          <CardContent>
            {performance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        {type === 'exams' ? t('nav.exams') : t('nav.assignments')}
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('assignments.submissions')}</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('dashboard.averageScore')}</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('assignments.maxPoints')}</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('reportCards.kkm')}</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('reportCards.passed')}</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('reportCards.failed')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((item, idx) => (
                      <tr
                        key={idx}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (type === 'exams') {
                            navigate(`/teacher/exams/${item.id}/grade`);
                          } else {
                            navigate(`/teacher/assignments/${item.id}/submissions`);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (type === 'exams') {
                              navigate(`/teacher/exams/${item.id}/grade`);
                            } else {
                              navigate(`/teacher/assignments/${item.id}/submissions`);
                            }
                          }
                        }}
                        className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                        title="Open grading"
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground">{item.fullName}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline">{item.submissions}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold text-foreground">{item.avgScore} pts</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-muted-foreground">
                            {type === 'exams' ? (item as any).totalPoints : (item as any).maxPoints} pts
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="secondary">{item.kkm} pts</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {item.passedCount}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.failedCount > 0 ? (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                              <XCircle className="w-3 h-3 mr-1" />
                              {item.failedCount}
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
                {t('common.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </>
    );
  }
};


export default TeacherAnalytics;
