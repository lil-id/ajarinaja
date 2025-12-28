import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import { ArrowLeft, Upload, FileText, Calendar, Clock, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAssignment, useMyAssignmentSubmission, useSubmitAssignment, useSubmissionFileUrl } from '@/hooks/useAssignments';
import { toast } from 'sonner';

export default function SubmitAssignment() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: assignment, isLoading: assignmentLoading } = useAssignment(assignmentId!);
  const { data: submission, isLoading: submissionLoading } = useMyAssignmentSubmission(assignmentId!);
  const { data: fileUrl } = useSubmissionFileUrl(submission?.file_path || null);
  const submitAssignment = useSubmitAssignment();

  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');

  const isLoading = assignmentLoading || submissionLoading;
  const isOverdue = assignment ? isPast(new Date(assignment.due_date)) : false;
  const canSubmit = assignment && (!isOverdue || assignment.allow_late_submissions) && !submission?.graded;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !assignment) return;

    const maxSize = (assignment.max_file_size_mb || 10) * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error(`File size must be less than ${assignment.max_file_size_mb}MB`);
      return;
    }

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const allowedTypes = assignment.allowed_file_types || ['pdf', 'doc', 'docx', 'txt', 'zip'];
    if (ext && !allowedTypes.includes(ext)) {
      toast.error(`File type .${ext} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!assignment || (!file && !textContent.trim())) {
      toast.error('Please upload a file or enter text content');
      return;
    }

    try {
      await submitAssignment.mutateAsync({
        assignmentId: assignment.id,
        file: file || undefined,
        textContent: textContent.trim() || undefined,
        dueDate: assignment.due_date,
      });
      toast.success('Assignment submitted successfully!');
    } catch {
      toast.error('Failed to submit assignment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!assignment) {
    return <div>Assignment not found</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Due: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
            </span>
            <span className="text-muted-foreground">{assignment.max_points} points</span>
            {isOverdue && !submission && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {assignment.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{assignment.description}</p>
              </CardContent>
            </Card>
          )}

          {assignment.instructions && (
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{assignment.instructions}</p>
              </CardContent>
            </Card>
          )}

          {assignment.rubric && assignment.rubric.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Grading Rubric</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignment.rubric.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.criterion}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <Badge variant="outline">{item.maxPoints} pts</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {submission ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Submitted
                </CardTitle>
                <CardDescription>
                  {format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
                  {submission.is_late && (
                    <Badge variant="destructive" className="ml-2">Late</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.file_name && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Submitted File</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{submission.file_name}</span>
                    </div>
                    {fileUrl && (
                      <Button variant="link" size="sm" className="px-0" asChild>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {submission.graded && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm text-muted-foreground">Score</Label>
                      <p className="text-2xl font-bold">
                        {submission.score} / {assignment.max_points}
                      </p>
                    </div>
                    {submission.feedback && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Feedback</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{submission.feedback}</p>
                      </div>
                    )}
                  </>
                )}

                {!submission.graded && (
                  <p className="text-sm text-muted-foreground">
                    Your submission is pending review
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Submit Assignment</CardTitle>
                <CardDescription>
                  Upload a file or enter text content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isOverdue && assignment.allow_late_submissions && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-600">Late Submission</p>
                      <p className="text-muted-foreground">
                        A {assignment.late_penalty_percent}% penalty will be applied
                      </p>
                    </div>
                  </div>
                )}

                {isOverdue && !assignment.allow_late_submissions && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive">Submission Closed</p>
                      <p className="text-muted-foreground">
                        This assignment no longer accepts submissions
                      </p>
                    </div>
                  </div>
                )}

                {canSubmit && (
                  <>
                    <div className="space-y-2">
                      <Label>Upload File</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept={assignment.allowed_file_types?.map(t => `.${t}`).join(',')}
                      />
                      {file ? (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm truncate">{file.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Max size: {assignment.max_file_size_mb}MB. 
                        Allowed: {assignment.allowed_file_types?.join(', ')}
                      </p>
                    </div>

                    <div className="relative">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                        OR
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label>Text Content</Label>
                      <Textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Enter your answer here..."
                        rows={6}
                      />
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={handleSubmit}
                      disabled={submitAssignment.isPending || (!file && !textContent.trim())}
                    >
                      {submitAssignment.isPending ? 'Submitting...' : 'Submit Assignment'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
