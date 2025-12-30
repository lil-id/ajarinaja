import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useExamWithQuestions, Question } from '@/hooks/useExams';
import { useSubmissionsWithStudents, useGradeSubmission, SubmissionWithStudent } from '@/hooks/useSubmissions';
import { useBadges, useAwardBadge, useStudentBadges, useCreateBadge } from '@/hooks/useBadges';
import { ArrowLeft, CheckCircle, AlignLeft, Loader2, User, Clock, Award, Check, X, Trophy, Star, TrendingUp, Zap, Plus, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BADGE_ICONS: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  'trending-up': TrendingUp,
  zap: Zap,
  award: Award,
};

const BADGE_COLORS: Record<string, string> = {
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  blue: 'bg-blue-100 text-blue-700 border-blue-300',
  green: 'bg-green-100 text-green-700 border-green-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-300',
};

const GradeExam = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { data: exam, isLoading: examLoading } = useExamWithQuestions(examId || '');
  const { submissions, isLoading: submissionsLoading } = useSubmissionsWithStudents(examId || '');
  const gradeSubmission = useGradeSubmission();
  const { data: badges = [] } = useBadges();
  const { data: studentBadges = [] } = useStudentBadges();
  const awardBadge = useAwardBadge();
  const createBadge = useCreateBadge();
  
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [showCreateBadge, setShowCreateBadge] = useState(false);
  const [newBadge, setNewBadge] = useState({ name: '', description: '', icon: 'award', color: 'gold' });

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
  const multiSelectQuestions = questions.filter((q: Question) => q.type === 'multi-select');

  const calculateMCScore = (submission: SubmissionWithStudent) => {
    let score = 0;
    // Score multiple-choice questions
    mcQuestions.forEach((q: Question) => {
      const answer = submission.answers[q.id];
      if (answer !== undefined && Number(answer) === q.correct_answer) {
        score += q.points;
      }
    });
    // Score multi-select questions
    multiSelectQuestions.forEach((q: Question) => {
      const answer = submission.answers[q.id];
      const correctAnswers = q.correct_answers || [];
      if (Array.isArray(answer) && correctAnswers.length > 0) {
        const studentAnswers = answer.map(Number).sort();
        const correctSorted = [...correctAnswers].sort();
        // Check if arrays are equal
        if (studentAnswers.length === correctSorted.length && 
            studentAnswers.every((val, idx) => val === correctSorted[idx])) {
          score += q.points;
        }
      }
    });
    return score;
  };

  const handleSelectSubmission = (submission: SubmissionWithStudent) => {
    setSelectedSubmission(submission);
    const initialScores: Record<string, number> = {};
    essayQuestions.forEach((q: Question) => {
      initialScores[q.id] = 0;
    });
    setEssayScores(initialScores);
    setSelectedBadges([]);
  };

  const getStudentBadgesForExam = (studentId: string) => {
    return studentBadges.filter(sb => sb.student_id === studentId && sb.exam_id === examId);
  };

  const handleToggleBadge = (badgeId: string) => {
    setSelectedBadges(prev => 
      prev.includes(badgeId) 
        ? prev.filter(id => id !== badgeId)
        : [...prev, badgeId]
    );
  };

  const handleCreateBadge = async () => {
    if (!newBadge.name.trim()) {
      toast.error('Please enter a badge name');
      return;
    }
    try {
      await createBadge.mutateAsync({
        name: newBadge.name,
        description: newBadge.description || undefined,
        icon: newBadge.icon,
        color: newBadge.color,
      });
      setNewBadge({ name: '', description: '', icon: 'award', color: 'gold' });
      setShowCreateBadge(false);
      toast.success('Badge created!');
    } catch (error) {
      toast.error('Failed to create badge');
    }
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

      // Award selected badges
      for (const badgeId of selectedBadges) {
        const alreadyAwarded = getStudentBadgesForExam(selectedSubmission.student_id)
          .some(sb => sb.badge_id === badgeId);
        
        if (!alreadyAwarded) {
          await awardBadge.mutateAsync({
            studentId: selectedSubmission.student_id,
            badgeId,
            examId: examId!,
            submissionId: selectedSubmission.id,
          });
        }
      }

      toast.success('Submission graded successfully!');
      setSelectedSubmission(null);
      setEssayScores({});
      setSelectedBadges([]);
    } catch (error) {
      toast.error('Failed to grade submission');
    }
  };

  const ungradedCount = submissions.filter(s => !s.graded).length;
  const gradedCount = submissions.filter(s => s.graded).length;
  
  // Calculate pass/fail based on KKM (Minimum Passing Grade)
  const kkm = exam.kkm || 0;
  const gradedSubmissions = submissions.filter(s => s.graded && s.score !== null);
  const passedCount = gradedSubmissions.filter(s => s.score !== null && s.score >= kkm).length;
  const failedCount = gradedSubmissions.filter(s => s.score !== null && s.score < kkm).length;
  
  const getPassStatus = (submission: SubmissionWithStudent) => {
    if (!submission.graded || submission.score === null || kkm === 0) return null;
    return submission.score >= kkm ? 'passed' : 'failed';
  };

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
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            {ungradedCount} ungraded
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {gradedCount} graded
          </Badge>
          {kkm > 0 && gradedCount > 0 && (
            <>
              <Badge className="text-sm bg-green-100 text-green-700 border-green-300">
                {passedCount} passed
              </Badge>
              <Badge className="text-sm bg-red-100 text-red-700 border-red-300">
                {failedCount} failed
              </Badge>
            </>
          )}
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
              {submissions.map((submission) => {
                const submissionBadges = getStudentBadgesForExam(submission.student_id);
                const passStatus = getPassStatus(submission);
                return (
                  <Card 
                    key={submission.id}
                    className={cn(
                      "border-0 shadow-card cursor-pointer transition-all hover:shadow-card-hover",
                      selectedSubmission?.id === submission.id && "ring-2 ring-secondary",
                      passStatus === 'passed' && "border-l-4 border-l-green-500",
                      passStatus === 'failed' && "border-l-4 border-l-red-500"
                    )}
                    onClick={() => handleSelectSubmission(submission)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            passStatus === 'passed' && "bg-green-100",
                            passStatus === 'failed' && "bg-red-100",
                            !passStatus && "bg-muted"
                          )}>
                            <User className={cn(
                              "w-5 h-5",
                              passStatus === 'passed' && "text-green-600",
                              passStatus === 'failed' && "text-red-600",
                              !passStatus && "text-muted-foreground"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {submission.student?.name || 'Unknown Student'}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                {new Date(submission.submitted_at).toLocaleDateString()}
                              </p>
                              {passStatus && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px] px-1.5 py-0",
                                    passStatus === 'passed' && "bg-green-50 text-green-700 border-green-300",
                                    passStatus === 'failed' && "bg-red-50 text-red-700 border-red-300"
                                  )}
                                >
                                  {passStatus === 'passed' ? 'Passed' : 'Failed'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {submissionBadges.length > 0 && (
                            <div className="flex -space-x-1">
                              {submissionBadges.slice(0, 3).map((sb) => {
                                const BadgeIcon = BADGE_ICONS[sb.badge?.icon || 'award'] || Award;
                                return (
                                  <div 
                                    key={sb.id}
                                    className={cn(
                                      "w-6 h-6 rounded-full border flex items-center justify-center",
                                      BADGE_COLORS[sb.badge?.color || 'gold']
                                    )}
                                  >
                                    <BadgeIcon className="w-3 h-3" />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {submission.graded ? (
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "gap-1",
                                passStatus === 'passed' && "bg-green-100 text-green-700",
                                passStatus === 'failed' && "bg-red-100 text-red-700"
                              )}
                            >
                              <Check className="w-3 h-3" />
                              {submission.score}/{exam.total_points}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
                      Multiple Choice ({mcQuestions.reduce((sum: number, q: Question) => {
                        const answer = selectedSubmission.answers[q.id];
                        const isCorrect = answer !== undefined && Number(answer) === q.correct_answer;
                        return sum + (isCorrect ? q.points : 0);
                      }, 0)}/{mcQuestions.reduce((sum: number, q: Question) => sum + q.points, 0)} pts)
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

                {/* Multi-Select Results */}
                {multiSelectQuestions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-primary" />
                      Multi-Select ({multiSelectQuestions.reduce((sum: number, q: Question) => {
                        const answer = selectedSubmission.answers[q.id];
                        const correctAnswers = q.correct_answers || [];
                        if (Array.isArray(answer) && correctAnswers.length > 0) {
                          const studentAnswers = answer.map(Number).sort();
                          const correctSorted = [...correctAnswers].sort();
                          if (studentAnswers.length === correctSorted.length && 
                              studentAnswers.every((val, idx) => val === correctSorted[idx])) {
                            return sum + q.points;
                          }
                        }
                        return sum;
                      }, 0)}/{multiSelectQuestions.reduce((sum: number, q: Question) => sum + q.points, 0)} pts)
                    </h3>
                    <div className="space-y-3">
                      {multiSelectQuestions.map((q: Question, idx: number) => {
                        const answer = selectedSubmission.answers[q.id];
                        const correctAnswers = q.correct_answers || [];
                        const studentAnswers = Array.isArray(answer) ? answer.map(Number).sort() : [];
                        const correctSorted = [...correctAnswers].sort();
                        const isCorrect = studentAnswers.length === correctSorted.length && 
                          studentAnswers.every((val, idx) => val === correctSorted[idx]);
                        
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
                                <p className="font-medium text-sm">Q{mcQuestions.length + idx + 1}: {q.question}</p>
                                <div className="mt-2 space-y-1">
                                  {q.options?.map((option: string, optIdx: number) => {
                                    const wasSelected = studentAnswers.includes(optIdx);
                                    const isCorrectAnswer = correctAnswers.includes(optIdx);
                                    
                                    return (
                                      <div 
                                        key={optIdx}
                                        className={cn(
                                          "flex items-center gap-2 text-sm px-2 py-1 rounded",
                                          wasSelected && isCorrectAnswer && "bg-green-100 text-green-800",
                                          wasSelected && !isCorrectAnswer && "bg-red-100 text-red-800",
                                          !wasSelected && isCorrectAnswer && "bg-yellow-100 text-yellow-800",
                                          !wasSelected && !isCorrectAnswer && "text-muted-foreground"
                                        )}
                                      >
                                        {wasSelected && isCorrectAnswer && <Check className="w-4 h-4 text-green-600" />}
                                        {wasSelected && !isCorrectAnswer && <X className="w-4 h-4 text-red-600" />}
                                        {!wasSelected && isCorrectAnswer && <span className="w-4 h-4 text-xs font-bold text-yellow-600">!</span>}
                                        {!wasSelected && !isCorrectAnswer && <span className="w-4 h-4" />}
                                        <span>{option}</span>
                                        {isCorrectAnswer && <span className="text-xs text-green-600 ml-auto">(correct)</span>}
                                      </div>
                                    );
                                  })}
                                </div>
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

                {(mcQuestions.length > 0 || multiSelectQuestions.length > 0) && essayQuestions.length > 0 && <Separator />}

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

                {/* Badge Awards */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      Award Badges (Optional)
                    </h3>
                    <Dialog open={showCreateBadge} onOpenChange={setShowCreateBadge}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Create Badge
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Custom Badge</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Badge Name</Label>
                            <Input
                              placeholder="e.g., Creative Thinker"
                              value={newBadge.name}
                              onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description (optional)</Label>
                            <Input
                              placeholder="Brief description..."
                              value={newBadge.description}
                              onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Icon</Label>
                            <div className="flex gap-2">
                              {Object.entries(BADGE_ICONS).map(([key, Icon]) => (
                                <Button
                                  key={key}
                                  type="button"
                                  variant={newBadge.icon === key ? "secondary" : "outline"}
                                  size="icon"
                                  onClick={() => setNewBadge({ ...newBadge, icon: key })}
                                >
                                  <Icon className="w-4 h-4" />
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-2">
                              {Object.keys(BADGE_COLORS).map((color) => (
                                <Button
                                  key={color}
                                  type="button"
                                  variant={newBadge.color === color ? "secondary" : "outline"}
                                  size="sm"
                                  onClick={() => setNewBadge({ ...newBadge, color })}
                                  className="capitalize"
                                >
                                  {color}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <Button onClick={handleCreateBadge} className="w-full" disabled={createBadge.isPending}>
                            {createBadge.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Create Badge
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => {
                      const BadgeIcon = BADGE_ICONS[badge.icon] || Award;
                      const isSelected = selectedBadges.includes(badge.id);
                      const alreadyAwarded = getStudentBadgesForExam(selectedSubmission.student_id)
                        .some(sb => sb.badge_id === badge.id);
                      
                      return (
                        <button
                          key={badge.id}
                          onClick={() => !alreadyAwarded && handleToggleBadge(badge.id)}
                          disabled={alreadyAwarded}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                            alreadyAwarded 
                              ? "opacity-50 cursor-not-allowed bg-muted" 
                              : isSelected 
                                ? cn(BADGE_COLORS[badge.color], "ring-2 ring-offset-1 ring-secondary")
                                : "hover:bg-muted"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center",
                            BADGE_COLORS[badge.color]
                          )}>
                            <BadgeIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-sm font-medium">{badge.name}</span>
                          {alreadyAwarded && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedBadges.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedBadges.length} badge(s) will be awarded
                    </p>
                  )}
                </div>

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
                    disabled={gradeSubmission.isPending || awardBadge.isPending}
                  >
                    {(gradeSubmission.isPending || awardBadge.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
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
