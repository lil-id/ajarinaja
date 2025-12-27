import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useExamWithQuestions, Question } from '@/hooks/useExams';
import { useSubmissionsWithStudents, useGradeSubmission, SubmissionWithStudent } from '@/hooks/useSubmissions';
import { ArrowLeft, CheckCircle, AlignLeft, Loader2, User, Clock, Award, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const GradeExam = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { data: exam, isLoading: examLoading } = useExamWithQuestions(examId || '');
  const { submissions, isLoading: submissionsLoading } = useSubmissionsWithStudents(examId || '');
  const gradeSubmission = useGradeSubmission();
  
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});

  const isLoading = examLoading || submissionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Exam not found</p>
        <Button variant="ghost" onClick={() => navigate('/teacher/exams')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exams
        </Button>
      </div>
    );
  }

  const questions = exam.questions || [];
  const essayQuestions = questions.filter((q: Question) => q.type === 'essay');
  const mcQuestions = questions.filter((q: Question) => q.type === 'multiple-choice');

  const calculateMCScore = (submission: SubmissionWithStudent) => {
    let score = 0;
    mcQuestions.forEach((q: Question) => {
      const answer = submission.answers[q.id];
      if (answer !== undefined && Number(answer) === q.correct_answer) {
        score += q.points;
      }
    });
    return score;
  };

  const handleSelectSubmission = (submission: SubmissionWithStudent) => {
    setSelectedSubmission(submission);
    // Initialize essay scores
    const initialScores: Record<string, number> = {};
    essayQuestions.forEach((q: Question) => {
      initialScores[q.id] = 0;
    });
    setEssayScores(initialScores);
  };

  const handleGrade = async () => {
    if (!selectedSubmission) return;

    const mcScore = calculateMCScore(selectedSubmission);
    const essayScore = Object.values(essayScores).reduce((sum, s) => sum + s, 0);
    const totalScore = mcScore + essayScore;

    try {
      await gradeSubmission.mutateAsync({
        submissionId: selectedSubmission.id,
        score: totalScore,
        essayScores,
      });
      toast.success('Submission graded successfully!');
      setSelectedSubmission(null);
      setEssayScores({});
    } catch (error) {
      toast.error('Failed to grade submission');
    }
  };

  const ungradedCount = submissions.filter(s => !s.graded).length;
  const gradedCount = submissions.filter(s => s.graded).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/exams')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
          <p className="text-muted-foreground">Grade student submissions</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            {ungradedCount} ungraded
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {gradedCount} graded
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-foreground">Submissions ({submissions.length})</h2>
          
          {submissions.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No submissions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {submissions.map((submission) => (
                <Card 
                  key={submission.id}
                  className={cn(
                    "border-0 shadow-card cursor-pointer transition-all hover:shadow-card-hover",
                    selectedSubmission?.id === submission.id && "ring-2 ring-secondary"
                  )}
                  onClick={() => handleSelectSubmission(submission)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {submission.student?.name || 'Unknown Student'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {submission.graded ? (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="w-3 h-3" />
                          {submission.score}/{exam.total_points}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Grading Panel */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedSubmission.student?.name || 'Unknown Student'}</CardTitle>
                    <CardDescription>
                      Submitted {new Date(selectedSubmission.submitted_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedSubmission(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Multiple Choice Results */}
                {mcQuestions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-secondary" />
                      Multiple Choice ({calculateMCScore(selectedSubmission)}/{mcQuestions.reduce((sum: number, q: Question) => sum + q.points, 0)} pts)
                    </h3>
                    <div className="space-y-3">
                      {mcQuestions.map((q: Question, idx: number) => {
                        const answer = selectedSubmission.answers[q.id];
                        const isCorrect = answer !== undefined && Number(answer) === q.correct_answer;
                        return (
                          <div 
                            key={q.id} 
                            className={cn(
                              "p-4 rounded-lg border",
                              isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">Q{idx + 1}: {q.question}</p>
                                <p className="text-sm mt-1">
                                  <span className="text-muted-foreground">Answer: </span>
                                  {q.options && answer !== undefined ? q.options[Number(answer)] : 'No answer'}
                                </p>
                                {!isCorrect && q.options && q.correct_answer !== null && (
                                  <p className="text-sm text-green-700 mt-1">
                                    Correct: {q.options[q.correct_answer]}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isCorrect ? (
                                  <Check className="w-5 h-5 text-green-600" />
                                ) : (
                                  <X className="w-5 h-5 text-red-600" />
                                )}
                                <span className="text-sm font-medium">
                                  {isCorrect ? q.points : 0}/{q.points}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {mcQuestions.length > 0 && essayQuestions.length > 0 && <Separator />}

                {/* Essay Questions */}
                {essayQuestions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <AlignLeft className="w-5 h-5 text-primary" />
                      Essay Questions (Grade manually)
                    </h3>
                    <div className="space-y-6">
                      {essayQuestions.map((q: Question, idx: number) => {
                        const answer = selectedSubmission.answers[q.id];
                        return (
                          <div key={q.id} className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-start justify-between mb-3">
                              <p className="font-medium text-sm">Q{mcQuestions.length + idx + 1}: {q.question}</p>
                              <span className="text-xs text-muted-foreground">{q.points} pts</span>
                            </div>
                            <div className="bg-background p-4 rounded-lg mb-4 min-h-[100px]">
                              <p className="text-sm whitespace-pre-wrap">
                                {answer ? String(answer) : <em className="text-muted-foreground">No answer provided</em>}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Label htmlFor={`score-${q.id}`} className="text-sm whitespace-nowrap">
                                Score:
                              </Label>
                              <Input
                                id={`score-${q.id}`}
                                type="number"
                                min={0}
                                max={q.points}
                                value={essayScores[q.id] || 0}
                                onChange={(e) => setEssayScores({
                                  ...essayScores,
                                  [q.id]: Math.min(q.points, Math.max(0, Number(e.target.value)))
                                })}
                                className="w-20"
                              />
                              <span className="text-sm text-muted-foreground">/ {q.points}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Total & Submit */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Score</p>
                    <p className="text-2xl font-bold text-foreground">
                      {calculateMCScore(selectedSubmission) + Object.values(essayScores).reduce((sum, s) => sum + s, 0)}
                      <span className="text-muted-foreground font-normal text-lg">/{exam.total_points}</span>
                    </p>
                  </div>
                  <Button 
                    variant="hero" 
                    size="lg" 
                    onClick={handleGrade}
                    disabled={gradeSubmission.isPending}
                  >
                    {gradeSubmission.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit Grade
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-card h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Select a submission</h3>
                <p className="text-muted-foreground">
                  Click on a submission to review and grade it
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradeExam;
