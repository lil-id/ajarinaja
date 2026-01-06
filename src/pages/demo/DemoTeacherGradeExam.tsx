import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  X,
  User,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Trophy,
  Medal,
  Zap,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoExams } from '@/data/demoData';
import FormulaText from '@/components/FormulaText';

// Mock submissions data
const demoSubmissions = [
  {
    id: '1',
    student_id: 'student-1',
    student_name: 'Alice Johnson',
    student_email: 'alice@student.edu',
    submitted_at: '2024-01-15T10:30:00',
    graded: true,
    score: 85,
    answers: {
      'q1': 0,
      'q2': [0, 2],
      'q3': 'The quadratic formula is derived by completing the square on the general form ax² + bx + c = 0...',
    },
  },
  {
    id: '2',
    student_id: 'student-2',
    student_name: 'Bob Smith',
    student_email: 'bob@student.edu',
    submitted_at: '2024-01-15T10:45:00',
    graded: false,
    score: null,
    answers: {
      'q1': 1,
      'q2': [0, 1],
      'q3': 'To derive the quadratic formula, we start with ax² + bx + c = 0 and divide by a...',
    },
  },
  {
    id: '3',
    student_id: 'student-3',
    student_name: 'Carol Davis',
    student_email: 'carol@student.edu',
    submitted_at: '2024-01-15T11:00:00',
    graded: true,
    score: 92,
    answers: {
      'q1': 0,
      'q2': [0, 2],
      'q3': 'The derivation of the quadratic formula involves completing the square. Starting from ax² + bx + c = 0, we first divide all terms by a to get x² + (b/a)x + c/a = 0...',
    },
  },
  {
    id: '4',
    student_id: 'student-4',
    student_name: 'David Lee',
    student_email: 'david@student.edu',
    submitted_at: '2024-01-15T11:15:00',
    graded: false,
    score: null,
    answers: {
      'q1': 2,
      'q2': [1],
      'q3': 'The quadratic formula is x = -b ± √(b²-4ac) / 2a',
    },
  },
];

const demoQuestions = [
  {
    id: 'q1',
    type: 'multiple_choice',
    question: 'What is the solution to $x^2 - 5x + 6 = 0$?',
    options: ['$x = 2$ or $x = 3$', '$x = -2$ or $x = -3$', '$x = 1$ or $x = 6$', '$x = -1$ or $x = -6$'],
    correct_answer: 0,
    points: 10,
  },
  {
    id: 'q2',
    type: 'multi_select',
    question: 'Which of the following are quadratic equations?',
    options: ['$x^2 + 2x + 1 = 0$', '$x^3 - x = 0$', '$2x^2 - 8 = 0$', '$x + 5 = 0$'],
    correct_answers: [0, 2],
    points: 15,
  },
  {
    id: 'q3',
    type: 'essay',
    question: 'Explain the derivation of the quadratic formula from the general form $ax^2 + bx + c = 0$.',
    points: 25,
  },
];

const demoBadges = [
  { id: '1', name: 'Perfect Score', icon: 'Star', color: 'yellow', description: 'Achieved 100% on an exam' },
  { id: '2', name: 'Quick Thinker', icon: 'Zap', color: 'blue', description: 'Completed exam in record time' },
  { id: '3', name: 'Math Wizard', icon: 'Trophy', color: 'purple', description: 'Excellence in mathematics' },
  { id: '4', name: 'Improvement', icon: 'Target', color: 'green', description: 'Significant score improvement' },
];

const BADGE_ICONS: Record<string, React.ElementType> = {
  Star,
  Trophy,
  Medal,
  Zap,
  Target,
  Award,
};

const BADGE_COLORS: Record<string, string> = {
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  blue: 'bg-blue-100 text-blue-700 border-blue-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-300',
  green: 'bg-green-100 text-green-700 border-green-300',
  red: 'bg-red-100 text-red-700 border-red-300',
};

type FilterType = 'all' | 'passed' | 'failed' | 'pending';

