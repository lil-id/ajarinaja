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
import { toast } from 'sonner';

interface GradeDialogProps {
  submission: any;
  assignment: any;
  open: boolean;
  onClose: () => void;
}

function GradeDialog({ submission, assignment, open, onClose }: GradeDialogProps) {
  const [score, setScore] = useState(submission?.score?.toString() || '');
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(
    Object.fromEntries(submission?.rubric_scores?.map((r: any) => [r.id, r.score]) || [])
  );
  
  const gradeAssignment = useGradeAssignment();
  const { data: fileUrl } = useSubmissionFileUrl(submission?.file_path);

  const handleGrade = async () => {
    const finalScore = parseInt(score);
    if (isNaN(finalScore) || finalScore < 0 || finalScore > assignment.max_points) {
      toast.error(`Score must be between 0 and ${assignment.max_points}`);
      return;
    }

    try {
      await gradeAssignment.mutateAsync({
        submissionId: submission.id,
        score: finalScore,
        feedback,
        rubricScores: Object.entries(rubricScores).map(([id, score]) => ({ id, score })),
      });
      toast.success('Submission graded');
      onClose();
    } catch {
      toast.error('Failed to grade submission');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>
            Student: {submission?.student?.name || 'Unknown'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Submitted</Label>
            <p className="text-sm text-muted-foreground">
              {submission?.submitted_at && format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
              {submission?.is_late && (
                <Badge variant="destructive" className="ml-2">Late</Badge>
              )}
            </p>
          </div>

          {submission?.file_name && (
            <div className="space-y-2">
              <Label>Submitted File</Label>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{submission.file_name}</span>
                {fileUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {submission?.text_content && (
            <div className="space-y-2">
              <Label>Text Submission</Label>
              <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {submission.text_content}
              </div>
            </div>
          )}

          {assignment?.rubric?.length > 0 && (
            <div className="space-y-3">
              <Label>Rubric Scoring</Label>
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
            <Label>Total Score</Label>
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
            <Label>Feedback</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback to the student..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleGrade} disabled={gradeAssignment.isPending}>
              {gradeAssignment.isPending ? 'Saving...' : 'Save Grade'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AssignmentSubmissions() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { data: assignment, isLoading: assignmentLoading } = useAssignment(assignmentId!);
  const { data: submissions = [], isLoading: submissionsLoading } = useAssignmentSubmissions(assignmentId!);
  const [gradeSubmission, setGradeSubmission] = useState<any>(null);

  const isLoading = assignmentLoading || submissionsLoading;

  const gradedCount = submissions.filter(s => s.graded).length;
  const lateCount = submissions.filter(s => s.is_late).length;
  const avgScore = submissions.filter(s => s.graded && s.score !== null)
    .reduce((sum, s) => sum + (s.score || 0), 0) / (gradedCount || 1);

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground">
            Due: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Submissions</CardDescription>
            <CardTitle className="text-2xl">{submissions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Graded</CardDescription>
            <CardTitle className="text-2xl">{gradedCount} / {submissions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(gradedCount / submissions.length) * 100 || 0} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Late Submissions</CardDescription>
            <CardTitle className="text-2xl">{lateCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-2xl">
              {gradedCount > 0 ? `${avgScore.toFixed(1)} / ${assignment.max_points}` : 'N/A'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No submissions yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{submission.student?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{submission.student?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(submission.submitted_at), 'MMM d, h:mm a')}
                        {submission.is_late && (
                          <Badge variant="destructive" className="text-xs">Late</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission.graded ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Graded
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pending
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
                        {submission.graded ? 'View/Edit' : 'Grade'}
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
          open={!!gradeSubmission}
          onClose={() => setGradeSubmission(null)}
        />
      )}
    </div>
  );
}
