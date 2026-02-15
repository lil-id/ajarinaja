import { useState } from 'react';
import { Eye, EyeOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormulaText from '@/components/FormulaText';
import { cn } from '@/lib/utils';

interface QuestionOption {
  text: string;
  image_url?: string;
}

interface Question {
  id: string;
  type: string;
  question: string;
  image_url?: string;
  options?: string[] | QuestionOption[] | null;
  points: number;
}

/**
 * Props for the StudentPreviewMode component.
 */
interface StudentPreviewModeProps {
  title: string;
  description?: string;
  questions: Question[];
  duration?: number;
  itemType: 'exam' | 'assignment';
  sidebarCollapsed?: boolean;
}

/**
 * Component that simulates the student view for an exam or assignment.
 * Overlay that hides teacher controls and displays content as a student would see it.
 * 
 * @param {StudentPreviewModeProps} props - Component props.
 * @returns {JSX.Element | null} The preview button or overlay.
 */
export default function StudentPreviewMode({
  title,
  description,
  questions,
  duration,
  itemType,
  sidebarCollapsed = false,
}: StudentPreviewModeProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!isPreviewOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsPreviewOpen(true)}
        className="gap-2"
      >
        <Eye className="w-4 h-4" />
        Preview as Student
      </Button>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-auto transition-all duration-300",
      "lg:left-64", // Account for expanded sidebar on desktop
      sidebarCollapsed && "lg:left-16" // Adjust for collapsed sidebar
    )}>
      <div className="container mx-auto max-w-4xl pt-20 pb-8 px-4">
        {/* Preview Header - sticky so Exit button is always visible */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Student Preview Mode</p>
              <p className="text-xs text-muted-foreground">This is what students will see</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsPreviewOpen(false)}
            className="gap-2"
          >
            <EyeOff className="w-4 h-4" />
            Exit Preview
          </Button>
        </div>

        {/* Preview Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-primary">
            <Eye className="w-5 h-5" />
            <span className="font-medium">Preview Mode Active</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            You are viewing this {itemType} as a student would see it. Correct answers are hidden.
          </p>
        </div>

        {/* Exam/Assignment Header */}
        <Card className="border-0 shadow-card mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{title || 'Untitled'}</CardTitle>
                {description && (
                  <p className="text-muted-foreground mt-2">{description}</p>
                )}
              </div>
              <div className="text-right">
                {duration && (
                  <Badge variant="secondary" className="mb-2">
                    {duration} minutes
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  {questions.length} question{questions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="py-12 text-center text-muted-foreground">
                No questions added yet.
              </CardContent>
            </Card>
          ) : (
            questions.map((q, index) => (
              <Card key={q.id} className="border-0 shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-secondary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="capitalize">
                          {q.type.replace('-', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{q.points} pts</span>
                      </div>

                      {q.image_url && (
                        <div className="mb-4">
                          <img
                            src={q.image_url}
                            alt={`Question ${index + 1}`}
                            className="w-full h-auto max-h-[600px] rounded-lg border object-contain bg-muted/50"
                          />
                        </div>
                      )}

                      <div className="text-foreground mb-4">
                        <FormulaText text={q.question || 'No question text'} />
                      </div>
                      {(q.type === 'multiple-choice' || q.type === 'multi-select') && q.options && (
                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => {
                            const isString = typeof opt === 'string';
                            const text = isString ? opt : opt.text;
                            const imageUrl = !isString ? opt.image_url : undefined;

                            return (
                              <label
                                key={optIndex}
                                className={cn(
                                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                                  'hover:bg-muted/50'
                                )}
                              >
                                {q.type === 'multiple-choice' ? (
                                  <input
                                    type="radio"
                                    name={`preview-q-${q.id}`}
                                    disabled
                                    className="w-4 h-4"
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    disabled
                                    className="w-4 h-4"
                                  />
                                )}
                                <div className="flex flex-col gap-2 w-full">
                                  <span className="text-foreground">
                                    <FormulaText text={text || `Option ${optIndex + 1}`} />
                                  </span>
                                  {imageUrl && (
                                    <img
                                      src={imageUrl}
                                      alt={`Option ${optIndex + 1}`}
                                      className="w-full h-auto max-h-[300px] object-contain rounded border mt-2"
                                    />
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {q.type === 'essay' && (
                        <div className="border rounded-lg p-4 bg-muted/20 text-muted-foreground text-sm">
                          Student's essay response will appear here...
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Submit Button Preview */}
        <div className="mt-6 flex justify-end">
          <Button disabled className="gap-2">
            Submit {itemType === 'exam' ? 'Exam' : 'Assignment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