export default function DemoTeacherGradeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [selectedSubmission, setSelectedSubmission] = useState<typeof demoSubmissions[0] | null>(null);
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');

  const exam = demoExams.find((e) => e.id === examId) || demoExams[0];
  const kkm = exam?.kkm || 70;
  const totalPoints = demoQuestions.reduce((sum, q) => sum + q.points, 0);

  const getPassStatus = (submission: typeof demoSubmissions[0]) => {
    if (!submission.graded) return 'pending';
    return (submission.score || 0) >= kkm ? 'passed' : 'failed';
  };

  const filteredSubmissions = demoSubmissions.filter((sub) => {
    if (statusFilter === 'all') return true;
    return getPassStatus(sub) === statusFilter;
  });

  const calculateMCScore = () => {
    if (!selectedSubmission) return 0;
    let score = 0;

    demoQuestions.forEach((q) => {
      if (q.type === 'multiple_choice') {
        const answer = selectedSubmission.answers[q.id];
        if (answer === q.correct_answer) {
          score += q.points;
        }
      } else if (q.type === 'multi_select') {
        const answer = selectedSubmission.answers[q.id] as number[];
        const correct = q.correct_answers || [];
        if (JSON.stringify([...answer].sort()) === JSON.stringify([...correct].sort())) {
          score += q.points;
        }
      }
    });

    return score;
  };

  const handleSelectSubmission = (submission: typeof demoSubmissions[0]) => {
    setSelectedSubmission(submission);
    setEssayScores({});
    setFeedback('');
    setSelectedBadges([]);
  };

  const handleToggleBadge = (badgeId: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((id) => id !== badgeId) : [...prev, badgeId]
    );
  };

  const handleGrade = () => {
    toast.info('Demo Mode: Grading is disabled in demo. Contact us for the full version!', {
      action: {
        label: 'Contact',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20am%20interested%20in%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  const ungradedCount = demoSubmissions.filter((s) => !s.graded).length;
  const gradedCount = demoSubmissions.filter((s) => s.graded).length;
  const passedCount = demoSubmissions.filter((s) => s.graded && (s.score || 0) >= kkm).length;
  const failedCount = demoSubmissions.filter((s) => s.graded && (s.score || 0) < kkm).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/demo/teacher/exams')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Grade Exam: {exam?.title}</h1>
          <p className="text-muted-foreground">
            KKM: {kkm} points | Total: {totalPoints} points
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={cn('cursor-pointer transition-colors', statusFilter === 'all' && 'ring-2 ring-primary')}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{demoSubmissions.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn('cursor-pointer transition-colors', statusFilter === 'pending' && 'ring-2 ring-primary')}
          onClick={() => setStatusFilter('pending')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ungradedCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn('cursor-pointer transition-colors', statusFilter === 'passed' && 'ring-2 ring-primary')}
          onClick={() => setStatusFilter('passed')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-700 rounded-lg">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{passedCount}</p>
              <p className="text-xs text-muted-foreground">Passed</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn('cursor-pointer transition-colors', statusFilter === 'failed' && 'ring-2 ring-primary')}
          onClick={() => setStatusFilter('failed')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{failedCount}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-2">
                {filteredSubmissions.map((submission) => {
                  const status = getPassStatus(submission);
                  return (
                    <div
                      key={submission.id}
                      onClick={() => handleSelectSubmission(submission)}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-colors',
                        selectedSubmission?.id === submission.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted',
                        status === 'passed' && 'border-l-4 border-l-green-500',
                        status === 'failed' && 'border-l-4 border-l-red-500',
                        status === 'pending' && 'border-l-4 border-l-yellow-500'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{submission.student_name}</span>
                        {submission.graded ? (
                          <Badge variant={status === 'passed' ? 'default' : 'destructive'}>
                            {submission.score}/{totalPoints}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(submission.submitted_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Grading Panel */}
        <Card className="lg:col-span-2">
          {selectedSubmission ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedSubmission.student_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.student_email}</p>
                  </div>
                  {selectedSubmission.graded && (
                    <Badge variant={getPassStatus(selectedSubmission) === 'passed' ? 'default' : 'destructive'} className="text-lg px-4 py-1">
                      {selectedSubmission.score}/{totalPoints}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-6">
                    {/* Multiple Choice & Multi-Select Questions */}
                    {demoQuestions.filter((q) => q.type !== 'essay').map((question, idx) => {
                      const answer = selectedSubmission.answers[question.id];
                      const isCorrect =
                        question.type === 'multiple_choice'
                          ? answer === question.correct_answer
                          : JSON.stringify([...(answer as number[])].sort()) === JSON.stringify([...(question.correct_answers || [])].sort());

                      return (
                        <div key={question.id} className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Q{idx + 1}.</span>
                              <Badge variant="outline">{question.type === 'multiple_choice' ? 'MC' : 'Multi'}</Badge>
                              <span className="text-sm text-muted-foreground">({question.points} pts)</span>
                            </div>
                            {isCorrect ? (
                              <Badge className="bg-green-100 text-green-700">
                                <Check className="h-3 w-3 mr-1" /> Correct
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700">
                                <X className="h-3 w-3 mr-1" /> Incorrect
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm">
                            <FormulaText text={question.question} />
                          </div>
                          <div className="grid gap-2 pl-4">
                            {question.options?.map((opt, optIdx) => {
                              const isSelected =
                                question.type === 'multiple_choice'
                                  ? answer === optIdx
                                  : (answer as number[])?.includes(optIdx);
                              const isCorrectOption =
                                question.type === 'multiple_choice'
                                  ? question.correct_answer === optIdx
                                  : question.correct_answers?.includes(optIdx);

                              return (
                                <div
                                  key={optIdx}
                                  className={cn(
                                    'p-2 rounded border text-sm flex items-center gap-2',
                                    isCorrectOption && 'bg-green-50 border-green-300',
                                    isSelected && !isCorrectOption && 'bg-red-50 border-red-300'
                                  )}
                                >
                                  {isCorrectOption && <Check className="h-4 w-4 text-green-600" />}
                                  {isSelected && !isCorrectOption && <X className="h-4 w-4 text-red-600" />}
                                  <FormulaText text={opt} />
                                </div>
                              );
                            })}
                          </div>
                          <Separator />
                        </div>
                      );
                    })}

                    {/* Essay Questions */}
                    {demoQuestions.filter((q) => q.type === 'essay').map((question, idx) => (
                      <div key={question.id} className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Q{demoQuestions.filter((q) => q.type !== 'essay').length + idx + 1}.</span>
                            <Badge variant="outline">Essay</Badge>
                            <span className="text-sm text-muted-foreground">({question.points} pts)</span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <FormulaText text={question.question} />
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm font-medium mb-2">Student Answer:</p>
                          <p className="text-sm whitespace-pre-wrap">
                            {selectedSubmission.answers[question.id] as string}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">Score:</span>
                          <Input
                            type="number"
                            min={0}
                            max={question.points}
                            className="w-24"
                            value={essayScores[question.id] || ''}
                            onChange={(e) => setEssayScores({ ...essayScores, [question.id]: Number(e.target.value) })}
                            placeholder={`0-${question.points}`}
                          />
                          <span className="text-sm text-muted-foreground">/ {question.points}</span>
                        </div>
                        <Separator />
                      </div>
                    ))}

                    {/* Feedback */}
                    <div className="space-y-3">
                      <h3 className="font-medium">Feedback (Optional)</h3>
                      <Textarea
                        placeholder="Add feedback for the student..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Badge Award */}
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Award Badges
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {demoBadges.map((badge) => {
                          const IconComponent = BADGE_ICONS[badge.icon] || Star;
                          const isSelected = selectedBadges.includes(badge.id);
                          return (
                            <div
                              key={badge.id}
                              onClick={() => handleToggleBadge(badge.id)}
                              className={cn(
                                'p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3',
                                isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted',
                                BADGE_COLORS[badge.color]
                              )}
                            >
                              <IconComponent className="h-5 w-5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{badge.name}</p>
                                <p className="text-xs opacity-75 truncate">{badge.description}</p>
                              </div>
                              {isSelected && <Check className="h-4 w-4" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total Score Summary */}
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Score</p>
                            <p className="text-2xl font-bold">
                              {calculateMCScore() + Object.values(essayScores).reduce((a, b) => a + b, 0)} / {totalPoints}
                            </p>
                          </div>
                          <Button onClick={handleGrade} size="lg">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Submit Grade
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </CardContent>
            </>
          ) : (
            <CardContent className="h-[530px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a submission to start grading</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
