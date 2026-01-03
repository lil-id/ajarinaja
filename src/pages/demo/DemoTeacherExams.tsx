import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Clock, Award, Lock, CheckCircle, AlignLeft, Trash2 } from 'lucide-react';
import { demoExams, demoCourses, demoQuestions } from '@/data/demoData';
import { toast } from 'sonner';
import FormulaText from '@/components/FormulaText';

export default function DemoTeacherExams() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    course_id: '',
    duration: 60,
    kkm: 70,
  });
  const [questions, setQuestions] = useState<Array<{
    id: string;
    type: 'multiple-choice' | 'essay';
    question: string;
    options: string[];
    points: number;
  }>>([]);

  const handleCreate = () => {
    toast.info('Save is disabled in demo mode. Contact us for full access!', {
      action: {
        label: 'Contact',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  const addQuestion = (type: 'multiple-choice' | 'essay') => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        type,
        question: '',
        options: type === 'multiple-choice' ? ['', '', '', ''] : [],
        points: 10,
      },
    ]);
  };

  const examQuestions = demoQuestions.filter(q => q.exam_id === selectedExam);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Management</h1>
          <p className="text-muted-foreground">Create and manage exams with questions</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Exam Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Exam Title</Label>
                  <Input
                    placeholder="e.g., Midterm Exam - Chapter 1-5"
                    value={newExam.title}
                    onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select value={newExam.course_id} onValueChange={(v) => setNewExam({ ...newExam, course_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {demoCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={newExam.duration}
                    onChange={(e) => setNewExam({ ...newExam, duration: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Exam instructions and details..."
                    value={newExam.description}
                    onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Questions ({questions.length})</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => addQuestion('multiple-choice')}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Add MCQ
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addQuestion('essay')}>
                      <AlignLeft className="h-4 w-4 mr-1" />
                      Add Essay
                    </Button>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    No questions yet. Add your first question!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, index) => (
                      <Card key={q.id} className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {q.type === 'multiple-choice' ? (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              ) : (
                                <AlignLeft className="h-4 w-4 text-primary" />
                              )}
                              <span className="font-medium">Question {index + 1}</span>
                              <Badge variant="outline">{q.type}</Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setQuestions(questions.filter((_,i) => i !== index))}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Enter your question..."
                            value={q.question}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[index].question = e.target.value;
                              setQuestions(updated);
                            }}
                            className="mb-3"
                          />
                          {q.type === 'multiple-choice' && (
                            <div className="grid gap-2">
                              {q.options.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <input type="radio" name={`q-${index}`} className="w-4 h-4" />
                                  <Input
                                    placeholder={`Option ${optIndex + 1}`}
                                    value={opt}
                                    onChange={(e) => {
                                      const updated = [...questions];
                                      updated[index].options[optIndex] = e.target.value;
                                      setQuestions(updated);
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Lock className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700">Saving is disabled in demo mode</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="flex-1">
                  Create Exam
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {demoExams.map((exam) => (
          <Card
            key={exam.id}
            className={`hover:shadow-lg transition-all cursor-pointer ${selectedExam === exam.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedExam(selectedExam === exam.id ? null : exam.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{exam.title}</CardTitle>
                <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                  {exam.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{exam.course_title}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {exam.duration} min
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {exam.total_points} pts
                </div>
                <span>KKM: {exam.kkm}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Questions */}
      {selectedExam && examQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exam Questions Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {examQuestions.map((q, index) => (
              <div key={q.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {q.type === 'multiple-choice' ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlignLeft className="h-4 w-4 text-primary" />
                  )}
                  <span className="font-medium">Q{index + 1}</span>
                  <Badge variant="outline">{q.points} pts</Badge>
                </div>
                <p className="mb-2"><FormulaText text={q.question} /></p>
                {q.options && (
                  <div className="grid gap-2 ml-4">
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <FormulaText text={opt} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
