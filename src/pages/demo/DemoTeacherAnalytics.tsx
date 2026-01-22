import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Award, Target, BookOpen, FileText, ClipboardList } from 'lucide-react';
import { demoCourses, demoStats } from '@/data/demoData';

const CHART_COLORS = ['hsl(var(--secondary))', 'hsl(var(--primary))', '#f59e0b', '#ef4444', '#8b5cf6'];

// Sample analytics data
const examScoreDistribution = [
  { range: '0-20', count: 2, label: 'F' },
  { range: '21-40', count: 5, label: 'D' },
  { range: '41-60', count: 12, label: 'C' },
  { range: '61-80', count: 18, label: 'B' },
  { range: '81-100', count: 8, label: 'A' },
];

const assignmentScoreDistribution = [
  { range: '0-20', count: 1, label: 'F' },
  { range: '21-40', count: 3, label: 'D' },
  { range: '41-60', count: 8, label: 'C' },
  { range: '61-80', count: 15, label: 'B' },
  { range: '81-100', count: 18, label: 'A' },
];

const examPerformance = [
  { name: 'Midterm Algebra', submissions: 45, avgScore: 72, passedCount: 38, failedCount: 7 },
  { name: 'Quiz Fractions', submissions: 42, avgScore: 78, passedCount: 40, failedCount: 2 },
  { name: 'Physics Final', submissions: 30, avgScore: 65, passedCount: 22, failedCount: 8 },
];

const assignmentPerformance = [
  { name: 'Homework 1', submissions: 44, avgScore: 82, passedCount: 42, failedCount: 2 },
  { name: 'Essay Math', submissions: 40, avgScore: 75, passedCount: 36, failedCount: 4 },
  { name: 'Lab Report', submissions: 28, avgScore: 68, passedCount: 24, failedCount: 4 },
];

const submissionStatus = [
  { name: 'Graded', value: 85, color: CHART_COLORS[0] },
  { name: 'Pending', value: 15, color: CHART_COLORS[3] },
];

/**
 * Demo Teacher Analytics page.
 * 
 * Provides insights into student performance using varied visualizations.
 * Features:
 * - Score distribution histograms (Recharts BarChart)
 * - Submission status pie charts (Recharts PieChart)
 * - Pass/Fail rates comparison
 * - Quick stats overview (Total Students, Submissions, Avg Score)
 * - Filtering by course and analytics type (Exams vs Assignments)
 * 
 * @returns {JSX.Element} The rendered Teacher Analytics page.
 */
export default function DemoTeacherAnalytics() {
  const [selectedCourse, setSelectedCourse] = useState<string>(demoCourses[0]?.id || '');
  const [analyticsType, setAnalyticsType] = useState<string>('exams');

  const publishedCourses = demoCourses.filter(c => c.status === 'published');
  const stats = demoStats.teacher;

  const currentScoreDistribution = analyticsType === 'exams' ? examScoreDistribution : assignmentScoreDistribution;
  const currentPerformance = analyticsType === 'exams' ? examPerformance : assignmentPerformance;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track student performance across exams and assignments</p>
        </div>

        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {publishedCourses.map(course => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
    </div>
  );

  function renderAnalyticsContent() {
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
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
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
                  <p className="text-2xl font-bold">117</p>
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
                  <p className="text-2xl font-bold">72</p>
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
                  <p className="text-2xl font-bold">85%</p>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentScoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value} students`, 'Count']}
                      labelFormatter={(label) => `Score Range: ${label}`}
                    />
                    <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Submission Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={submissionStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {submissionStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {analyticsType === 'exams' ? 'Exam' : 'Assignment'} Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="passedCount" name="Passed" fill="hsl(var(--secondary))" stackId="a" />
                  <Bar dataKey="failedCount" name="Failed" fill="#ef4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }
}
