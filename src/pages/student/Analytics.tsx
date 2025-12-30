import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const StudentAnalytics = () => {
  const { user } = useAuth();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();

  // Fetch exam submissions
  const { data: examSubmissions, isLoading: examsLoading } = useQuery({
    queryKey: ['student-exam-submissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('exam_submissions')
        .select(`
          *,
          exam:exams(title, total_points, course:courses(title))
        `)
        .eq('student_id', user.id)
        .eq('graded', true);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch assignment submissions
  const { data: assignmentSubmissions, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['student-assignment-submissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignment:assignments(title, max_points, course:courses(title))
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

  const isLoading = enrollmentsLoading || examsLoading || assignmentsLoading || badgesLoading;

  // Calculate statistics
  const totalCourses = enrollments?.length || 0;
  const totalExams = examSubmissions?.length || 0;
  const totalAssignments = assignmentSubmissions?.length || 0;
  const gradedAssignments = assignmentSubmissions?.filter(s => s.graded) || [];
  const totalBadges = badges?.length || 0;

  // Calculate average scores
  const examAverage = examSubmissions?.length
    ? Math.round(
        examSubmissions.reduce((acc, s) => {
          const percentage = (s.score / (s.exam?.total_points || 100)) * 100;
          return acc + percentage;
        }, 0) / examSubmissions.length
      )
    : 0;

  const assignmentAverage = gradedAssignments.length
    ? Math.round(
        gradedAssignments.reduce((acc, s) => {
          const percentage = ((s.score || 0) / (s.assignment?.max_points || 100)) * 100;
          return acc + percentage;
        }, 0) / gradedAssignments.length
      )
    : 0;

  const overallAverage = Math.round((examAverage + assignmentAverage) / 2);

  // Prepare chart data
  const performanceByType = [
    { name: 'Exams', value: examAverage, count: totalExams },
    { name: 'Assignments', value: assignmentAverage, count: gradedAssignments.length },
  ];

  // Grade distribution
  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const gradeDistribution = ['A', 'B', 'C', 'D', 'F'].map(grade => {
    const examCount = examSubmissions?.filter(s => {
      const percentage = (s.score / (s.exam?.total_points || 100)) * 100;
      return getGradeLabel(percentage) === grade;
    }).length || 0;
    
    const assignmentCount = gradedAssignments.filter(s => {
      const percentage = ((s.score || 0) / (s.assignment?.max_points || 100)) * 100;
      return getGradeLabel(percentage) === grade;
    }).length || 0;

    return { grade, count: examCount + assignmentCount };
  });

  // Score distribution histogram (actual scores grouped by ranges)
  const scoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0 },
    { range: '21-40', min: 21, max: 40, count: 0 },
    { range: '41-60', min: 41, max: 60, count: 0 },
    { range: '61-80', min: 61, max: 80, count: 0 },
    { range: '81-100', min: 81, max: 100, count: 0 },
  ];

  // Count scores from exams
  examSubmissions?.forEach(s => {
    const percentage = Math.round((s.score / (s.exam?.total_points || 100)) * 100);
    const range = scoreRanges.find(r => percentage >= r.min && percentage <= r.max);
    if (range) range.count++;
  });

  // Count scores from assignments
  gradedAssignments.forEach(s => {
    const percentage = Math.round(((s.score || 0) / (s.assignment?.max_points || 100)) * 100);
    const range = scoreRanges.find(r => percentage >= r.min && percentage <= r.max);
    if (range) range.count++;
  });

  // Submission status
  const submissionStatus = [
    { name: 'Graded', value: gradedAssignments.length + totalExams },
    { name: 'Pending', value: (assignmentSubmissions?.filter(s => !s.graded).length || 0) },
  ];

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Average</p>
                <p className="text-3xl font-bold text-foreground">{overallAverage}%</p>
                <Badge variant={overallAverage >= 70 ? 'default' : 'secondary'} className="mt-2">
                  Grade {getGradeLabel(overallAverage)}
                </Badge>
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
                <p className="text-3xl font-bold text-foreground">{totalExams + totalAssignments}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalExams} exams, {totalAssignments} assignments
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

      {/* Charts - Histogram and Pie */}
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
            {(examSubmissions?.length || 0) + gradedAssignments.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreRanges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="range" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} submissions`, 'Count']}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No graded work yet</h3>
                <p className="text-sm text-muted-foreground">
                  Complete exams and assignments to see your score distribution.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Submission Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={submissionStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {submissionStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              {submissionStatus.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
};

export default StudentAnalytics;
