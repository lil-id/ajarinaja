import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Award,
  BookOpen,
  BarChart3,
  ClipboardList,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

/**
 * Student Analytics page.
 * 
 * Visualizes student performance data.
 * Features:
 * - Aggregate stats (Average score, completion rates)
 * - Interactive charts (Score distribution, Pass/Fail ratios)
 * - Comparison between Exams and Assignments
 * - Badge showcase (Recent achievements)
 * 
 * @returns {JSX.Element} The rendered Analytics page.
 */
const StudentAnalytics = () => {
  const { user } = useAuth();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const [analyticsType, setAnalyticsType] = useState<string>('exams');

  // Fetch exam submissions with exam details including KKM
  const { data: examSubmissions, isLoading: examsLoading } = useQuery({
    queryKey: ['student-exam-submissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('exam_submissions')
        .select(`
          *,
          exam:exams(title, total_points, kkm, course:courses(title))
        `)
        .eq('student_id', user.id)
        .eq('graded', true);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch assignment submissions with assignment details including KKM
  const { data: assignmentSubmissions, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['student-assignment-submissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignment:assignments(title, max_points, kkm, course:courses(title))
        `)
        .eq('student_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch question-based assignment submissions
  const { data: questionSubmissions, isLoading: questionLoading } = useQuery({
    queryKey: ['student-question-submissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('assignment_question_submissions')
        .select(`
          *,
          assignment:assignments(title, max_points, kkm, course:courses(title))
        `)
        .eq('student_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch badges
  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['student-badges-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('student_badges')
        .select('*, badge:badges(*)')
        .eq('student_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = enrollmentsLoading || examsLoading || assignmentsLoading || questionLoading || badgesLoading;

  // Calculate statistics
  const totalCourses = enrollments?.length || 0;
  const totalExams = examSubmissions?.length || 0;

  // Combine file-based and question-based assignment submissions
  const allAssignmentSubs = [
    ...(assignmentSubmissions || []),
    ...(questionSubmissions || [])
  ];
  const gradedAssignments = allAssignmentSubs.filter(s => s.graded);
  const totalBadges = badges?.length || 0;

  // Calculate exam stats - KKM is integer threshold (score >= kkm)
  const examAverage = examSubmissions?.length
    ? Math.round(
      examSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / examSubmissions.length
    )
    : 0;

  const examPassCount = examSubmissions?.filter(s => {
    const kkm = (s.exam as any)?.kkm || 60;
    return (s.score || 0) >= kkm;
  }).length || 0;

  const examPassRate = examSubmissions?.length
    ? Math.round((examPassCount / examSubmissions.length) * 100)
    : 0;

  // Calculate assignment stats - KKM is integer threshold (score >= kkm)
  const assignmentAverage = gradedAssignments.length
    ? Math.round(
      gradedAssignments.reduce((acc, s) => acc + (s.score || 0), 0) / gradedAssignments.length
    )
    : 0;

  const assignmentPassCount = gradedAssignments.filter(s => {
    const kkm = (s.assignment as any)?.kkm || 60;
    return (s.score || 0) >= kkm;
  }).length;

  const assignmentPassRate = gradedAssignments.length
    ? Math.round((assignmentPassCount / gradedAssignments.length) * 100)
    : 0;

  const overallAverage = Math.round((examAverage + assignmentAverage) / 2);

  // Score distribution for exams (using actual scores, integer ranges)
  const examScoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0 },
    { range: '21-40', min: 21, max: 40, count: 0 },
    { range: '41-60', min: 41, max: 60, count: 0 },
    { range: '61-80', min: 61, max: 80, count: 0 },
    { range: '81-100', min: 81, max: 100, count: 0 },
  ];

  examSubmissions?.forEach(s => {
    const score = Math.round(s.score || 0);
    const range = examScoreRanges.find(r => score >= r.min && score <= r.max);
    if (range) range.count++;
  });

  // Score distribution for assignments (using actual scores, integer ranges)
  const assignmentScoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0 },
    { range: '21-40', min: 21, max: 40, count: 0 },
    { range: '41-60', min: 41, max: 60, count: 0 },
    { range: '61-80', min: 61, max: 80, count: 0 },
    { range: '81-100', min: 81, max: 100, count: 0 },
  ];

  gradedAssignments.forEach(s => {
    const score = Math.round(s.score || 0);
    const range = assignmentScoreRanges.find(r => score >= r.min && score <= r.max);
    if (range) range.count++;
  });

  // Submission status for exams
  const examSubmissionStatus = [
    { name: 'Passed', value: examPassCount },
    { name: 'Failed', value: totalExams - examPassCount },
  ].filter(s => s.value > 0);

  // Submission status for assignments
  const assignmentSubmissionStatus = [
    { name: 'Passed', value: assignmentPassCount },
    { name: 'Failed', value: gradedAssignments.length - assignmentPassCount },
  ].filter(s => s.value > 0);

  // Current data based on type
  const currentScoreRanges = analyticsType === 'exams' ? examScoreRanges : assignmentScoreRanges;
  const currentSubmissionStatus = analyticsType === 'exams' ? examSubmissionStatus : assignmentSubmissionStatus;
  const currentStats = analyticsType === 'exams'
    ? { count: totalExams, average: examAverage, passRate: examPassRate, passCount: examPassCount }
    : { count: gradedAssignments.length, average: assignmentAverage, passRate: assignmentPassRate, passCount: assignmentPassCount };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your academic progress and performance trends
        </p>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Average</p>
                <p className="text-3xl font-bold text-foreground">{overallAverage} pts</p>
                <p className="text-xs text-muted-foreground mt-2">Across all work</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                <p className="text-3xl font-bold text-foreground">{totalCourses}</p>
                <p className="text-xs text-muted-foreground mt-2">Active enrollments</p>
              </div>
              <div className="h-12 w-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Work</p>
                <p className="text-3xl font-bold text-foreground">{totalExams + gradedAssignments.length}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalExams} exams, {gradedAssignments.length} assignments
                </p>
              </div>
              <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
                <p className="text-3xl font-bold text-foreground">{totalBadges}</p>
                <p className="text-xs text-muted-foreground mt-2">Achievements unlocked</p>
              </div>
              <div className="h-12 w-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Exams and Assignments */}
      <Tabs value={analyticsType} onValueChange={setAnalyticsType} className="space-y-6">
        <TabsList>
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Exams
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-6">
          {renderAnalyticsContent()}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          {renderAnalyticsContent()}
        </TabsContent>
      </Tabs>

      {/* Recent Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Recent Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {badges && badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
                >
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${item.badge?.color}20` }}
                  >
                    <Award className="h-5 w-5" style={{ color: item.badge?.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.badge?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.badge?.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Award className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No badges yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete coursework to earn badges from your teachers.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  function renderAnalyticsContent() {
    return (
      <>
        {/* Type-specific Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {analyticsType === 'exams' ? 'Exams Completed' : 'Assignments Graded'}
                  </p>
                  <p className="text-3xl font-bold text-foreground">{currentStats.count}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  {analyticsType === 'exams' ? (
                    <FileText className="h-6 w-6 text-primary" />
                  ) : (
                    <ClipboardList className="h-6 w-6 text-primary" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-3xl font-bold text-foreground">{currentStats.average} pts</p>
                </div>
                <div className="h-12 w-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-3xl font-bold text-foreground">{currentStats.passRate}%</p>
                  <Badge variant={currentStats.passRate >= 70 ? 'default' : 'secondary'} className="mt-2">
                    {currentStats.passCount} passed
                  </Badge>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution Histogram */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStats.count > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={currentScoreRanges}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="range"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                      allowDecimals={false}
                      tickFormatter={(value) => Math.floor(value).toString()}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [Math.floor(value), 'Count']}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">No data yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete {analyticsType} to see your score distribution.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pass/Fail Status Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Pass/Fail Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStats.count > 0 && currentSubmissionStatus.length > 0 ? (
                <>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={currentSubmissionStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {currentSubmissionStatus.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.name === 'Passed' ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {currentSubmissionStatus.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: item.name === 'Passed'
                              ? 'hsl(142, 71%, 45%)'
                              : 'hsl(0, 84%, 60%)'
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">No data yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete {analyticsType} to see your pass/fail status.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }
};

export default StudentAnalytics;