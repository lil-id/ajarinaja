import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Eye } from 'lucide-react';
import { demoCourses, demoExams, demoAssignments, demoStudents, demoMaterials, demoAnnouncements } from '@/data/demoData';
import { format } from 'date-fns';

/**
 * Generic page component for demo routes that don't have a specific implementation yet or share a common layout.
 * 
 * Handles routing for various sections like:
 * - courses
 * - exams
 * - assignments
 * - students
 * - analytics
 * - calendar
 * - announcements/notifications
 * 
 * Renders read-only views with demo data based on the current URL path segments.
 * 
 * @returns {JSX.Element} The rendered generic page content based on the active section.
 */
export default function DemoGenericPage() {
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const section = pathParts[pathParts.length - 1];
  const role = pathParts[2]; // teacher or student

  /**
   * Renders the specific content based on the current section derived from the URL.
   * @returns {JSX.Element} The section content.
   */
  const getSectionContent = () => {
    switch (section) {
      case 'courses':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {role === 'teacher' ? 'Your Courses' : 'My Courses'}
              </h1>
              <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" /> View Only</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {demoCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">{course.enrolled_count} students</Badge>
                      <Badge variant="outline">{course.exam_count} exams</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'exams':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {role === 'teacher' ? 'Manage Exams' : 'My Exams'}
              </h1>
              <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" /> View Only</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {demoExams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{exam.title}</CardTitle>
                      <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                        {exam.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{exam.course_title}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">{exam.duration} min</Badge>
                      <Badge variant="outline">{exam.total_points} pts</Badge>
                      <Badge variant="outline">KKM: {exam.kkm}%</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'assignments':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {role === 'teacher' ? 'Manage Assignments' : 'My Assignments'}
              </h1>
              <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" /> View Only</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {demoAssignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <Badge variant={assignment.status === 'published' ? 'default' : 'secondary'}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{assignment.course_title}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">{assignment.max_points} pts</Badge>
                      <Badge variant="outline">Due: {format(new Date(assignment.due_date), 'MMM d')}</Badge>
                      {assignment.allow_late_submissions && (
                        <Badge variant="outline">Late OK (-{assignment.late_penalty_percent}%)</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'students':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Student Management</h1>
              <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" /> View Only</Badge>
            </div>
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Courses</th>
                      <th className="text-left p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">{student.name}</td>
                        <td className="p-4 text-muted-foreground">{student.email}</td>
                        <td className="p-4">{student.enrolled_courses}</td>
                        <td className="p-4">
                          <Badge variant={student.status === 'at-risk' ? 'destructive' : 'secondary'}>
                            {student.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" /> View Only</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">78%</div>
                  <p className="text-sm text-muted-foreground">Across all exams</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-500">92%</div>
                  <p className="text-sm text-muted-foreground">Assignment submissions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pass Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-500">85%</div>
                  <p className="text-sm text-muted-foreground">Above KKM threshold</p>
                </CardContent>
              </Card>
            </div>
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center py-8">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Full Analytics Available</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Charts, trends, and detailed reports are available in the full version
                </p>
              </div>
            </Card>
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Calendar</h1>
              <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" /> View Only</Badge>
            </div>
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center py-12">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Interactive Calendar</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View and manage exam schedules, assignment deadlines, and events in the full version
                </p>
              </div>
            </Card>
          </div>
        );

      case 'announcements':
      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {section === 'announcements' ? 'Announcements' : 'Notifications'}
              </h1>
              <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" /> View Only</Badge>
            </div>
            <div className="space-y-3">
              {demoAnnouncements.map((ann) => (
                <Card key={ann.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{ann.title}</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ann.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{ann.content}</p>
                    <Badge variant="secondary" className="mt-2">{ann.course_title}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Demo Content</h3>
            <p className="text-sm text-muted-foreground">This section is available in the full version</p>
          </div>
        );
    }
  };

  return getSectionContent();
}
