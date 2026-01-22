import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Users, AlertTriangle, TrendingUp, Search, Mail, BookOpen, Lock } from 'lucide-react';
import { demoStudents, demoCourses, demoStudentPerformance } from '@/data/demoData';
import { toast } from 'sonner';

/**
 * Demo Teacher Students management page.
 * 
 * detailed view of student performance and status.
 * Features:
 * - Student list with "At-Risk" indicators
 * - Performance overview charts/stats
 * - Filtering by course and status
 * - Detailed student profile view (simulated)
 * 
 * @returns {JSX.Element} The rendered Teacher Students page.
 */
export default function DemoTeacherStudents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const atRiskStudents = demoStudentPerformance.filter(s => s.status === 'at-risk');
  const activeStudents = demoStudentPerformance.filter(s => s.status === 'active');

  const filteredStudents = demoStudentPerformance.filter(student => {
    const matchesSearch = student.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = () => {
    toast.info("Demo Mode - This action is disabled. Contact us for full access!", {
      action: {
        label: "Contact",
        onClick: () => window.open('https://wa.me/yourwhatsapp', '_blank')
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground">Monitor and manage your students across all courses</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoStudentPerformance.length}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeStudents.length}</div>
            <p className="text-xs text-muted-foreground">Performing well</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{atRiskStudents.length}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(demoStudentPerformance.reduce((acc, s) => acc + s.average_score, 0) / demoStudentPerformance.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Class average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="at-risk" className="text-destructive">
            At-Risk ({atRiskStudents.length})
          </TabsTrigger>
          <TabsTrigger value="performance">Performance Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="at-risk">At-Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {demoCourses.filter(c => c.status === 'published').map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Avg. Score</TableHead>
                  <TableHead>Exams</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead>Materials</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow key={student.student_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {student.student_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.student_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={student.average_score >= 70 ? 'text-green-600' : 'text-destructive'}>
                          {student.average_score}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{student.exams_taken}</TableCell>
                    <TableCell>{student.assignments_submitted}</TableCell>
                    <TableCell>{student.materials_viewed}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'at-risk' ? 'destructive' : 'default'}>
                        {student.status === 'at-risk' ? 'At-Risk' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={handleAction}>
                        <Mail className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="at-risk" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {atRiskStudents.map(student => (
              <Card key={student.student_id} className="border-destructive/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-destructive/10 text-destructive">
                          {student.student_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{student.student_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Avg: {student.average_score}%</p>
                      </div>
                    </div>
                    <Badge variant="destructive">At-Risk</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm font-medium">Risk Factors:</div>
                  <div className="space-y-2">
                    {student.risk_factors?.map((factor, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            factor.severity === 'high' ? 'border-destructive text-destructive' :
                              factor.severity === 'medium' ? 'border-orange-500 text-orange-500' :
                                'border-yellow-500 text-yellow-500'
                          }
                        >
                          {factor.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{factor.description}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={handleAction}>
                      <Mail className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={handleAction}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {demoStudentPerformance.map(student => (
                <div key={student.student_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {student.student_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.student_name}</span>
                      {student.status === 'at-risk' && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <span className={`font-bold ${student.average_score >= 70 ? 'text-green-600' : 'text-destructive'}`}>
                      {student.average_score}%
                    </span>
                  </div>
                  <Progress
                    value={student.average_score}
                    className={`h-2 ${student.average_score < 70 ? '[&>div]:bg-destructive' : ''}`}
                  />
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Exams: {student.exams_taken}</span>
                    <span>Assignments: {student.assignments_submitted}</span>
                    <span>Materials: {student.materials_viewed}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Notice */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              In the full version, you can email students, unenroll them, view detailed progress, and export reports.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAction}>
            Get Full Access
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
