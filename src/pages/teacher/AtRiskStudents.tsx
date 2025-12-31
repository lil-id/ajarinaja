import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, AlertCircle, Info, Loader2, BookOpen, FileText, ClipboardList, TrendingDown, ExternalLink } from 'lucide-react';
import { useAtRiskStudents, RiskFactor } from '@/hooks/useAtRiskStudents';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const getRiskIcon = (type: RiskFactor['type']) => {
  switch (type) {
    case 'no_material_views':
      return BookOpen;
    case 'missed_deadline':
      return ClipboardList;
    case 'low_score':
    case 'below_kkm':
      return TrendingDown;
    case 'no_exam_submissions':
      return FileText;
    case 'late_submission':
      return ClipboardList;
    default:
      return Info;
  }
};

const getRiskLabel = (type: RiskFactor['type']) => {
  switch (type) {
    case 'no_material_views':
      return 'Low Engagement';
    case 'missed_deadline':
      return 'Missed Deadline';
    case 'low_score':
      return 'Low Performance';
    case 'below_kkm':
      return 'Below KKM';
    case 'no_exam_submissions':
      return 'Missing Exam';
    case 'late_submission':
      return 'Late Submission';
    default:
      return 'Risk Factor';
  }
};

// Get link based on risk factor type - now uses specific IDs for navigation
const getRiskLink = (factor: RiskFactor, courseId: string) => {
  switch (factor.type) {
    case 'no_material_views':
      return `/teacher/courses/${factor.courseId || courseId}`;
    case 'missed_deadline':
    case 'late_submission':
      if (factor.assignmentIds && factor.assignmentIds.length > 0) {
        return `/teacher/assignments/${factor.assignmentIds[0]}/submissions`;
      }
      return `/teacher/assignments`;
    case 'low_score':
    case 'no_exam_submissions':
      if (factor.examIds && factor.examIds.length > 0) {
        return `/teacher/exams/${factor.examIds[0]}/grade`;
      }
      return `/teacher/exams`;
    case 'below_kkm':
      // Navigate to first below-KKM item
      if (factor.examIds && factor.examIds.length > 0) {
        return `/teacher/exams/${factor.examIds[0]}/grade`;
      }
      if (factor.assignmentIds && factor.assignmentIds.length > 0) {
        return `/teacher/assignments/${factor.assignmentIds[0]}/submissions`;
      }
      return `/teacher/exams`;
    default:
      return `/teacher/courses/${courseId}`;
  }
};

export default function AtRiskStudents() {
  const navigate = useNavigate();
  const { atRiskStudents, isLoading, highRiskCount, mediumRiskCount, lowRiskCount } = useAtRiskStudents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">At-Risk Students</h1>
          <p className="text-muted-foreground">
            Monitor students who may need additional support
          </p>
        </div>
        <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
          <Info className="h-4 w-4 inline-block mr-1" />
          Configure risk criteria per assignment/exam in their settings
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{highRiskCount}</p>
              <p className="text-sm text-muted-foreground">High Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{mediumRiskCount}</p>
              <p className="text-sm text-muted-foreground">Medium Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{lowRiskCount}</p>
              <p className="text-sm text-muted-foreground">Low Risk</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Students List */}
      {atRiskStudents.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">All Students On Track</h3>
            <p className="text-muted-foreground text-center max-w-md">
              No students are currently flagged. Configure at-risk criteria when creating or editing assignments and exams.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>Students Requiring Attention</CardTitle>
            <CardDescription>
              {atRiskStudents.length} student{atRiskStudents.length !== 1 ? 's' : ''} flagged based on per-item risk criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {atRiskStudents.map((student) => (
                <div
                  key={`${student.studentId}-${student.courseId}`}
                  className={cn(
                    'p-4 rounded-xl border transition-colors',
                    student.riskLevel === 'high' && 'border-destructive/50 bg-destructive/5',
                    student.riskLevel === 'medium' && 'border-orange-500/50 bg-orange-50 dark:bg-orange-950/10',
                    student.riskLevel === 'low' && 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/10'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className={cn(
                        student.riskLevel === 'high' && 'bg-destructive/20 text-destructive',
                        student.riskLevel === 'medium' && 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
                        student.riskLevel === 'low' && 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                      )}>
                        {student.studentName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{student.studentName}</h3>
                        <Badge
                          variant={student.riskLevel === 'high' ? 'destructive' : 'outline'}
                          className={cn(
                            'w-fit',
                            student.riskLevel === 'medium' && 'border-orange-500 text-orange-600 dark:text-orange-400',
                            student.riskLevel === 'low' && 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                          )}
                        >
                          {student.riskLevel.charAt(0).toUpperCase() + student.riskLevel.slice(1)} Risk
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                      <p className="text-sm text-muted-foreground mb-3">Course: {student.courseName}</p>
                      
                      {/* Risk Factors - now clickable */}
                      <div className="flex flex-wrap gap-2">
                        {student.riskFactors.map((factor, index) => {
                          const Icon = getRiskIcon(factor.type);
                          const link = getRiskLink(factor, student.courseId);
                          return (
                            <button
                              key={index}
                              onClick={() => navigate(link)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border text-sm',
                                'hover:bg-muted transition-colors cursor-pointer group'
                              )}
                            >
                              <Icon className={cn(
                                'w-4 h-4',
                                factor.severity === 'high' && 'text-destructive',
                                factor.severity === 'medium' && 'text-orange-500',
                                factor.severity === 'low' && 'text-yellow-500'
                              )} />
                              <span className="text-foreground">{factor.description}</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
