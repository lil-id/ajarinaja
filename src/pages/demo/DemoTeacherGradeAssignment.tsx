import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  X,
  User,
  Clock,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoAssignments } from '@/data/demoData';
import FormulaText from '@/components/FormulaText';

// Mock assignment questions
const demoAssignmentQuestions = [
  {
    id: 'aq1',
    type: 'multiple_choice',
    question: 'What is the slope of the line $y = 3x + 5$?',
    options: ['3', '5', '-3', '1'],
    correct_answer: 0,
    points: 10,
  },
  {
    id: 'aq2',
    type: 'multi_select',
    question: 'Select all expressions that equal 12:',
    options: ['$4 \\times 3$', '$6 + 6$', '$24 \\div 2$', '$15 - 2$'],
    correct_answers: [0, 1, 2],
    points: 15,
  },
  {
    id: 'aq3',
    type: 'essay',
    question: 'Explain how to graph a linear equation step by step.',
    points: 25,
  },
];

// Mock rubric for file-based assignments
const demoRubric = [
  { id: 'r1', name: 'Content Quality', description: 'Accuracy and completeness of content', maxPoints: 30 },
  { id: 'r2', name: 'Organization', description: 'Logical structure and flow', maxPoints: 20 },
  { id: 'r3', name: 'Presentation', description: 'Grammar, formatting, and clarity', maxPoints: 25 },
  { id: 'r4', name: 'Critical Thinking', description: 'Analysis and original insights', maxPoints: 25 },
];

// Mock submissions data
const demoAssignmentSubmissions = [
  {
    id: 'as1',
    student_id: 'student-1',
    student_name: 'Ahmad Rizki',
    student_email: 'ahmad@student.edu',
    submitted_at: '2024-02-18T14:30:00',
    graded: true,
    score: 85,
    is_late: false,
    assignment_type: 'questions',
    answers: {
      'aq1': 0,
      'aq2': [0, 1, 2],
      'aq3': 'To graph a linear equation, first identify the slope (m) and y-intercept (b) from the equation y = mx + b. Plot the y-intercept on the y-axis, then use the slope to find another point...',
    },
    file_name: null,
  },
  {
    id: 'as2',
    student_id: 'student-2',
    student_name: 'Siti Nurhaliza',
    student_email: 'siti@student.edu',
    submitted_at: '2024-02-19T10:15:00',
    graded: false,
    score: null,
    is_late: false,
    assignment_type: 'questions',
    answers: {
      'aq1': 1,
      'aq2': [0, 2],
      'aq3': 'First, you find the y-intercept and plot it. Then use rise over run to plot more points.',
    },
    file_name: null,
  },
  {
    id: 'as3',
    student_id: 'student-3',
    student_name: 'Budi Santoso',
    student_email: 'budi@student.edu',
    submitted_at: '2024-02-21T23:45:00',
    graded: true,
    score: 72,
    is_late: true,
    assignment_type: 'submission',
    answers: null,
    file_name: 'math_essay_budi.pdf',
    file_size: '2.4 MB',
    rubric_scores: { 'r1': 22, 'r2': 15, 'r3': 18, 'r4': 17 },
  },
  {
    id: 'as4',
    student_id: 'student-4',
    student_name: 'Dewi Lestari',
    student_email: 'dewi@student.edu',
    submitted_at: '2024-02-19T16:20:00',
    graded: false,
    score: null,
    is_late: false,
    assignment_type: 'submission',
    answers: null,
    file_name: 'essay_dewi_final.docx',
    file_size: '1.8 MB',
    rubric_scores: null,
  },
];

type FilterType = 'all' | 'passed' | 'failed' | 'pending';

