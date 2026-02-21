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
  Tooltip as RechartsTooltip,
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
  HelpCircle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
    { name: t('studentAnalytics.passed'), value: examPassCount },
    { name: t('studentAnalytics.failed'), value: totalExams - examPassCount },
  ].filter(s => s.value > 0);

  // Submission status for assignments
  const assignmentSubmissionStatus = [
    { name: t('studentAnalytics.passed'), value: assignmentPassCount },
    { name: t('studentAnalytics.failed'), value: gradedAssignments.length - assignmentPassCount },
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
        <h1 className="text-3xl font-bold text-foreground">{t('studentAnalytics.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('studentAnalytics.subtitle')}
        </p>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{t('studentAnalytics.overallAverage')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-center">{t('studentAnalytics.tooltipOverallAverage')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-foreground">{overallAverage} pts</p>
                <p className="text-xs text-muted-foreground mt-2">{t('studentAnalytics.acrossAllWork')}</p>
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
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{t('studentAnalytics.enrolledCourses')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-center">{t('studentAnalytics.tooltipEnrolledCourses')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalCourses}</p>
                <p className="text-xs text-muted-foreground mt-2">{t('studentAnalytics.activeEnrollments')}</p>
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
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{t('studentAnalytics.completedWork')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-center">{t('studentAnalytics.tooltipCompletedWork')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalExams + gradedAssignments.length}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('studentAnalytics.workCount', { exams: totalExams, assignments: gradedAssignments.length })}
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
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{t('studentAnalytics.badgesEarned')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-center">{t('studentAnalytics.tooltipBadgesEarned')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalBadges}</p>
                <p className="text-xs text-muted-foreground mt-2">{t('studentAnalytics.achievementsUnlocked')}</p>
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
            {t('courseDetailPage.examsTab')}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            {t('calendar.types.assignment')}
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
            {t('studentAnalytics.recentBadges')}
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
              <h3 className="text-lg font-medium text-foreground mb-1">{t('studentAnalytics.noBadgesTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('studentAnalytics.completeCoursework')}
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
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{analyticsType === 'exams' ? t('studentAnalytics.examsCompleted') : t('studentAnalytics.assignmentsGraded')}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[200px] text-center">{t('studentAnalytics.tooltipCompletedCount')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{t('studentAnalytics.averageScore')}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[200px] text-center">{t('studentAnalytics.tooltipAverageScore')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{t('studentAnalytics.passRate')}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[300px] text-center">{t('studentAnalytics.tooltipPassRate')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{currentStats.passRate}%</p>
                  <Badge variant={currentStats.passRate >= 70 ? 'default' : 'secondary'} className="mt-2">
                    {t('studentAnalytics.passedCount', { count: currentStats.passCount })}
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
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>{t('studentAnalytics.scoreDistribution')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[250px] text-center">{t('studentAnalytics.tooltipScoreDistribution')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
                      label={{ value: t('studentAnalytics.count'), angle: -90, position: 'insideLeft' }}
                      allowDecimals={false}
                      tickFormatter={(value) => Math.floor(value).toString()}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [Math.floor(value), t('studentAnalytics.count')]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">{t('studentAnalytics.noDataTitle')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('studentAnalytics.completeToSeeScore', { type: analyticsType })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card >

          {/* Pass/Fail Status Pie */}
          < Card >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <span>{t('studentAnalytics.passFailStatus')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[250px] text-center">{t('studentAnalytics.tooltipStatusRatio')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
                              fill={entry.name === t('studentAnalytics.passed') ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
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
                            backgroundColor: item.name === t('studentAnalytics.passed')
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
                  <h3 className="text-lg font-medium text-foreground mb-1">{t('studentAnalytics.noDataTitle')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('studentAnalytics.completeToSeeStatus', { type: analyticsType })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card >
        </div >
      </>
    );
  }
};

export default StudentAnalytics;