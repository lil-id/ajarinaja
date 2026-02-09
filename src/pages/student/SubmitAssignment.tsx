import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { cn } from '@/lib/utils';
import FormulaText from '@/components/FormulaText';

/**
 * Submit Assignment page.
 * 
 * Standard interface for assignment submission.
 * Supports two modes:
 * 1. File Upload / Text Entry
 * 2. Question-based (Quiz style)
 * 
 * Features:
 * - File validation (type, size)
 * - Auto-saving question answers (state based)
 * - Late submission handling
 * - Feedback viewing
 * 
 * @returns {JSX.Element} The rendered Submit Assignment page.
 */
export default function SubmitAssignment() {
  const { t } = useTranslation();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assignment, isLoading: assignmentLoading } = useAssignment(assignmentId!);
  const isQuestionBased = (assignment as any)?.assignment_type === 'questions';
  const { data: submission, isLoading: submissionLoading } = useMyAssignmentSubmission(assignmentId!, isQuestionBased ? 'questions' : 'submission');
  const { data: fileUrl } = useSubmissionFileUrl(!isQuestionBased && submission && 'file_path' in submission ? submission.file_path : null);
  const { data: questions = [] } = useAssignmentQuestions(assignmentId!);
  const submitAssignment = useSubmitAssignment();

  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | number | number[]>>({});
  const [isSubmittingQuestions, setIsSubmittingQuestions] = useState(false);

  const isLoading = assignmentLoading || submissionLoading;
  const isOverdue = assignment ? isPast(new Date(assignment.due_date)) : false;
  const canSubmit = assignment && (!isOverdue || assignment.allow_late_submissions) && !submission?.graded;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !assignment) return;

    const maxSize = (assignment.max_file_size_mb || 10) * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error(t('submitAssignment.fileSizeTooLarge', { size: assignment.max_file_size_mb }));
      return;
    }

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const allowedTypes = assignment.allowed_file_types || ['pdf', 'doc', 'docx', 'txt', 'zip'];
    if (ext && !allowedTypes.includes(ext)) {
      toast.error(t('submitAssignment.fileTypeNotAllowed', { ext, types: allowedTypes.join(', ') }));
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!assignment || (!file && !textContent.trim())) {
      toast.error(t('submitAssignment.pleaseUploadOrEnter'));
      return;
    }

    try {
      await submitAssignment.mutateAsync({
        assignmentId: assignment.id,
        file: file || undefined,
        textContent: textContent.trim() || undefined,
        dueDate: assignment.due_date,
      });
      toast.success(t('submitAssignment.assignmentSubmittedSuccess'));
    } catch {
      toast.error(t('submitAssignment.failedToSubmitAssignment'));
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
      toast.error(t('submitAssignment.unansweredQuestions', { count: unanswered.length }));
      return;
    }

    setIsSubmittingQuestions(true);
    try {
      // Auto-grade MC and multi-select questions
      let autoScore = 0;
      let totalAutoGradablePoints = 0;
      let hasEssayQuestions = false;

      questions.forEach(q => {
        const studentAnswer = answers[q.id];

        if (q.type === 'multiple-choice' && q.correct_answer !== null) {
          totalAutoGradablePoints += q.points;
          if (studentAnswer === q.correct_answer) {
            autoScore += q.points;
          }
        } else if (q.type === 'multi-select' && q.correct_answers) {
          totalAutoGradablePoints += q.points;
          const studentAnswers = (studentAnswer as number[]) || [];
          const correctAnswers = q.correct_answers;
          // Full credit if arrays match exactly
          const isCorrect =
            studentAnswers.length === correctAnswers.length &&
            studentAnswers.every(a => correctAnswers.includes(a));
          if (isCorrect) {
            autoScore += q.points;
          }
        } else if (q.type === 'essay') {
          hasEssayQuestions = true;
        }
      });

      // If all questions are auto-gradable, mark as graded
      const isFullyAutoGraded = !hasEssayQuestions;

      const { error } = await supabase
        .from('assignment_question_submissions')
        .insert({
          assignment_id: assignment.id,
          student_id: user.id,
          answers: answers,
          score: isFullyAutoGraded ? autoScore : null,
          graded: isFullyAutoGraded,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['my-assignment-submission', assignmentId] });

      if (isFullyAutoGraded) {
        toast.success(t('submitAssignment.scoreAutoGraded', { score: autoScore, max: assignment.max_points }));
      } else {
        toast.success(t('submitAssignment.awaitingTeacherReview'));
      }
      navigate('/student/assignments');
    } catch {
      toast.error(t('submitAssignment.failedToSubmitAssignment'));
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
    return <div>{t('submitAssignment.assignmentNotFound')}</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/student/assignments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t('assignments.due')}: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
            </span>
            <span className="text-muted-foreground">{assignment.max_points} {t('common.points')}</span>
            <Badge variant="outline">
              {isQuestionBased ? t('submitAssignment.questionBased') : t('submitAssignment.fileSubmission')}
            </Badge>
            {isOverdue && !submission && (
              <Badge variant="destructive">{t('submitAssignment.overdue')}</Badge>
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
                <CardTitle>{t('submitAssignment.description')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{assignment.description}</p>
              </CardContent>
            </Card>
          )}

          {assignment.instructions && (
            <Card>
              <CardHeader>
                <CardTitle>{t('submitAssignment.instructions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{assignment.instructions}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Submission Already Made - Question Based */}
      {submission && isQuestionBased && 'answers' in submission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t('submitAssignment.submitted')}
            </CardTitle>
            <CardDescription>
              {format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show submitted answers */}
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground">{t('submitAssignment.yourAnswers')}</Label>
              {questions.map((q, index) => {
                const answer = submission.answers[q.id];
                const isCorrect = q.type === 'multiple-choice'
                  ? answer === q.correct_answer
                  : q.type === 'multi-select' && q.correct_answers
                    ? (answer as number[])?.length === q.correct_answers.length &&
                    (answer as number[])?.every(a => q.correct_answers!.includes(a))
                    : null;

                const isGraded = submission.graded && q.type !== 'essay';

                return (
                  <div key={q.id} className="p-5 border rounded-xl space-y-4 bg-card shadow-sm">
                    {/* Question Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="font-medium text-base leading-relaxed">
                        {index + 1}. <FormulaText text={q.question} />
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {q.points} {t('common.pts')}
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      {/* Student Answer Block */}
                      <div className={cn(
                        "p-4 rounded-lg border text-sm transition-colors",
                        isGraded
                          ? (isCorrect
                            ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30"
                            : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30")
                          : "bg-muted/30 border-border"
                      )}>
                        <div className="flex justify-between items-center mb-2">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            isGraded
                              ? (isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")
                              : "text-muted-foreground"
                          )}>
                            {t('submitAssignment.yourAnswer')}
                          </span>
                          {isGraded && (
                            <Badge variant={isCorrect ? "default" : "destructive"} className={cn(isCorrect && "bg-green-600 hover:bg-green-700")}>
                              {isCorrect ? t('submitAssignment.correct') : t('submitAssignment.incorrect')}
                            </Badge>
                          )}
                        </div>

                        {q.type === 'essay' && (
                          <div className="whitespace-pre-wrap">{answer as string || <span className="text-muted-foreground italic">{t('submitAssignment.noAnswer')}</span>}</div>
                        )}
                        {q.type === 'multiple-choice' && q.options && (
                          <div className="font-medium">
                            {(q.options as string[])[answer as number] || <span className="text-muted-foreground italic">{t('submitAssignment.noAnswer')}</span>}
                          </div>
                        )}
                        {q.type === 'multi-select' && q.options && (
                          <div className="font-medium">
                            {(answer as number[])?.map(i => (q.options as string[])[i]).join(', ') || <span className="text-muted-foreground italic">{t('submitAssignment.noAnswer')}</span>}
                          </div>
                        )}
                      </div>

                      {/* Correct Answer Block (Only if incorrect) */}
                      {isGraded && !isCorrect && (q.type === 'multiple-choice' || q.type === 'multi-select') && (
                        <div className="p-4 rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/5 text-sm">
                          <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400 mb-2 block">
                            {q.type === 'multi-select' ? t('submitAssignment.correctAnswers') : t('submitAssignment.correctAnswer')}
                          </span>
                          <div className="font-medium text-foreground">
                            {q.type === 'multiple-choice' && q.options && q.correct_answer !== null && (
                              (q.options as string[])[q.correct_answer]
                            )}
                            {q.type === 'multi-select' && q.options && q.correct_answers && (
                              q.correct_answers.map(i => (q.options as string[])[i]).join(', ')
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {submission.graded && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm text-muted-foreground">{t('submitAssignment.score')}</Label>
                  <p className="text-2xl font-bold">
                    {submission.score} / {assignment.max_points}
                  </p>
                </div>
                {'feedback' in submission && submission.feedback && (
                  <div>
                    <Label className="text-sm text-muted-foreground">{t('submitAssignment.teacherFeedback')}</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap p-3 bg-muted rounded-lg">
                      {submission.feedback}
                    </p>
                  </div>
                )}
              </>
            )}

            {!submission.graded && (
              <p className="text-sm text-muted-foreground">
                {t('submitAssignment.pendingReview')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Already Made - File Based */}
      {submission && !isQuestionBased && 'file_path' in submission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t('submitAssignment.submitted')}
            </CardTitle>
            <CardDescription>
              {format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
              {submission.is_late && (
                <Badge variant="destructive" className="ml-2">{t('submitAssignment.late')}</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.file_name && (
              <div>
                <Label className="text-sm text-muted-foreground">{t('submitAssignment.submittedFile')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{submission.file_name}</span>
                </div>
                {fileUrl && (
                  <Button variant="link" size="sm" className="px-0" asChild>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      {t('common.download')}
                    </a>
                  </Button>
                )}
              </div>
            )}

            {submission.graded && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm text-muted-foreground">{t('submitAssignment.score')}</Label>
                  <p className="text-2xl font-bold">
                    {submission.score} / {assignment.max_points}
                  </p>
                </div>
                {submission.feedback && (
                  <div>
                    <Label className="text-sm text-muted-foreground">{t('submitAssignment.feedback')}</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{submission.feedback}</p>
                  </div>
                )}
              </>
            )}

            {!submission.graded && (
              <p className="text-sm text-muted-foreground">
                {t('submitAssignment.pendingReview')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Question-Based Assignment */}
      {!submission && isQuestionBased && questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('submitAssignment.questions')}</CardTitle>
            <CardDescription>
              {t('submitAssignment.answerAllQuestions', { count: questions.length })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isOverdue && assignment.allow_late_submissions && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-600">{t('submitAssignment.lateSubmission')}</p>
                  <p className="text-muted-foreground">
                    {t('submitAssignment.latePenaltyApplied', { percent: assignment.late_penalty_percent })}
                  </p>
                </div>
              </div>
            )}

            {isOverdue && !assignment.allow_late_submissions ? (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">{t('submitAssignment.submissionClosed')}</p>
                  <p className="text-muted-foreground">
                    {t('submitAssignment.noLongerAccepts')}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {questions.map((q, index) => (
                  <div key={q.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-medium">
                        {index + 1}. <FormulaText text={q.question} />
                      </p>
                      <Badge variant="outline">{q.points} {t('common.pts')}</Badge>
                    </div>

                    {q.type === 'multiple-choice' && q.options && (
                      <RadioGroup
                        value={answers[q.id]?.toString()}
                        onValueChange={(value) => setAnswers({ ...answers, [q.id]: parseInt(value) })}
                      >
                        {(q.options as string[]).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={optIndex.toString()} id={`${q.id}-${optIndex}`} />
                            <Label htmlFor={`${q.id}-${optIndex}`}><FormulaText text={option} /></Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {q.type === 'multi-select' && q.options && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">{t('submitAssignment.selectAllThatApply')}</p>
                        {(q.options as string[]).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${q.id}-${optIndex}`}
                              checked={((answers[q.id] as number[]) || []).includes(optIndex)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange(q.id, optIndex, checked as boolean)
                              }
                            />
                            <Label htmlFor={`${q.id}-${optIndex}`}><FormulaText text={option} /></Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'essay' && (
                      <Textarea
                        value={(answers[q.id] as string) || ''}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        placeholder={t('submitAssignment.enterYourAnswer')}
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
                  {t('submitAssignment.submitAssignment')}
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
            <CardTitle>{t('submitAssignment.submitAssignment')}</CardTitle>
            <CardDescription>
              {t('submitAssignment.uploadOrEnterText')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isOverdue && assignment.allow_late_submissions && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-600">{t('submitAssignment.lateSubmission')}</p>
                  <p className="text-muted-foreground">
                    {t('submitAssignment.latePenaltyApplied', { percent: assignment.late_penalty_percent })}
                  </p>
                </div>
              </div>
            )}

            {isOverdue && !assignment.allow_late_submissions ? (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">{t('submitAssignment.submissionClosed')}</p>
                  <p className="text-muted-foreground">
                    {t('submitAssignment.noLongerAccepts')}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{t('submitAssignment.uploadFile')}</Label>
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
                      {t('submitAssignment.chooseFile')}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('submitAssignment.maxSize')}: {assignment.max_file_size_mb}MB.
                    {t('submitAssignment.allowed')}: {assignment.allowed_file_types?.join(', ')}
                  </p>
                </div>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    {t('submitAssignment.or')}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label>{t('submitAssignment.textContent')}</Label>
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder={t('submitAssignment.enterAnswerHere')}
                    rows={6}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={submitAssignment.isPending || (!file && !textContent.trim())}
                >
                  {submitAssignment.isPending ? t('submitAssignment.submitting') : t('submitAssignment.submitAssignment')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}