export default function DemoTeacherGradeAssignment() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [selectedSubmission, setSelectedSubmission] = useState<typeof demoAssignmentSubmissions[0] | null>(null);
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');

  const assignment = demoAssignments.find((a) => a.id === assignmentId) || demoAssignments[0];
  const kkm = 70; // Default KKM for assignments
  const totalPoints = assignment?.max_points || 100;

  const getPassStatus = (submission: typeof demoAssignmentSubmissions[0]) => {
    if (!submission.graded) return 'pending';
    return (submission.score || 0) >= kkm ? 'passed' : 'failed';
  };

  const filteredSubmissions = demoAssignmentSubmissions.filter((sub) => {
    if (statusFilter === 'all') return true;
    return getPassStatus(sub) === statusFilter;
  });

  const calculateMCScore = () => {
    if (!selectedSubmission || selectedSubmission.assignment_type !== 'questions') return 0;
    let score = 0;

    demoAssignmentQuestions.forEach((q) => {
      if (q.type === 'multiple_choice') {
        const answer = selectedSubmission.answers?.[q.id];
        if (answer === q.correct_answer) {
          score += q.points;
        }
      } else if (q.type === 'multi_select') {
        const answer = selectedSubmission.answers?.[q.id] as number[];
        const correct = q.correct_answers || [];
        if (JSON.stringify([...answer].sort()) === JSON.stringify([...correct].sort())) {
          score += q.points;
        }
      }
    });

    return score;
  };

  const handleSelectSubmission = (submission: typeof demoAssignmentSubmissions[0]) => {
    setSelectedSubmission(submission);
    setEssayScores({});
    setRubricScores(submission.rubric_scores || {});
    setFeedback('');
  };

  const handleGrade = () => {
    toast.info('Demo Mode: Grading is disabled in demo. Contact us for the full version!', {
      action: {
        label: 'Contact',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20am%20interested%20in%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  const ungradedCount = demoAssignmentSubmissions.filter((s) => !s.graded).length;
  const gradedCount = demoAssignmentSubmissions.filter((s) => s.graded).length;
  const passedCount = demoAssignmentSubmissions.filter((s) => s.graded && (s.score || 0) >= kkm).length;
  const failedCount = demoAssignmentSubmissions.filter((s) => s.graded && (s.score || 0) < kkm).length;
  const lateCount = demoAssignmentSubmissions.filter((s) => s.is_late).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/demo/teacher/assignments')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Grade Assignment: {assignment?.title}</h1>
          <p className="text-muted-foreground">
            Max Points: {totalPoints} | KKM: {kkm} | Type: {assignment?.assignment_type}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card
          className={cn('cursor-pointer transition-colors', statusFilter === 'all' && 'ring-2 ring-primary')}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{demoAssignmentSubmissions.length}</p>
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
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lateCount}</p>
              <p className="text-xs text-muted-foreground">Late</p>
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
                        <div className="flex items-center gap-2">
                          {submission.is_late && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">Late</Badge>
                          )}
                          {submission.graded ? (
                            <Badge variant={status === 'passed' ? 'default' : 'destructive'}>
                              {submission.score}/{totalPoints}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(submission.submitted_at).toLocaleString()}
                      </div>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {submission.assignment_type === 'questions' ? 'Questions' : 'File Upload'}
                        </Badge>
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
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {selectedSubmission.assignment_type === 'questions' ? 'Question-Based' : 'File-Based'}
                      </Badge>
                      {selectedSubmission.is_late && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Late Submission (-{assignment?.late_penalty_percent || 10}%)
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedSubmission.graded && (
                    <Badge 
                      variant={getPassStatus(selectedSubmission) === 'passed' ? 'default' : 'destructive'} 
                      className="text-lg px-4 py-1"
                    >
                      {selectedSubmission.score}/{totalPoints}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-6">
                    {/* Question-Based Submission */}
                    {selectedSubmission.assignment_type === 'questions' && selectedSubmission.answers && (
                      <>
                        {demoAssignmentQuestions.filter((q) => q.type !== 'essay').map((question, idx) => {
                          const answer = selectedSubmission.answers?.[question.id];
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
                        {demoAssignmentQuestions.filter((q) => q.type === 'essay').map((question, idx) => (
                          <div key={question.id} className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Q{demoAssignmentQuestions.filter((q) => q.type !== 'essay').length + idx + 1}.</span>
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
                                {selectedSubmission.answers?.[question.id] as string}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm">Score:</span>
                              <Input
                                type="number"
                                min={0}
                                max={question.points}
                                placeholder={`0-${question.points}`}
                                value={essayScores[question.id] || ''}
                                onChange={(e) => setEssayScores({ ...essayScores, [question.id]: Number(e.target.value) })}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">/ {question.points}</span>
                            </div>
                            <Separator />
                          </div>
                        ))}
                      </>
                    )}

                    {/* File-Based Submission */}
                    {selectedSubmission.assignment_type === 'submission' && (
                      <>
                        {/* File Preview */}
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{selectedSubmission.file_name}</p>
                                <p className="text-sm text-muted-foreground">{selectedSubmission.file_size}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={handleGrade}>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button variant="outline" size="sm" onClick={handleGrade}>
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Rubric Grading */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Rubric Scoring</h3>
                          {demoRubric.map((criterion) => (
                            <div key={criterion.id} className="space-y-2 p-4 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{criterion.name}</p>
                                  <p className="text-xs text-muted-foreground">{criterion.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{rubricScores[criterion.id] || 0}</span>
                                  <span className="text-sm text-muted-foreground">/ {criterion.maxPoints}</span>
                                </div>
                              </div>
                              <Slider
                                value={[rubricScores[criterion.id] || 0]}
                                max={criterion.maxPoints}
                                step={1}
                                onValueChange={(value) => setRubricScores({ ...rubricScores, [criterion.id]: value[0] })}
                                className="w-full"
                              />
                            </div>
                          ))}
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="font-medium">Total Rubric Score</span>
                            <span className="font-bold">
                              {Object.values(rubricScores).reduce((sum, s) => sum + (s || 0), 0)} / {demoRubric.reduce((sum, r) => sum + r.maxPoints, 0)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Feedback */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Feedback</h3>
                      <Textarea
                        placeholder="Write feedback for the student..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                      />
                    </div>

                    {/* Demo Notice */}
                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-700">Demo Mode</p>
                        <p className="text-sm text-amber-600">
                          Grading is disabled in demo mode. Contact us for full access to the grading features.
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button onClick={handleGrade} className="w-full" size="lg">
                      Save Grade (Demo)
                    </Button>
                  </div>
                </ScrollArea>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[500px]">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a submission to start grading</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}