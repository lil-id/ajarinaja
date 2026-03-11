import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, isPast } from 'date-fns';
import { ArrowLeft, Upload, FileText, Calendar, CheckCircle, AlertTriangle, X, Loader2, Clock, XCircle, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useAssignment, useMyAssignmentSubmission, useSubmitAssignment, useSubmissionFileUrl } from '@/hooks/useAssignments';
import { useAssignmentQuestions, AssignmentQuestion } from '@/hooks/useAssignmentQuestions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
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

  // Calculate stats for Question-Based submissions
  const mcQuestions = questions.filter((q) => q.type === 'multiple-choice');
  const multiSelectQuestions = questions.filter((q) => q.type === 'multi-select');
  const essayQuestions = questions.filter((q) => q.type === 'essay');

  let mcCorrect = 0;
  const mcTotal = mcQuestions.length;
  let msCorrect = 0;
  const msTotal = multiSelectQuestions.length;

  if (submission && isQuestionBased && 'answers' in submission) {
    mcQuestions.forEach((q) => {
      const answer = submission.answers[q.id];
      if (answer !== undefined && Number(answer) === q.correct_answer) {
        mcCorrect++;
      }
    });

    multiSelectQuestions.forEach((q) => {
      const answer = submission.answers[q.id];
      const studentAnswers = Array.isArray(answer) ? answer.map(Number).sort() : [];
      const correctAnswers = Array.isArray(q.correct_answers) ? [...q.correct_answers].sort() : [];
      if (JSON.stringify(studentAnswers) === JSON.stringify(correctAnswers)) {
        msCorrect++;
      }
    });
  }

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

      {/* Global Submission Header (Shown only if submitted) */}
      {submission && (
        <Card className="border-0 shadow-card overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white shadow-inner">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-white/80 text-sm mb-1">{t('submitAssignment.yourScore')}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">
                    {submission.graded ? submission.score : '—'}
                  </span>
                  <span className="text-2xl text-white/80">/ {assignment.max_points}</span>
                </div>
                {submission.graded && submission.score !== null && (
                  <p className={cn("text-lg font-medium mt-2", "text-white")}>
                    {Math.round((submission.score / assignment.max_points) * 100)}%
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {submission.graded ? (
                  <Badge variant="secondary" className="text-sm px-4 py-1 bg-white/20 hover:bg-white/30 text-white border-0">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {t('submitAssignment.graded')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-sm px-4 py-1 bg-amber-100 text-amber-700 border-amber-300">
                    <Clock className="w-4 h-4 mr-1" />
                    {t('submitAssignment.pendingReview')}
                  </Badge>
                )}
                <div className="text-right">
                  <p className="text-sm text-white/90">
                    {t('submitAssignment.submitted')} {format(new Date(submission.submitted_at), 'dd MMM yyyy, HH:mm')}
                  </p>
                  {'is_late' in submission && submission.is_late && (
                    <Badge variant="destructive" className="mt-1 border-0">{t('submitAssignment.late')}</Badge>
                  )}
                </div>
              </div>
            </div>
            {submission.graded && submission.score !== null && (
              <div className="mt-4">
                <Progress value={(submission.score / assignment.max_points) * 100} className="h-3 bg-black/20 [&>div]:bg-white" />
              </div>
            )}
          </div>

          {/* Stats Row for Question-Based Assignment */}
          {submission.graded && isQuestionBased && (
            <CardContent className="p-6 bg-card">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{mcCorrect + msCorrect}</p>
                  <p className="text-sm text-muted-foreground">{t('submitAssignment.correct')}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{(mcTotal - mcCorrect) + (msTotal - msCorrect)}</p>
                  <p className="text-sm text-muted-foreground">{t('submitAssignment.incorrect')}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{msTotal}</p>
                  <p className="text-sm text-muted-foreground">{t('examResults.multiSelect') || 'Multi-Pilihan'}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                    <AlignLeft className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{essayQuestions.length}</p>
                  <p className="text-sm text-muted-foreground">{t('examResults.essays') || 'Esai'}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

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
        <div className="space-y-4">
          <h2 className="text-xl font-bold mt-8 mb-4">{t('submitAssignment.yourAnswers')}</h2>
          <div className="space-y-6">
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
                  <div className="space-y-2">
                    {q.image_url && (
                      <div className="mb-2">
                        <img
                          src={q.image_url}
                          alt="Question"
                          className="w-full h-auto max-h-[600px] object-contain rounded-lg border bg-muted/30"
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-start gap-4">
                      <div className="font-medium text-base leading-relaxed flex items-start">
                        <span className="text-muted-foreground mr-2">Q{index + 1}.</span>
                        <div><FormulaText text={q.question} /></div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {q.points} {t('common.pts')}
                      </Badge>
                    </div>
                  </div>

                  {/* Answer Display */}
                  {(q.type === 'multiple-choice' || q.type === 'multi-select') && q.options ? (
                    <div className="mt-4 space-y-3">
                      {q.options.map((option, optIdx) => {
                        const isString = typeof option === 'string';
                        const text = isString ? option : option.text;
                        const imageUrl = !isString ? option.image_url : undefined;

                        const isSelected = q.type === 'multiple-choice'
                          ? answer === optIdx
                          : Array.isArray(answer) && answer.includes(optIdx);

                        const isCorrectOption = q.type === 'multiple-choice'
                          ? q.correct_answer === optIdx
                          : Array.isArray(q.correct_answers) && q.correct_answers.includes(optIdx);

                        return (
                          <div
                            key={optIdx}
                            className={cn(
                              "flex items-start gap-4 p-4 rounded-xl border transition-all",
                              isGraded
                                ? isCorrectOption
                                  ? "bg-green-50/50 border-green-200"
                                  : isSelected
                                    ? "bg-red-50/50 border-red-200"
                                    : "bg-card border-border/50 text-muted-foreground"
                                : isSelected
                                  ? "bg-primary/5 border-primary/20"
                                  : "bg-card border-border/50 text-muted-foreground"
                            )}
                          >
                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full border text-sm font-medium flex-shrink-0",
                              isGraded
                                ? isCorrectOption
                                  ? "bg-green-100 border-green-300 text-green-700"
                                  : isSelected
                                    ? "bg-red-100 border-red-300 text-red-700"
                                    : "bg-muted border-muted-foreground/30"
                                : isSelected
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "bg-muted border-muted-foreground/30"
                            )}>
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            <div className="flex-1">
                              <span className={cn(
                                "block",
                                isGraded && isCorrectOption && "text-green-700 font-medium",
                                isGraded && isSelected && !isCorrectOption && "text-red-700",
                                !isGraded && isSelected && "text-primary font-medium"
                              )}>
                                <FormulaText text={text} />
                              </span>
                              {imageUrl && (
                                <img
                                  src={imageUrl}
                                  alt={`Option ${optIdx + 1}`}
                                  className="mt-2 w-full h-auto max-h-[400px] object-contain rounded border bg-white"
                                />
                              )}
                            </div>
                            {isGraded && isCorrectOption && (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 ml-auto flex-shrink-0">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('submitAssignment.correctAnswer')}
                              </Badge>
                            )}
                            {isGraded && isSelected && !isCorrectOption && (
                              <span className="text-xs text-red-600 font-medium ml-auto flex-shrink-0">{t('submitAssignment.yourAnswer')}</span>
                            )}
                            {!isGraded && isSelected && (
                              <Badge variant="secondary" className="ml-auto flex-shrink-0">
                                {t('submitAssignment.yourAnswer')}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid gap-3 p-4 rounded-lg border bg-muted/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {t('submitAssignment.yourAnswer')}
                        </span>
                      </div>
                      {q.type === 'essay' && (
                        <div className="whitespace-pre-wrap">{answer as string || <span className="text-muted-foreground italic">{t('submitAssignment.noAnswer')}</span>}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {submission.graded && 'feedback' in submission && submission.feedback && (
            <div className="mt-6 p-4 bg-muted/50 rounded-xl border">
              <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('submitAssignment.teacherFeedback')}
              </h3>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {submission.feedback}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Submission Already Made - File Based */}
      {
        submission && !isQuestionBased && 'file_path' in submission && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t('submitAssignment.yourSubmission')}</CardTitle>
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

              {submission.graded && submission.feedback && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm text-muted-foreground">{t('submitAssignment.feedback')}</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{submission.feedback}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )
      }

      {/* Question-Based Assignment */}
      {
        !submission && isQuestionBased && questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('submitAssignment.questions')}</CardTitle>
              <CardDescription>
                {t('submitAssignment.answerAllQuestions')}
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
                    <div key={q.id} className="p-6 border rounded-xl space-y-5 bg-card shadow-sm">
                      <div className="space-y-3">
                        {q.image_url && (
                          <div className="mb-4">
                            <img
                              src={q.image_url}
                              alt="Question"
                              className="max-h-80 w-full object-contain rounded-xl border bg-muted/30"
                            />
                          </div>
                        )}
                        <div className="flex justify-between items-start gap-4">
                          <div className="font-semibold text-lg leading-relaxed flex items-start">
                            <span className="text-muted-foreground mr-2">{index + 1}.</span>
                            <div><FormulaText text={q.question} /></div>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {q.points} {t('common.pts')}
                          </Badge>
                        </div>
                      </div>

                      {q.type === 'multiple-choice' && q.options && (
                        <RadioGroup
                          value={answers[q.id]?.toString()}
                          onValueChange={(value) => setAnswers({ ...answers, [q.id]: parseInt(value) })}
                          className="space-y-3"
                        >
                          {q.options.map((option, optIndex) => {
                            const isString = typeof option === 'string';
                            const text = isString ? option : option.text;
                            const imageUrl = !isString ? option.image_url : undefined;
                            const isSelected = answers[q.id] === optIndex;

                            return (
                              <div
                                key={optIndex}
                                onClick={() => setAnswers({ ...answers, [q.id]: optIndex })}
                                className={cn(
                                  "flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group",
                                  isSelected
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                                )}
                              >
                                <RadioGroupItem
                                  value={optIndex.toString()}
                                  id={`${q.id}-${optIndex}`}
                                  className="mt-1"
                                />
                                <Label
                                  htmlFor={`${q.id}-${optIndex}`}
                                  className="flex-1 cursor-pointer font-normal"
                                  onClick={(e) => e.preventDefault()} // Let the div handle it
                                >
                                  <div className="flex flex-col gap-2">
                                    <div className={cn(
                                      "text-base leading-relaxed transition-colors",
                                      isSelected ? "text-primary font-medium" : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                      <FormulaText text={text} />
                                    </div>
                                    {imageUrl && (
                                      <img
                                        src={imageUrl}
                                        alt={`Option ${optIndex + 1}`}
                                        className="mt-2 w-full h-auto max-h-[400px] object-contain rounded-lg border bg-white"
                                      />
                                    )}
                                  </div>
                                </Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      )}

                      {q.type === 'multi-select' && q.options && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-primary flex items-center gap-2 mb-4">
                            <AlignLeft className="w-4 h-4" />
                            {t('submitAssignment.selectAllThatApply')}
                          </p>
                          {q.options.map((option, optIndex) => {
                            const isString = typeof option === 'string';
                            const text = isString ? option : option.text;
                            const imageUrl = !isString ? option.image_url : undefined;
                            const currentAnswers = (answers[q.id] as number[]) || [];
                            const isSelected = currentAnswers.includes(optIndex);

                            return (
                              <div
                                key={optIndex}
                                onClick={() => handleMultiSelectChange(q.id, optIndex, !isSelected)}
                                className={cn(
                                  "flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group",
                                  isSelected
                                    ? "border-secondary bg-secondary/5 shadow-sm"
                                    : "border-border hover:border-secondary/30 hover:bg-muted/30"
                                )}
                              >
                                <Checkbox
                                  id={`${q.id}-${optIndex}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleMultiSelectChange(q.id, optIndex, checked as boolean)
                                  }
                                  className="mt-1"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Label
                                  htmlFor={`${q.id}-${optIndex}`}
                                  className="flex-1 cursor-pointer font-normal"
                                  onClick={(e) => e.preventDefault()} // Let the div handle it
                                >
                                  <div className="flex flex-col gap-2">
                                    <div className={cn(
                                      "text-base leading-relaxed transition-colors",
                                      isSelected ? "text-secondary font-medium" : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                      <FormulaText text={text} />
                                    </div>
                                    {imageUrl && (
                                      <img
                                        src={imageUrl}
                                        alt={`Option ${optIndex + 1}`}
                                        className="mt-2 w-full h-auto max-h-[400px] object-contain rounded-lg border bg-white"
                                      />
                                    )}
                                  </div>
                                </Label>
                              </div>
                            );
                          })}
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
        )
      }

      {/* File-Based Assignment */}
      {
        !submission && !isQuestionBased && (
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
        )
      }

      {/* Bottom Back Button if submitted */}
      {
        submission && (
          <div className="flex justify-center mt-8 border-t pt-6">
            <Button onClick={() => navigate('/student/assignments')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.backToAssignments')}
            </Button>
          </div>
        )
      }
    </div >
  );
}