import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  X, ChevronRight, ChevronLeft, BookOpen, FileText, 
  ClipboardList, Users, BarChart2, GraduationCap, MessageSquare 
} from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const teacherTourSteps: TourStep[] = [
  {
    title: 'Welcome to AjarinAja!',
    description: 'This interactive demo lets you explore all features as a teacher. You can view forms and interfaces, but saving is disabled.',
    icon: <GraduationCap className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Create Courses',
    description: 'Navigate to Courses to create and manage your course content. Add descriptions, materials, and organize your curriculum.',
    icon: <BookOpen className="h-8 w-8 text-secondary" />,
    highlight: 'courses',
  },
  {
    title: 'Build Exams',
    description: 'Design comprehensive exams with multiple choice, multi-select, and essay questions. Set KKM thresholds and auto-grade MCQs.',
    icon: <FileText className="h-8 w-8 text-blue-500" />,
    highlight: 'exams',
  },
  {
    title: 'Assign Tasks',
    description: 'Create assignments with file uploads or question-based formats. Set deadlines and rubrics for consistent grading.',
    icon: <ClipboardList className="h-8 w-8 text-amber-500" />,
    highlight: 'assignments',
  },
  {
    title: 'Track Students',
    description: 'Monitor student progress, identify at-risk learners, and view enrollment status across all your courses.',
    icon: <Users className="h-8 w-8 text-purple-500" />,
    highlight: 'students',
  },
  {
    title: 'View Analytics',
    description: 'Get insights into student performance with charts and reports. Export data to CSV or PDF for records.',
    icon: <BarChart2 className="h-8 w-8 text-green-500" />,
    highlight: 'analytics',
  },
  {
    title: 'Ready to Start?',
    description: 'Explore the demo freely! Switch to student view using the sidebar. Contact us on WhatsApp for full access.',
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
  },
];

const studentTourSteps: TourStep[] = [
  {
    title: 'Welcome, Student!',
    description: 'Experience the LMS as a student. Browse courses, take exams, and submit assignments in this interactive preview.',
    icon: <GraduationCap className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Your Courses',
    description: 'Access enrolled courses, view materials, and track your learning progress. All content is organized by course.',
    icon: <BookOpen className="h-8 w-8 text-secondary" />,
    highlight: 'courses',
  },
  {
    title: 'Take Exams',
    description: 'Answer exam questions with a timer, navigate between questions, and submit when ready. View results after grading.',
    icon: <FileText className="h-8 w-8 text-blue-500" />,
    highlight: 'exams',
  },
  {
    title: 'Submit Assignments',
    description: 'Upload files or answer questions for assignments. Track due dates and view feedback from teachers.',
    icon: <ClipboardList className="h-8 w-8 text-amber-500" />,
    highlight: 'assignments',
  },
  {
    title: 'Track Progress',
    description: 'View your performance analytics, grades, and learning progress across all enrolled courses.',
    icon: <BarChart2 className="h-8 w-8 text-green-500" />,
    highlight: 'analytics',
  },
  {
    title: 'Start Exploring!',
    description: 'Navigate freely through the demo. Switch to teacher view to see the full admin experience.',
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
  },
];

interface DemoTourProps {
  role: 'teacher' | 'student';
  onComplete?: () => void;
}

export function DemoTour({ role, onComplete }: DemoTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const tourSteps = role === 'teacher' ? teacherTourSteps : studentTourSteps;

  useEffect(() => {
    // Check if tour has been seen
    const tourKey = `demo-tour-${role}-seen`;
    const hasSeen = sessionStorage.getItem(tourKey);
    
    if (!hasSeen) {
      // Small delay to let the page load
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [role]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem(`demo-tour-${role}-seen`, 'true');
    onComplete?.();
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-2">
        <CardContent className="p-6">
          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              {step.icon}
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2">{step.title}</h3>
            <p className="text-muted-foreground">{step.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {tourSteps.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-primary' 
                    : index < currentStep 
                      ? 'bg-primary/50' 
                      : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <Button variant="outline" size="sm" onClick={handleSkip}>
              Skip Tour
            </Button>

            <Button onClick={handleNext}>
              {currentStep === tourSteps.length - 1 ? (
                'Start Demo'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
