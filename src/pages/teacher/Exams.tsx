import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockCourses, mockExams } from '@/data/mockData';
import { Exam, Question } from '@/types';
import { FileText, Plus, Clock, Award, MoreVertical, Edit, Trash2, CheckCircle, AlignLeft } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const TeacherExams = () => {
  const { user } = useAuth();
  const teacherCourses = mockCourses.filter(c => c.teacherId === user?.id);
  const [exams, setExams] = useState<Exam[]>(
    mockExams.filter(e => teacherCourses.some(c => c.id === e.courseId))
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration: 60,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10,
  });

  const addQuestion = () => {
    if (!currentQuestion.question?.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      type: currentQuestion.type as 'multiple-choice' | 'essay',
      question: currentQuestion.question,
      points: currentQuestion.points || 10,
      ...(currentQuestion.type === 'multiple-choice' && {
        options: currentQuestion.options,
        correctAnswer: currentQuestion.correctAnswer,
      }),
    };
    
    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10,
    });
    toast.success('Question added');
  };

  const handleCreateExam = () => {
    if (!selectedCourse || !examForm.title.trim() || questions.length === 0) {
      toast.error('Please fill in all fields and add at least one question');
      return;
    }

    const exam: Exam = {
      id: String(Date.now()),
      courseId: selectedCourse,
      title: examForm.title,
      description: examForm.description,
      duration: examForm.duration,
      questions,
      totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setExams([...exams, exam]);
    setExamForm({ title: '', description: '', duration: 60 });
    setQuestions([]);
    setSelectedCourse('');
    setIsDialogOpen(false);
    toast.success('Exam created successfully!');
  };

  const handleDeleteExam = (examId: string) => {
    setExams(exams.filter(e => e.id !== examId));
    toast.success('Exam deleted');
  };

  const handlePublishExam = (examId: string) => {
    setExams(exams.map(e => 
      e.id === examId ? { ...e, status: 'published' as const } : e
    ));
    toast.success('Exam published!');
  };

  const getCourseTitle = (courseId: string) => {
    return teacherCourses.find(c => c.id === courseId)?.title || 'Unknown Course';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exams</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage course exams
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              New Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Exam Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherCourses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Exam Title</Label>
                  <Input
                    placeholder="e.g., Midterm Exam"
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={examForm.duration}
                      onChange={(e) => setExamForm({ ...examForm, duration: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Questions ({questions.length})</h3>
                
                {/* Question List */}
                {questions.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {questions.map((q, i) => (
                      <div key={q.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        {q.type === 'multiple-choice' ? (
                          <CheckCircle className="w-4 h-4 text-secondary" />
                        ) : (
                          <AlignLeft className="w-4 h-4 text-primary" />
                        )}
                        <span className="flex-1 text-sm truncate">{q.question}</span>
                        <span className="text-xs text-muted-foreground">{q.points} pts</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Question Form */}
                <Tabs 
                  value={currentQuestion.type} 
                  onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, type: v as 'multiple-choice' | 'essay' })}
                >
                  <TabsList className="mb-4">
                    <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
                    <TabsTrigger value="essay">Essay</TabsTrigger>
                  </TabsList>

                  <div className="space-y-4">
                    <Textarea
                      placeholder="Enter your question..."
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                    />

                    <TabsContent value="multiple-choice" className="mt-0 space-y-2">
                      {currentQuestion.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correct"
                            checked={currentQuestion.correctAnswer === i}
                            onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: i })}
                            className="w-4 h-4"
                          />
                          <Input
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[i] = e.target.value;
                              setCurrentQuestion({ ...currentQuestion, options: newOptions });
                            }}
                          />
                        </div>
                      ))}
                    </TabsContent>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-xs">Points</Label>
                        <Input
                          type="number"
                          value={currentQuestion.points}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: Number(e.target.value) })}
                        />
                      </div>
                      <Button onClick={addQuestion} className="mt-5">
                        Add Question
                      </Button>
                    </div>
                  </div>
                </Tabs>
              </div>

              <Button onClick={handleCreateExam} className="w-full" size="lg">
                Create Exam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exams List */}
      {exams.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No exams yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first exam for your courses
            </p>
            <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {exams.map((exam, index) => (
            <Card 
              key={exam.id}
              className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                      exam.status === 'published' 
                        ? 'bg-secondary/10 text-secondary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {exam.status}
                    </span>
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {getCourseTitle(exam.courseId)}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {exam.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handlePublishExam(exam.id)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteExam(exam.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {exam.duration} min
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {exam.questions.length} questions
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    {exam.totalPoints} pts
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherExams;
