import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Award, Upload, FileText, AlertCircle } from 'lucide-react';
import { demoAssignments } from '@/data/demoData';
import { format } from 'date-fns';

/**
 * Demo Student Assignments page.
 * 
 * Lists all assignments for the student demo user.
 * Features:
 * - Status indicators (Pending, Overdue)
 * - Assignment type badges (File Upload, Questions)
 * - Due date and points display
 * - Late submission penalty notices
 * - Navigation to assignment submission detail
 * 
 * @returns {JSX.Element} The rendered Student Assignments page.
 */
export default function DemoStudentAssignments() {
  const navigate = useNavigate();
  const publishedAssignments = demoAssignments.filter(a => a.status === 'published');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground">Complete and submit your assignments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {publishedAssignments.map((assignment) => {
          const dueDate = new Date(assignment.due_date);
          const isOverdue = dueDate < new Date();

          return (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <Badge variant={isOverdue ? 'destructive' : 'default'}>
                    {isOverdue ? 'Overdue' : 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{assignment.course_title}</p>

                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline">
                    <Award className="h-3 w-3 mr-1" />
                    {assignment.max_points} pts
                  </Badge>
                  <Badge variant={isOverdue ? 'destructive' : 'outline'}>
                    <Clock className="h-3 w-3 mr-1" />
                    Due {format(dueDate, 'MMM d, HH:mm')}
                  </Badge>
                  <Badge variant="secondary">
                    {assignment.assignment_type === 'submission' ? (
                      <>
                        <Upload className="h-3 w-3 mr-1" />
                        File Upload
                      </>
                    ) : (
                      <>
                        <FileText className="h-3 w-3 mr-1" />
                        Questions
                      </>
                    )}
                  </Badge>
                </div>

                {assignment.allow_late_submissions && isOverdue && (
                  <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    Late submission allowed (-{assignment.late_penalty_percent}% penalty)
                  </div>
                )}

                <Button className="w-full" onClick={() => navigate(`/demo/student/assignments/${assignment.id}`)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Submission
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}