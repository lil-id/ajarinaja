import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Download, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAssignment, useAssignmentSubmissions, useGradeAssignment, useSubmissionFileUrl } from '@/hooks/useAssignments';
import { useAssignmentQuestions } from '@/hooks/useAssignmentQuestions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface GradeDialogProps {
  submission: any;
  assignment: any;
  questions?: any[];
  open: boolean;
  onClose: () => void;
  isQuestionBased: boolean;
}

/**
 * Dialog for grading a submission.
 * Handles both file-based (rubric/manual) and question-based grading.
 * 
 * @param props.submission - The submission to grade
 * @param props.assignment - The parent assignment
 * @param props.questions - Questions list (if question-based)
 * @param props.open - Dialog open state
 * @param props.onClose - Close handler
 * @param props.isQuestionBased - Whether it's a quiz-style assignment
 */
function GradeDialog({ submission, assignment, questions = [], open, onClose, isQuestionBased }: GradeDialogProps) {
  const { t } = useTranslation();
  const [score, setScore] = useState(submission?.score?.toString() || '');
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(
    Object.fromEntries(submission?.rubric_scores?.map((r: any) => [r.id, r.score]) || [])
  );

  const gradeAssignment = useGradeAssignment();
  const { data: fileUrl } = useSubmissionFileUrl(submission?.file_path);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleGrade = async () => {
    const finalScore = parseInt(score);
    if (isNaN(finalScore) || finalScore < 0 || finalScore > assignment.max_points) {
      toast.error(t('toast.scoreMustBeBetween', { max: assignment.max_points }));
      return;
    }

    try {
      if (isQuestionBased) {
        // Grade question-based submission with feedback
        const { error } = await supabase
          .from('assignment_question_submissions')
          .update({
            score: finalScore,
            graded: true,
            feedback: feedback || null,
          })
          .eq('id', submission.id);

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
        toast.success(t('toast.submissionGraded'));
        onClose();
      } else {
        // Grade file-based submission
        await gradeAssignment.mutateAsync({
          submissionId: submission.id,
          score: finalScore,
          feedback,
          rubricScores: Object.entries(rubricScores).map(([id, score]) => ({ id, score })),
        });
        toast.success(t('toast.submissionGraded'));
        onClose();
      }
    } catch {
      toast.error(t('toast.failedToGradeSubmission'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('submissionsPage.gradeSubmission')}</DialogTitle>
          <DialogDescription>
            {t('students.student')}: {submission?.student?.name || t('submissionsPage.unknown')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>{t('assignments.submitted')}</Label>
            <p className="text-sm text-muted-foreground">
              {submission?.submitted_at && format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
              {submission?.is_late && (
                <Badge variant="destructive" className="ml-2">{t('assignments.late')}</Badge>
              )}
            </p>
          </div>

          {/* Question-based submission view */}
          {isQuestionBased && submission?.answers && (
            <div className="space-y-3">
              <Label>{t('submissionsPage.studentAnswers')}</Label>
              {questions.map((q, index) => {
                const answer = submission.answers[q.id];
                return (
                  <div key={q.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{index + 1}. {q.question}</p>
                      <Badge variant="outline">{q.points} {t('common.pts')}</Badge>
                    </div>
                    <div className="text-sm bg-muted p-2 rounded">
                      {q.type === 'essay' && (
                        <p className="whitespace-pre-wrap">{answer as string || t('submissionsPage.noAnswer')}</p>
                      )}
                      {q.type === 'multiple-choice' && q.options && (
                        <div>
                          <p>
                            <strong>{t('submissionsPage.answer')}:</strong>{' '}
                            {(() => {
                              const ansIdx = answer as number;
                              const opt = q.options![ansIdx];
                              if (!opt) return t('submissionsPage.noAnswer');
                              return typeof opt === 'string' ? opt : (
                                <span className="inline-flex flex-col align-top">
                                  <span>{opt.text}</span>
                                  {opt.image_url && (
                                    <img src={opt.image_url} alt="Answer" className="h-12 w-auto object-contain rounded border mt-1" />
                                  )}
                                </span>
                              );
                            })()}
                          </p>
                          <div className="text-xs text-muted-foreground mt-1">
                            {t('submissionsPage.correct')}:{' '}
                            {(() => {
                              const opt = q.options![q.correct_answer];
                              if (!opt) return null;
                              return typeof opt === 'string' ? opt : (
                                <span className="inline-flex flex-col align-top">
                                  <span>{opt.text}</span>
                                  {opt.image_url && (
                                    <img src={opt.image_url} alt="Correct" className="h-12 w-auto object-contain rounded border mt-1" />
                                  )}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      {q.type === 'multi-select' && q.options && (
                        <div>
                          <p>
                            <strong>{t('submissionsPage.answer')}:</strong>{' '}
                            {(() => {
                              const ansIndices = (answer as number[]) || [];
                              if (ansIndices.length === 0) return t('submissionsPage.noAnswer');
                              return (
                                <div className="flex flex-col gap-1 mt-1">
                                  {ansIndices.map(i => {
                                    const opt = q.options![i];
                                    if (!opt) return null;
                                    return (
                                      <div key={i} className="flex gap-2 items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/50" />
                                        {typeof opt === 'string' ? (
                                          <span>{opt}</span>
                                        ) : (
                                          <div className="flex flex-col">
                                            <span>{opt.text}</span>
                                            {opt.image_url && (
                                              <img src={opt.image_url} alt="Answer" className="h-12 w-auto object-contain rounded border mt-1" />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </p>
                          <div className="text-xs text-muted-foreground mt-2">
                            <p className="mb-1">{t('submissionsPage.correct')}:</p>
                            <div className="flex flex-col gap-1">
                              {q.correct_answers?.map((i: number) => {
                                const opt = q.options![i];
                                if (!opt) return null;
                                return (
                                  <div key={i} className="flex gap-2 items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    {typeof opt === 'string' ? (
                                      <span>{opt}</span>
                                    ) : (
                                      <div className="flex flex-col">
                                        <span>{opt.text}</span>
                                        {opt.image_url && (
                                          <img src={opt.image_url} alt="Correct" className="h-12 w-auto object-contain rounded border mt-1" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* File-based submission view */}
          {!isQuestionBased && submission?.file_name && (
            <div className="space-y-2">
              <Label>{t('submissionsPage.submittedFile')}</Label>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{submission.file_name}</span>
                {fileUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-1" />
                      {t('common.download')}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {!isQuestionBased && submission?.text_content && (
            <div className="space-y-2">
              <Label>{t('submissionsPage.textSubmission')}</Label>
              <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {submission.text_content}
              </div>
            </div>
          )}

          {/* Rubric scoring for file-based */}
          {!isQuestionBased && assignment?.rubric?.length > 0 && (
            <div className="space-y-3">
              <Label>{t('submissionsPage.rubricScoring')}</Label>
              {assignment.rubric.map((item: any) => (
                <div key={item.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.criterion}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={item.maxPoints}
                        value={rubricScores[item.id] || ''}
                        onChange={(e) => setRubricScores({
                          ...rubricScores,
                          [item.id]: parseInt(e.target.value) || 0
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">/ {item.maxPoints}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('submissionsPage.totalScore')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={assignment?.max_points}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-24"
              />
              <span className="text-muted-foreground">/ {assignment?.max_points}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('submissionsPage.feedback')}</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('submissionsPage.feedbackPlaceholder')}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button onClick={handleGrade} disabled={gradeAssignment.isPending}>
              {gradeAssignment.isPending ? t('common.saving') : t('submissionsPage.saveGrade')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Assignment Submissions page.
 * 
 * Displays list of submissions for a specific assignment.
 * Features:
 * - List of all students (submitted vs missing)
 * - Grading interface (via GradeDialog)
 * - Status badges (Late, Graded, Pending)
 * - Stats overview
 * 
 * @returns {JSX.Element} The rendered Submissions page.
 */
export default function AssignmentSubmissions() {
  const { t } = useTranslation();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { data: assignment, isLoading: assignmentLoading } = useAssignment(assignmentId!);

  const isQuestionBased = (assignment as any)?.assignment_type === 'questions';
  const { data: submissions = [], isLoading: submissionsLoading } = useAssignmentSubmissions(
    assignmentId!,
    isQuestionBased ? 'questions' : 'submission'
  );
  const { data: questions = [] } = useAssignmentQuestions(assignmentId!);
  const [gradeSubmission, setGradeSubmission] = useState<any>(null);

  const isLoading = assignmentLoading || submissionsLoading;

  const gradedCount = submissions.filter((s: any) => s.graded).length;
  const lateCount = submissions.filter((s: any) => s.is_late).length;
  const avgScore = submissions.filter((s: any) => s.graded && s.score !== null)
    .reduce((sum: number, s: any) => sum + (s.score || 0), 0) / (gradedCount || 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!assignment) {
    return <div>{t('submissionsPage.assignmentNotFound')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/assignments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{assignment.title}</h1>
            <Badge variant="outline">
              {isQuestionBased ? t('submissionsPage.questionBased') : t('submissionsPage.fileSubmission')}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {t('assignments.dueDate')}: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('submissionsPage.totalSubmissions')}</CardDescription>
            <CardTitle className="text-2xl">{submissions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('assignments.graded')}</CardDescription>
            <CardTitle className="text-2xl">{gradedCount} / {submissions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(gradedCount / submissions.length) * 100 || 0} className="h-2" />
          </CardContent>
        </Card>
        {!isQuestionBased && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('submissionsPage.lateSubmissions')}</CardDescription>
              <CardTitle className="text-2xl">{lateCount}</CardTitle>
            </CardHeader>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.averageScore')}</CardDescription>
            <CardTitle className="text-2xl">
              {gradedCount > 0 ? `${avgScore.toFixed(1)} / ${assignment.max_points}` : 'N/A'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('assignments.submissions')}</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('submissionsPage.noSubmissionsYet')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('students.student')}</TableHead>
                  <TableHead>{t('assignments.submitted')}</TableHead>
                  <TableHead>{t('courses.status')}</TableHead>
                  <TableHead>{t('exams.score')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission: any) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{submission.student?.name || t('submissionsPage.unknown')}</p>
                        <p className="text-sm text-muted-foreground">{submission.student?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(submission.submitted_at), 'MMM d, h:mm a')}
                        {submission.is_late && (
                          <Badge variant="destructive" className="text-xs">{t('assignments.late')}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission.graded ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t('assignments.graded')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {t('common.pending')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.graded && submission.score !== null ? (
                        <span>{submission.score} / {assignment.max_points}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGradeSubmission(submission)}
                      >
                        {submission.graded ? t('submissionsPage.viewEdit') : t('assignments.grade')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {gradeSubmission && (
        <GradeDialog
          submission={gradeSubmission}
          assignment={assignment}
          questions={questions}
          open={!!gradeSubmission}
          onClose={() => setGradeSubmission(null)}
          isQuestionBased={isQuestionBased}
        />
      )}
    </div>
  );
}