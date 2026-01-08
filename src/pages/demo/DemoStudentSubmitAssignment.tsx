import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Clock, 
  Award, 
  Upload, 
  Lock, 
  FileText, 
  AlertCircle,
  Check,
  X,
  File,
  Trash2
} from 'lucide-react';
import { demoAssignments, demoAssignmentQuestions } from '@/data/demoData';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DemoStudentSubmitAssignment() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  
  const assignment = demoAssignments.find(a => a.id === assignmentId);
  const questions = demoAssignmentQuestions.filter(q => q.assignment_id === assignmentId);
  
  const [answers, setAnswers] = useState<Record<string, string | number | number[]>>({});
  const [textContent, setTextContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const isQuestionBased = assignment?.assignment_type === 'questions';
  const dueDate = assignment ? new Date(assignment.due_date) : new Date();
  const isOverdue = dueDate < new Date();

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const handleAnswerChange = (questionId: string, answer: string | number | number[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleMultiSelectChange = (questionId: string, optionIndex: number, checked: boolean) => {
    setAnswers(prev => {
      const current = (prev[questionId] as number[]) || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, optionIndex].sort() };
      } else {
        return { ...prev, [questionId]: current.filter(i => i !== optionIndex) };
      }
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type
      });
      toast.success(`File "${file.name}" selected (Demo)`);
    }
  };

  const handleFileSelect = () => {
    // Simulate file selection
    setUploadedFile({
      name: 'my_assignment.pdf',
      size: 2457600,
      type: 'application/pdf'
    });
    toast.success('File selected (Demo)');
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    toast.info('File removed');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = () => {
    toast.info('Submit is disabled in demo mode. This is a preview experience!', {
      action: {
        label: 'Contact Us',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Assignment Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/demo/student/assignments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/demo/student/assignments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground">{assignment.course_title}</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full">
          <Lock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">Demo Mode</span>
        </div>
      </div>

      {/* Assignment Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <Badge variant={isOverdue ? 'destructive' : 'default'} className="text-sm">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Due: {format(dueDate, 'MMM d, yyyy HH:mm')}
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Award className="h-3.5 w-3.5 mr-1" />
              {isQuestionBased ? totalPoints : assignment.max_points} Points
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {isQuestionBased ? (
                <>
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  {questions.length} Questions
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  File Upload
                </>
              )}
            </Badge>
          </div>

          {assignment.description && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Instructions</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}

          {assignment.allow_late_submissions && isOverdue && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg mt-4 text-amber-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Late submission allowed with {assignment.late_penalty_percent}% penalty
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Area */}
      {isQuestionBased ? (
        <div className="space-y-4">
          {/* Progress Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {answeredCount} of {questions.length} answered
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Questions */}
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Question {index + 1}</Badge>
                    <Badge variant="secondary">{question.points} pts</Badge>
                    <Badge variant="outline" className="capitalize">
                      {question.type.replace('-', ' ')}
                    </Badge>
                  </div>
                  {answers[question.id] !== undefined && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium">{question.question}</p>

                {question.type === 'multiple-choice' && question.options && (
                  <RadioGroup
                    value={answers[question.id]?.toString()}
                    onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
                  >
                    {(question.options as string[]).map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value={optIndex.toString()} id={`${question.id}-${optIndex}`} />
                        <Label htmlFor={`${question.id}-${optIndex}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.type === 'multi-select' && question.options && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Select all that apply</p>
                    {(question.options as string[]).map((option, optIndex) => {
                      const selected = ((answers[question.id] as number[]) || []).includes(optIndex);
                      return (
                        <div key={optIndex} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={`${question.id}-${optIndex}`}
                            checked={selected}
                            onCheckedChange={(checked) => handleMultiSelectChange(question.id, optIndex, checked as boolean)}
                          />
                          <Label htmlFor={`${question.id}-${optIndex}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}

                {question.type === 'essay' && (
                  <Textarea
                    placeholder="Write your answer here..."
                    value={(answers[question.id] as string) || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Your Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <File className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium mb-1">Drag and drop your file here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click the button below to browse</p>
                  <Button variant="outline" onClick={handleFileSelect}>
                    Select File
                  </Button>
                </>
              )}
            </div>

            {/* File Requirements */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 text-sm">File Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  Accepted formats: PDF, DOC, DOCX, JPG, PNG
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  Maximum file size: 10 MB
                </li>
              </ul>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes or comments about your submission..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Notice & Submit Button */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700">Demo Mode Active</p>
              <p className="text-sm text-amber-600">
                Submission is disabled in demo mode. This preview shows how students would submit their work.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/demo/student/assignments')} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              <Lock className="h-4 w-4 mr-2" />
              Submit Assignment (Demo)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
