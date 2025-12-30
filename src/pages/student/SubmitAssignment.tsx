import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import { ArrowLeft, Upload, FileText, Calendar, CheckCircle, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useAssignment, useMyAssignmentSubmission, useSubmitAssignment, useSubmissionFileUrl } from '@/hooks/useAssignments';
import { useAssignmentQuestions, AssignmentQuestion } from '@/hooks/useAssignmentQuestions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function SubmitAssignment() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: assignment, isLoading: assignmentLoading } = useAssignment(assignmentId!);
  const { data: submission, isLoading: submissionLoading } = useMyAssignmentSubmission(assignmentId!);
  const { data: fileUrl } = useSubmissionFileUrl(submission?.file_path || null);
  const { data: questions = [] } = useAssignmentQuestions(assignmentId!);
  const submitAssignment = useSubmitAssignment();

  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | number | number[]>>({});
  const [isSubmittingQuestions, setIsSubmittingQuestions] = useState(false);

  const isLoading = assignmentLoading || submissionLoading;
  const isOverdue = assignment ? isPast(new Date(assignment.due_date)) : false;
  const canSubmit = assignment && (!isOverdue || assignment.allow_late_submissions) && !submission?.graded;
  const isQuestionBased = (assignment as any)?.assignment_type === 'questions';

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

  const handleQuestionSubmit = async () => {
    if (!assignment || !user) return;

    // Check if all questions are answered
    const unanswered = questions.filter(q => {
      const answer = answers[q.id];
      if (q.type === 'essay') return !answer || !(answer as string).trim();
      if (q.type === 'multi-select') return !answer || (answer as number[]).length === 0;
      return answer === undefined || answer === null;
    });

    if (unanswered.length > 0) {
      toast.error(`Please answer all questions. ${unanswered.length} unanswered.`);
      return;
    }

    setIsSubmittingQuestions(true);
    try {
      const { error } = await supabase
        .from('assignment_question_submissions')
        .insert({
          assignment_id: assignment.id,
          student_id: user.id,
          answers: answers,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['my-assignment-submission', assignmentId] });
      toast.success('Assignment submitted successfully!');
      navigate('/student/assignments');
    } catch {
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmittingQuestions(false);
    }
  };

  const handleMultiSelectChange = (questionId: string, optionIndex: number, checked: boolean) => {
    const currentAnswers = (answers[questionId] as number[]) || [];
    if (checked) {
      setAnswers({ ...answers, [questionId]: [...currentAnswers, optionIndex] });
    } else {
      setAnswers({ ...answers, [questionId]: currentAnswers.filter(i => i !== optionIndex) });
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/student/assignments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Due: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
            </span>
            <span className="text-muted-foreground">{assignment.max_points} points</span>
            <Badge variant="outline">
              {isQuestionBased ? 'Question-Based' : 'File Submission'}
            </Badge>
            {isOverdue && !submission && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description and Instructions */}
      {(assignment.description || assignment.instructions) && (
        <div className="space-y-4">
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
        </div>
      )}

      {/* Submission Already Made */}
      {submission && (
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
      )}

      {/* Question-Based Assignment */}
      {!submission && isQuestionBased && questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
            <CardDescription>
              Answer all {questions.length} question(s) below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            {isOverdue && !assignment.allow_late_submissions ? (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Submission Closed</p>
                  <p className="text-muted-foreground">
                    This assignment no longer accepts submissions
                  </p>
                </div>
              </div>
            ) : (
              <>
                {questions.map((q, index) => (
                  <div key={q.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-medium">
                        {index + 1}. {q.question}
                      </p>
                      <Badge variant="outline">{q.points} pts</Badge>
                    </div>
                    
                    {q.type === 'multiple-choice' && q.options && (
                      <RadioGroup
                        value={answers[q.id]?.toString()}
                        onValueChange={(value) => setAnswers({ ...answers, [q.id]: parseInt(value) })}
                      >
                        {(q.options as string[]).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={optIndex.toString()} id={`${q.id}-${optIndex}`} />
                            <Label htmlFor={`${q.id}-${optIndex}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {q.type === 'multi-select' && q.options && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Select all that apply</p>
                        {(q.options as string[]).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${q.id}-${optIndex}`}
                              checked={((answers[q.id] as number[]) || []).includes(optIndex)}
                              onCheckedChange={(checked) => 
                                handleMultiSelectChange(q.id, optIndex, checked as boolean)
                              }
                            />
                            <Label htmlFor={`${q.id}-${optIndex}`}>{option}</Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'essay' && (
                      <Textarea
                        value={(answers[q.id] as string) || ''}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        placeholder="Enter your answer..."
                        rows={4}
                      />
                    )}
                  </div>
                ))}

                <Button 
                  className="w-full" 
                  onClick={handleQuestionSubmit}
                  disabled={isSubmittingQuestions}
                >
                  {isSubmittingQuestions && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Submit Assignment
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* File-Based Assignment */}
      {!submission && !isQuestionBased && (
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

            {isOverdue && !assignment.allow_late_submissions ? (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Submission Closed</p>
                  <p className="text-muted-foreground">
                    This assignment no longer accepts submissions
                  </p>
                </div>
              </div>
            ) : (
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
  );
}