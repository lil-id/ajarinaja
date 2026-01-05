import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Plus, 
  Search, 
  Filter, 
  Tag, 
  BookOpen, 
  Edit, 
  Trash2, 
  Copy,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { demoQuestionBank, demoCourses } from '@/data/demoData';
import { toast } from 'sonner';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

export default function DemoTeacherQuestionBank() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const categories = [...new Set(demoQuestionBank.map(q => q.category))];
  const types = [...new Set(demoQuestionBank.map(q => q.type))];

  const filteredQuestions = demoQuestionBank.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || question.category === categoryFilter;
    const matchesType = typeFilter === 'all' || question.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleAction = () => {
    toast.info("Demo Mode - This action is disabled. Contact us for full access!", {
      action: {
        label: "Contact",
        onClick: () => window.open('https://wa.me/yourwhatsapp', '_blank')
      }
    });
  };

  const renderQuestion = (text: string) => {
    const parts = text.split(/(\$[^$]+\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const latex = part.slice(1, -1);
        try {
          return <InlineMath key={index} math={latex} />;
        } catch {
          return <span key={index}>{part}</span>;
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'multiple-choice': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'multi-select': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'essay': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground">Organize and reuse questions across exams and assignments</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="new">+ New Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="multi-select">Multi-Select</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea 
                  placeholder="Enter your question here. Use $...$ for LaTeX formulas."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input placeholder="e.g., algebra, equations, basic" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input type="number" placeholder="10" />
                </div>
                <div className="space-y-2">
                  <Label>Course (Optional)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific course</SelectItem>
                      {demoCourses.map(course => (
                        <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={() => { setIsCreateOpen(false); handleAction(); }}>
                  <Lock className="h-4 w-4 mr-2" />
                  Save Question
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoQuestionBank.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...demoQuestionBank.map(q => q.used_count))}x
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Points</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(demoQuestionBank.reduce((acc, q) => acc + q.points, 0) / demoQuestionBank.length)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
            <SelectItem value="multi-select">Multi-Select</SelectItem>
            <SelectItem value="essay">Essay</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <QuestionList 
            questions={filteredQuestions} 
            renderQuestion={renderQuestion}
            getTypeColor={getTypeColor}
            handleAction={handleAction}
          />
        </TabsContent>

        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="space-y-4">
            <QuestionList 
              questions={filteredQuestions.filter(q => q.category === cat)} 
              renderQuestion={renderQuestion}
              getTypeColor={getTypeColor}
              handleAction={handleAction}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Demo Notice */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              In the full version, you can add, edit, delete, duplicate questions, and import them directly into exams.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAction}>
            Get Full Access
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface QuestionListProps {
  questions: typeof demoQuestionBank;
  renderQuestion: (text: string) => React.ReactNode;
  getTypeColor: (type: string) => string;
  handleAction: () => void;
}

function QuestionList({ questions, renderQuestion, getTypeColor, handleAction }: QuestionListProps) {
  return (
    <div className="space-y-4">
      {questions.map(question => (
        <Card key={question.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getTypeColor(question.type)}>
                    {question.type === 'multiple-choice' ? 'Multiple Choice' :
                     question.type === 'multi-select' ? 'Multi-Select' : 'Essay'}
                  </Badge>
                  <Badge variant="outline">{question.category}</Badge>
                  <Badge variant="secondary">{question.points} pts</Badge>
                  <span className="text-xs text-muted-foreground">
                    Used {question.used_count}x
                  </span>
                </div>
                <p className="text-sm font-medium">{renderQuestion(question.question)}</p>
                {question.options && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {question.options.map((opt, idx) => (
                      <div 
                        key={idx} 
                        className={`text-xs p-2 rounded border ${
                          question.type === 'multi-select' 
                            ? (question.correct_answers?.includes(idx) ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : '')
                            : (question.correct_answer === idx ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : '')
                        }`}
                      >
                        {renderQuestion(opt)}
                        {question.type === 'multi-select' && question.correct_answers?.includes(idx) && (
                          <CheckCircle2 className="inline h-3 w-3 ml-1 text-green-600" />
                        )}
                        {question.type === 'multiple-choice' && question.correct_answer === idx && (
                          <CheckCircle2 className="inline h-3 w-3 ml-1 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1 flex-wrap mt-2">
                  {question.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={handleAction}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleAction}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleAction}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {questions.length === 0 && (
        <Card className="p-8 text-center">
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No questions found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
        </Card>
      )}
    </div>
  );
}
