import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useExamWithQuestions, useUpdateExam, Question } from '@/hooks/useExams';
import { useUpdateQuestion, useDeleteQuestion, useAddQuestion } from '@/hooks/useQuestions';
import { ArrowLeft, Plus, Trash2, Save, Loader2, CheckCircle, AlignLeft, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const EditExam = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { data: exam, isLoading } = useExamWithQuestions(examId || '');
  const updateExam = useUpdateExam();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const addQuestion = useAddQuestion();

  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration: 60,
    start_date: '',
    end_date: '',
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState<{
    type: 'multiple-choice' | 'essay';
    question: string;
    options: string[];
    correctAnswer: number;
    points: number;
  }>({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10,
  });

  useEffect(() => {
    if (exam) {
      setExamForm({
        title: exam.title,
        description: exam.description || '',
        duration: exam.duration,
        start_date: exam.start_date ? new Date(exam.start_date).toISOString().slice(0, 16) : '',
        end_date: exam.end_date ? new Date(exam.end_date).toISOString().slice(0, 16) : '',
      });
      setQuestions(exam.questions || []);
    }
  }, [exam]);

  const handleSaveExam = async () => {
    try {
      await updateExam.mutateAsync({
        id: examId!,
        title: examForm.title,
        description: examForm.description || null,
        duration: examForm.duration,
        start_date: examForm.start_date ? new Date(examForm.start_date).toISOString() : null,
        end_date: examForm.end_date ? new Date(examForm.end_date).toISOString() : null,
      });
      toast.success('Exam updated successfully');
    } catch (error) {
      toast.error('Failed to update exam');
    }
  };

  const handleUpdateQuestion = async (q: Question) => {
    try {
      await updateQuestion.mutateAsync({
        id: q.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        points: q.points,
        type: q.type,
      });
      toast.success('Question updated');
    } catch (error) {
      toast.error('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestion.mutateAsync(questionId);
      setQuestions(questions.filter(q => q.id !== questionId));
      toast.success('Question deleted');
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  const handleAddNewQuestion = async () => {
    if (!newQuestion.question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    try {
      const result = await addQuestion.mutateAsync({
        examId: examId!,
        type: newQuestion.type,
        question: newQuestion.question,
        options: newQuestion.type === 'multiple-choice' ? newQuestion.options : null,
        correct_answer: newQuestion.type === 'multiple-choice' ? newQuestion.correctAnswer : null,
        points: newQuestion.points,
        order_index: questions.length,
        exam_id: examId!,
      });

      setQuestions([...questions, result as Question]);
      setNewQuestion({
        type: 'multiple-choice',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 10,
      });
      setIsAddDialogOpen(false);
      toast.success('Question added');
    } catch (error) {
      toast.error('Failed to add question');
    }
  };

  const updateLocalQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Exam not found</p>
        <Button variant="outline" onClick={() => navigate('/teacher/exams')} className="mt-4">
          Back to Exams
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/exams')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Edit Exam</h1>
          <p className="text-muted-foreground mt-1">Modify exam details and questions</p>
        </div>
        <Button onClick={handleSaveExam} disabled={updateExam.isPending}>
          {updateExam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Exam Details */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={examForm.duration}
                onChange={(e) => setExamForm({ ...examForm, duration: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={examForm.description}
              onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              placeholder="Exam description..."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date & Time
              </Label>
              <Input
                type="datetime-local"
                value={examForm.start_date}
                onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date & Time
              </Label>
              <Input
                type="datetime-local"
                value={examForm.end_date}
                onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card className="border-0 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Questions ({questions.length})</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Question</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Tabs
                  value={newQuestion.type}
                  onValueChange={(v) => setNewQuestion({ ...newQuestion, type: v as 'multiple-choice' | 'essay' })}
                >
                  <TabsList className="mb-4">
                    <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
                    <TabsTrigger value="essay">Essay</TabsTrigger>
                  </TabsList>

                  <Textarea
                    placeholder="Enter your question..."
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  />

                  <TabsContent value="multiple-choice" className="mt-4 space-y-2">
                    {newQuestion.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="newCorrect"
                          checked={newQuestion.correctAnswer === i}
                          onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                          className="w-4 h-4"
                        />
                        <Input
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[i] = e.target.value;
                            setNewQuestion({ ...newQuestion, options: newOptions });
                          }}
                        />
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs">Points</Label>
                    <Input
                      type="number"
                      value={newQuestion.points}
                      onChange={(e) => setNewQuestion({ ...newQuestion, points: Number(e.target.value) })}
                    />
                  </div>
                  <Button onClick={handleAddNewQuestion} className="mt-5" disabled={addQuestion.isPending}>
                    {addQuestion.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add Question
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No questions yet. Add your first question!</p>
          ) : (
            questions.map((q, index) => (
              <Card key={q.id} className="bg-muted/50">
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {q.type === 'multiple-choice' ? (
                        <CheckCircle className="w-4 h-4 text-secondary" />
                      ) : (
                        <AlignLeft className="w-4 h-4 text-primary" />
                      )}
                      <span className="font-medium">Q{index + 1}</span>
                      <span className="capitalize">({q.type})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-20 h-8"
                        value={q.points}
                        onChange={(e) => updateLocalQuestion(index, { points: Number(e.target.value) })}
                        onBlur={() => handleUpdateQuestion(questions[index])}
                      />
                      <span className="text-xs text-muted-foreground">pts</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={q.question}
                    onChange={(e) => updateLocalQuestion(index, { question: e.target.value })}
                    onBlur={() => handleUpdateQuestion(questions[index])}
                    className="bg-background"
                  />

                  {q.type === 'multiple-choice' && q.options && (
                    <div className="space-y-2">
                      {(q.options as string[]).map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correct_answer === optIndex}
                            onChange={() => {
                              updateLocalQuestion(index, { correct_answer: optIndex });
                              handleUpdateQuestion({ ...questions[index], correct_answer: optIndex });
                            }}
                            className="w-4 h-4"
                          />
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...(q.options as string[])];
                              newOptions[optIndex] = e.target.value;
                              updateLocalQuestion(index, { options: newOptions });
                            }}
                            onBlur={() => handleUpdateQuestion(questions[index])}
                            className="bg-background"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditExam;
