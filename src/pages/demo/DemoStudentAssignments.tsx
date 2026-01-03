import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Award, Upload, Lock, FileText, AlertCircle } from 'lucide-react';
import { demoAssignments } from '@/data/demoData';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DemoStudentAssignments() {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submission, setSubmission] = useState('');

  const publishedAssignments = demoAssignments.filter(a => a.status === 'published');
  const assignment = demoAssignments.find(a => a.id === selectedAssignment);

  const handleSubmit = () => {
    toast.info('Submit is disabled in demo mode. This is a preview experience!', {
      action: {
        label: 'Contact Us',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  const openSubmission = (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    setSubmission('');
    setIsSubmitOpen(true);
  };

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

                <Button className="w-full" onClick={() => openSubmission(assignment.id)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Submission
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submission Dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{assignment?.title}</DialogTitle>
              <div className="flex items-center gap-2 text-sm bg-amber-500/10 px-3 py-1 rounded-full">
                <Lock className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700">Demo Mode</span>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Assignment Details */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Instructions</h4>
              <p className="text-sm text-muted-foreground">{assignment?.description}</p>
              <div className="flex gap-4 mt-3 text-sm">
                <span>Max Points: <strong>{assignment?.max_points}</strong></span>
                <span>Due: <strong>{assignment && format(new Date(assignment.due_date), 'MMM d, yyyy HH:mm')}</strong></span>
              </div>
            </div>

            {/* Submission Area */}
            {assignment?.assignment_type === 'submission' ? (
              <div className="space-y-3">
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drag and drop your file here or click to browse</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Select File
                  </Button>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Additional Notes (Optional)</label>
                  <Textarea
                    placeholder="Add any notes..."
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This is a question-based assignment. Answer all questions below.
                </p>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge>Question 1</Badge>
                      <Badge variant="outline">10 pts</Badge>
                    </div>
                    <p className="mb-3">Explain the importance of mathematics in everyday life.</p>
                    <Textarea
                      placeholder="Write your answer here..."
                      value={submission}
                      onChange={(e) => setSubmission(e.target.value)}
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Demo Notice */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                <strong>Demo Mode:</strong> Submission is disabled. Contact us for full access!
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsSubmitOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                <Lock className="h-4 w-4 mr-2" />
                Submit (Demo)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
