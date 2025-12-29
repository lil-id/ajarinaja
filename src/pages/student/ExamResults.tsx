import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useExamResults } from '@/hooks/useExamResults';
import { Question } from '@/hooks/useExams';
import { useMySubmission } from '@/hooks/useSubmissions';
import { useCourseMaterials, CourseMaterial } from '@/hooks/useCourseMaterials';
import { ArrowLeft, CheckCircle, XCircle, AlignLeft, Loader2, Clock, BookOpen, FileText, Video, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import MaterialViewer from '@/components/MaterialViewer';

const ExamResults = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { data: exam, isLoading: examLoading } = useExamResults(examId || '');
  const { data: submission, isLoading: submissionLoading } = useMySubmission(examId || '');
  const { materials, isLoading: materialsLoading } = useCourseMaterials(exam?.course_id);

  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);

  const isLoading = examLoading || submissionLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!exam || !submission) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Results not found</p>
        <Button variant="ghost" onClick={() => navigate('/student/exams')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exams
        </Button>
      </div>
    );
  }

  const questions = exam.questions || [];
  const mcQuestions = questions.filter((q: Question) => q.type === 'multiple-choice');
  const multiSelectQuestions = questions.filter((q: Question) => q.type === 'multi-select');
  const essayQuestions = questions.filter((q: Question) => q.type === 'essay');

  // Calculate MC score
  let mcCorrect = 0;
  let mcTotal = mcQuestions.length;
  mcQuestions.forEach((q: Question) => {
    const answer = submission.answers[q.id];
    if (answer !== undefined && Number(answer) === q.correct_answer) {
      mcCorrect++;
    }
  });

  // Calculate multi-select score
  let msCorrect = 0;
  let msTotal = multiSelectQuestions.length;
  multiSelectQuestions.forEach((q: Question) => {
    const answer = submission.answers[q.id];
    const studentAnswers = Array.isArray(answer) ? answer.map(Number).sort() : [];
    const correctAnswers = (q.correct_answers || []).sort();
    if (JSON.stringify(studentAnswers) === JSON.stringify(correctAnswers)) {
      msCorrect++;
    }
  });

  const scorePercentage = submission.score !== null 
    ? Math.round((submission.score / exam.total_points) * 100) 
    : 0;

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return { label: 'Excellent', color: 'text-green-600' };
    if (percentage >= 80) return { label: 'Great', color: 'text-emerald-600' };
    if (percentage >= 70) return { label: 'Good', color: 'text-blue-600' };
    if (percentage >= 60) return { label: 'Satisfactory', color: 'text-amber-600' };
    return { label: 'Needs Improvement', color: 'text-red-600' };
  };

  const grade = getGradeLabel(scorePercentage);

  const getMaterialIcon = (material: CourseMaterial) => {
    if (material.video_url) return <Video className="w-4 h-4" />;
    if (material.file_type?.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <BookOpen className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/student/exams')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
          <p className="text-muted-foreground">Exam Results</p>
        </div>
      </div>

      {/* Score Overview Card */}
      <Card className="border-0 shadow-card overflow-hidden">
        <div className="bg-gradient-hero p-6 text-primary-foreground">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-primary-foreground/80 text-sm mb-1">Your Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">
                  {submission.graded ? submission.score : '—'}
                </span>
                <span className="text-2xl text-primary-foreground/80">/ {exam.total_points}</span>
              </div>
              {submission.graded && (
                <p className={cn("text-lg font-medium mt-2", "text-primary-foreground")}>
                  {grade.label} • {scorePercentage}%
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {submission.graded ? (
                <Badge variant="secondary" className="text-sm px-4 py-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Graded
                </Badge>
              ) : (
                <Badge variant="outline" className="text-sm px-4 py-1 bg-amber-100 text-amber-700 border-amber-300">
                  <Clock className="w-4 h-4 mr-1" />
                  Awaiting Grade
                </Badge>
              )}
              <p className="text-sm text-primary-foreground/70">
                Submitted {new Date(submission.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {submission.graded && (
            <div className="mt-4">
              <Progress value={scorePercentage} className="h-3 bg-primary-foreground/20" />
            </div>
          )}
        </div>
        
        {/* Stats Row */}
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{mcCorrect + msCorrect}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{(mcTotal - mcCorrect) + (msTotal - msCorrect)}</p>
              <p className="text-sm text-muted-foreground">Incorrect</p>
            </div>
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{msTotal}</p>
              <p className="text-sm text-muted-foreground">Multi-Select</p>
            </div>
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                <AlignLeft className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{essayQuestions.length}</p>
              <p className="text-sm text-muted-foreground">Essays</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Learning Materials */}
      {materials.length > 0 && (
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-secondary" />
              Review Learning Materials
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Revisit course materials to strengthen your understanding
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {materials.slice(0, 5).map((material) => (
                <button
                  key={material.id}
                  onClick={() => setSelectedMaterial(material)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left w-full group"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-secondary/10 rounded-lg text-secondary">
                    {getMaterialIcon(material)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{material.title}</p>
                    {material.description && (
                      <p className="text-xs text-muted-foreground truncate">{material.description}</p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              {materials.length > 5 && (
                <Button 
                  variant="ghost" 
                  className="w-full mt-2"
                  onClick={() => navigate('/student/materials')}
                >
                  View all {materials.length} materials
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Review */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Question Review</h2>

        {/* Multiple Choice Questions */}
        {mcQuestions.map((q: Question, idx: number) => {
          const answer = submission.answers[q.id];
          const isCorrect = answer !== undefined && Number(answer) === q.correct_answer;
          const selectedOption = answer !== undefined ? Number(answer) : null;

          return (
            <Card 
              key={q.id} 
              className={cn(
                "border-0 shadow-card overflow-hidden",
                isCorrect ? "ring-1 ring-green-200" : "ring-1 ring-red-200"
              )}
            >
              <div className={cn(
                "px-4 py-2 flex items-center justify-between",
                isCorrect ? "bg-green-50" : "bg-red-50"
              )}>
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={cn(
                    "font-medium",
                    isCorrect ? "text-green-700" : "text-red-700"
                  )}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <Badge variant="outline" className="bg-background">
                  {isCorrect ? q.points : 0} / {q.points} pts
                </Badge>
              </div>
              <CardContent className="p-4">
                <p className="font-medium text-foreground mb-4">
                  <span className="text-muted-foreground mr-2">Q{idx + 1}.</span>
                  {q.question}
                </p>
                <div className="space-y-2">
                  {q.options?.map((option, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isCorrectOption = q.correct_answer === optIdx;
                    
                    return (
                      <div 
                        key={optIdx}
                        className={cn(
                          "p-3 rounded-lg border flex items-center gap-3",
                          isCorrectOption && "bg-green-50 border-green-300",
                          isSelected && !isCorrectOption && "bg-red-50 border-red-300",
                          !isSelected && !isCorrectOption && "bg-muted/30 border-border"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                          isCorrectOption && "bg-green-600 text-white",
                          isSelected && !isCorrectOption && "bg-red-600 text-white",
                          !isSelected && !isCorrectOption && "bg-muted text-muted-foreground"
                        )}>
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className={cn(
                          "flex-1",
                          isCorrectOption && "text-green-700 font-medium",
                          isSelected && !isCorrectOption && "text-red-700"
                        )}>
                          {option}
                        </span>
                        {isCorrectOption && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Correct Answer
                          </Badge>
                        )}
                        {isSelected && !isCorrectOption && (
                          <span className="text-xs text-red-600 font-medium">Your answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Quick link to materials for incorrect answers */}
                {!isCorrect && materials.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Review related materials:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {materials.slice(0, 3).map((material) => (
                        <Button
                          key={material.id}
                          variant="outline"
                          size="sm"
                          className="bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
                          onClick={() => setSelectedMaterial(material)}
                        >
                          {getMaterialIcon(material)}
                          <span className="ml-1 max-w-[120px] truncate">{material.title}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Multi-Select Questions */}
        {multiSelectQuestions.length > 0 && (
          <>
            <Separator className="my-6" />
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              Multi-Select Questions
            </h3>
            
            {multiSelectQuestions.map((q: Question, idx: number) => {
              const answer = submission.answers[q.id];
              const studentAnswers = Array.isArray(answer) ? answer.map(Number) : [];
              const correctAnswers = q.correct_answers || [];
              const isFullyCorrect = JSON.stringify([...studentAnswers].sort()) === JSON.stringify([...correctAnswers].sort());

              return (
                <Card 
                  key={q.id} 
                  className={cn(
                    "border-0 shadow-card overflow-hidden",
                    isFullyCorrect ? "ring-1 ring-green-200" : "ring-1 ring-red-200"
                  )}
                >
                  <div className={cn(
                    "px-4 py-2 flex items-center justify-between",
                    isFullyCorrect ? "bg-green-50" : "bg-red-50"
                  )}>
                    <div className="flex items-center gap-2">
                      {isFullyCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={cn(
                        "font-medium",
                        isFullyCorrect ? "text-green-700" : "text-red-700"
                      )}>
                        {isFullyCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-background">
                      {isFullyCorrect ? q.points : 0} / {q.points} pts
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <p className="font-medium text-foreground mb-2">
                      <span className="text-muted-foreground mr-2">Q{mcQuestions.length + idx + 1}.</span>
                      {q.question}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">(Select all that apply)</p>
                    <div className="space-y-2">
                      {q.options?.map((option, optIdx) => {
                        const isSelected = studentAnswers.includes(optIdx);
                        const isCorrectOption = correctAnswers.includes(optIdx);
                        
                        return (
                          <div 
                            key={optIdx}
                            className={cn(
                              "p-3 rounded-lg border flex items-center gap-3",
                              isCorrectOption && isSelected && "bg-green-50 border-green-300",
                              isCorrectOption && !isSelected && "bg-amber-50 border-amber-300",
                              !isCorrectOption && isSelected && "bg-red-50 border-red-300",
                              !isCorrectOption && !isSelected && "bg-muted/30 border-border"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded flex items-center justify-center text-sm font-medium",
                              isCorrectOption && isSelected && "bg-green-600 text-white",
                              isCorrectOption && !isSelected && "bg-amber-600 text-white",
                              !isCorrectOption && isSelected && "bg-red-600 text-white",
                              !isCorrectOption && !isSelected && "bg-muted text-muted-foreground"
                            )}>
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            <span className={cn(
                              "flex-1",
                              isCorrectOption && "text-green-700 font-medium",
                              !isCorrectOption && isSelected && "text-red-700"
                            )}>
                              {option}
                            </span>
                            {isCorrectOption && isSelected && (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Correct
                              </Badge>
                            )}
                            {isCorrectOption && !isSelected && (
                              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                                Missed
                              </Badge>
                            )}
                            {!isCorrectOption && isSelected && (
                              <span className="text-xs text-red-600 font-medium">Should not select</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Quick link to materials for incorrect answers */}
                    {!isFullyCorrect && materials.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Review related materials:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {materials.slice(0, 3).map((material) => (
                            <Button
                              key={material.id}
                              variant="outline"
                              size="sm"
                              className="bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
                              onClick={() => setSelectedMaterial(material)}
                            >
                              {getMaterialIcon(material)}
                              <span className="ml-1 max-w-[120px] truncate">{material.title}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        {/* Essay Questions */}
        {essayQuestions.length > 0 && (
          <>
            <Separator className="my-6" />
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlignLeft className="w-5 h-5" />
              Essay Questions
            </h3>
            
            {essayQuestions.map((q: Question, idx: number) => {
              const answer = submission.answers[q.id];
              
              return (
                <Card key={q.id} className="border-0 shadow-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        <span className="text-muted-foreground mr-2">Q{mcQuestions.length + multiSelectQuestions.length + idx + 1}.</span>
                        {q.question}
                      </CardTitle>
                      <Badge variant="outline">{q.points} pts</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Your Answer:</p>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">
                          {answer ? String(answer) : <em className="text-muted-foreground">No answer provided</em>}
                        </p>
                      </div>
                    </div>
                    
                    {!submission.graded && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-700 text-sm">
                        <Clock className="w-4 h-4" />
                        This essay is awaiting teacher review
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" size="lg" onClick={() => navigate('/student/exams')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exams
        </Button>
      </div>

      {/* Material Viewer Modal */}
      <MaterialViewer
        isOpen={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        material={selectedMaterial ? {
          id: selectedMaterial.id,
          title: selectedMaterial.title,
          file_path: selectedMaterial.file_path,
          file_name: selectedMaterial.file_name,
          file_type: selectedMaterial.file_type,
          video_url: selectedMaterial.video_url,
        } : null}
      />
    </div>
  );
};

export default ExamResults;
