import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  PenTool,
  Download,
  RotateCcw,
  BookOpen,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { useReportCards, useReportCardEntries, useSyncStudentAttendance, type CreateReportCardEntryData } from '@/hooks/useReportCards';
import { useAcademicPeriods } from '@/hooks/useAcademicPeriods';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Report Card Detail page.
 * 
 * Interface for managing a specific student's report card.
 * Features:
 * - View student info and overall stats
 * - Input grades for each subject (Exam, Assignment, Final)
 * - Auto-calculate pass/fail status based on KKM
 * - Add teacher notes
 * - Digital signature canvas
 * - Generate and Download PDF
 * - Finalize report card (locks editing)
 * 
 * @returns {JSX.Element} The rendered Report Card Detail page.
 */
const ReportCardDetail = () => {
  const { t } = useTranslation();
  const { reportCardId } = useParams<{ reportCardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [addCourseDialogOpen, setAddCourseDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');


  // Fetch single report card
  const reportCardQuery = useQuery({
    queryKey: ['report-card', reportCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_cards')
        .select('*')
        .eq('id', reportCardId!)
        .single();

      if (error) throw error;

      // Fetch student profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, name, email, avatar_url')
        .eq('user_id', data.student_id)
        .single();

      // Fetch period info
      const { data: period } = await supabase
        .from('academic_periods')
        .select('*')
        .eq('id', data.period_id)
        .single();

      return {
        ...data,
        student: profile,
        period,
      };
    },
    enabled: !!reportCardId,
  });

  const reportCard = reportCardQuery.data;
  const { entries, isLoading: entriesLoading, bulkUpsertEntries, deleteEntry } = useReportCardEntries(reportCardId);
  const { updateReportCard, finalizeReportCard } = useReportCards();
  const syncStudentAttendance = useSyncStudentAttendance();
  const { courses } = useCourses();

  // Local state for entries
  const [localEntries, setLocalEntries] = useState<Record<string, {
    exam_average: string;
    assignment_average: string;
    final_grade: string;
    kkm: string;
    teacher_notes: string;
    attendance_grade?: string;
  }>>({});

  // Initialize local entries from fetched data
  useEffect(() => {
    if (entries.length > 0) {
      const entriesMap: Record<string, any> = {};
      entries.forEach(entry => {
        entriesMap[entry.id] = {
          exam_average: entry.exam_average?.toString() || '',
          assignment_average: entry.assignment_average?.toString() || '',
          final_grade: entry.final_grade.toString(),
          kkm: entry.kkm.toString(),
          teacher_notes: entry.teacher_notes || '',
          attendance_grade: entry.attendance_grade?.toString() || '',
        };
      });
      setLocalEntries(entriesMap);
    }
  }, [entries]);

  useEffect(() => {
    if (reportCard?.teacher_notes) {
      setTeacherNotes(reportCard.teacher_notes);
    }
  }, [reportCard]);

  // Signature canvas drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureImage(null);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignatureImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCalculateFinalGrade = async () => {
    if (!reportCard) return;

    setIsCalculating(true);

    try {
      const updatedEntries: Record<string, any> = {};

      for (const entry of entries) {
        const courseId = entry.course_id;
        const studentId = reportCard.student_id;

        // Fetch all exams for this course
        const { data: exams } = await supabase
          .from('exams')
          .select('id')
          .eq('course_id', courseId);

        const examIds = exams?.map(e => e.id) || [];

        // Fetch exam submissions
        let examAverage: number | null = null;
        if (examIds.length > 0) {
          const { data: examSubmissions } = await supabase
            .from('exam_submissions')
            .select('score')
            .eq('student_id', studentId)
            .in('exam_id', examIds);

          if (examSubmissions && examSubmissions.length > 0) {
            const validScores = examSubmissions.filter(s => s.score !== null);
            if (validScores.length > 0) {
              const sum = validScores.reduce((acc, s) => acc + (s.score || 0), 0);
              examAverage = sum / validScores.length;
            }
          }
        }

        // Fetch all assignments for this course
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .eq('course_id', courseId);

        const assignmentIds = assignments?.map(a => a.id) || [];

        // Fetch assignment submissions (only graded)
        let assignmentAverage: number | null = null;
        if (assignmentIds.length > 0) {
          const { data: assignmentSubmissions } = await supabase
            .from('assignment_submissions')
            .select('score')
            .eq('student_id', studentId)
            .eq('graded', true)
            .in('assignment_id', assignmentIds);

          if (assignmentSubmissions && assignmentSubmissions.length > 0) {
            const validScores = assignmentSubmissions.filter(s => s.score !== null);
            if (validScores.length > 0) {
              const sum = validScores.reduce((acc, s) => acc + (s.score || 0), 0);
              assignmentAverage = sum / validScores.length;
            }
          }
        }

        // Calculate overall average for final grade
        let finalGrade = '';
        if (examAverage !== null && assignmentAverage !== null) {
          finalGrade = ((examAverage + assignmentAverage) / 2).toFixed(2);
        } else if (examAverage !== null) {
          finalGrade = examAverage.toFixed(2);
        } else if (assignmentAverage !== null) {
          finalGrade = assignmentAverage.toFixed(2);
        }

        // Update local entries
        updatedEntries[entry.id] = {
          ...localEntries[entry.id],
          exam_average: examAverage !== null ? examAverage.toFixed(2) : '',
          assignment_average: assignmentAverage !== null ? assignmentAverage.toFixed(2) : '',
          final_grade: finalGrade,
        };
      }

      setLocalEntries(prev => ({ ...prev, ...updatedEntries }));
      toast.success(t('toast.gradesCalculated') || 'Grades calculated');
    } catch (error) {
      console.error('Error calculating grades:', error);
      toast.error(t('toast.failedToSaveGrades'));
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSyncAttendance = async () => {
    if (!reportCardId || !reportCard?.period_id) return;

    try {
      await syncStudentAttendance.mutateAsync({
        studentId: reportCard.student_id,
        periodId: reportCard.period_id
      });
      // Note: syncStudentAttendance invalidates 'report-cards' which might update header via refetch
      // and 'report-card-entries' which updates the list.
      // Because 'entries' updates, the useEffect at line 133 will update 'localEntries', 
      // reflecting the new attendance_percentage/grade in the UI immediately.
    } catch (error) {
      // Toast handled by hook
    }
  };

  const handleUpdateEntry = (entryId: string, field: string, value: string) => {
    setLocalEntries(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value,
      },
    }));
  };

  const handleSaveEntries = async () => {
    // Only save entries that actually exist in the current entries list
    const entriesToSave: CreateReportCardEntryData[] = entries
      .filter(entry => localEntries[entry.id]) // Only include entries that have local data
      .map(entry => {
        const data = localEntries[entry.id];
        return {
          report_card_id: reportCardId!,
          course_id: entry.course_id,
          exam_average: data.exam_average ? parseFloat(data.exam_average) : undefined,
          assignment_average: data.assignment_average ? parseFloat(data.assignment_average) : undefined,
          final_grade: parseFloat(data.final_grade),
          kkm: parseInt(data.kkm),
          teacher_notes: data.teacher_notes || undefined,
        };
      });

    await bulkUpsertEntries.mutateAsync(entriesToSave);

    // Calculate overall average
    const validGrades = entriesToSave.filter(e => !isNaN(e.final_grade));
    const overallAverage = validGrades.length > 0
      ? validGrades.reduce((sum, e) => sum + e.final_grade, 0) / validGrades.length
      : null;

    await updateReportCard.mutateAsync({
      id: reportCardId!,
      overall_average: overallAverage,
      total_courses: validGrades.length,
      teacher_notes: teacherNotes || undefined,
    });
  };

  const handleAddCourse = async () => {
    if (!selectedCourseId || !reportCardId) return;

    const { error } = await supabase
      .from('report_card_entries')
      .insert({
        report_card_id: reportCardId,
        course_id: selectedCourseId,
        final_grade: 0,
        kkm: 60,
      });

    if (error) {
      toast.error(`${t('reportCards.failedToAddSubject')}: ${error.message}`);
      return;
    }

    toast.success(t('reportCards.subjectAdded'));
    setAddCourseDialogOpen(false);
    setSelectedCourseId('');
    // Refetch entries
    window.location.reload();
  };

  const handleFinalize = async () => {
    let signature = signatureImage;

    if (signatureMode === 'draw') {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      signature = canvas.toDataURL('image/png');
    }

    if (!signature) {
      toast.error(t('reportCards.emptySignatureError') || 'Please provide a signature');
      return;
    }

    await finalizeReportCard.mutateAsync({
      id: reportCardId!,
      signature,
    });
    setSignatureDialogOpen(false);
  };

  const handleUnfinalize = async () => {
    if (!reportCardId) return;

    try {
      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'draft',
          finalized_at: null,
          finalized_by: null,
        })
        .eq('id', reportCardId);

      if (error) throw error;

      toast.success(t('reportCards.unfinalizeSuccess'));
      window.location.reload();
    } catch (error) {
      console.error('Error unfinalizing report card:', error);
      toast.error(t('toast.failedToUpdateReportCard'));
    }
  };

  const handleDownloadPDF = () => {
    if (!reportCard) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text(t('reportCards.digitalReportCard').toUpperCase(), 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(reportCard.period?.name || '', 105, 28, { align: 'center' });

    // Student info
    doc.setFontSize(11);
    doc.text(`${t('auth.name')}: ${reportCard.student?.name || '-'}`, 20, 45);
    doc.text(`${t('auth.email')}: ${reportCard.student?.email || '-'}`, 20, 52);
    doc.text(`${t('reportCards.status')}: ${reportCard.status === 'finalized' ? t('common.finalized') : t('common.draft')}`, 20, 59);

    // Grades table
    const tableData = entries.map((entry, idx) => {
      const examAvg = entry.exam_average || 0;
      const assignAvg = entry.assignment_average || 0;
      const hasExam = entry.exam_average !== null;
      const hasAssignment = entry.assignment_average !== null;

      let overallAvg = '-';
      if (hasExam && hasAssignment) {
        overallAvg = ((examAvg + assignAvg) / 2).toFixed(2);
      } else if (hasExam) {
        overallAvg = examAvg.toFixed(2);
      } else if (hasAssignment) {
        overallAvg = assignAvg.toFixed(2);
      }

      return [
        (idx + 1).toString(),
        entry.course?.title || '-',
        entry.exam_average?.toString() || '-',
        entry.assignment_average?.toString() || '-',
        overallAvg,
        entry.final_grade.toString(),
        entry.kkm.toString(),
        entry.passed ? t('reportCards.passed') : t('reportCards.notPassed'),
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [[
        'No',
        t('reportCards.subject'),
        t('reportCards.examAverage'),
        t('reportCards.assignmentAverage'),
        t('reportCards.overallAverage'),
        t('reportCards.finalGrade'),
        t('reportCards.kkm'),
        t('reportCards.status')
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Overall average
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`${t('reportCards.average')}: ${reportCard.overall_average?.toFixed(2) || '-'}`, 20, finalY);

    // Teacher notes
    if (reportCard.teacher_notes) {
      doc.text(`${t('reportCards.teacherNotes')}:`, 20, finalY + 10);
      doc.setFontSize(10);
      doc.text(reportCard.teacher_notes, 20, finalY + 17);
    }

    // Signature
    if (reportCard.teacher_signature) {
      doc.addImage(reportCard.teacher_signature, 'PNG', 140, finalY + 20, 50, 25);
      doc.setFontSize(10);
      doc.text(t('reportCards.teacherSignature'), 165, finalY + 50, { align: 'center' });
    }

    doc.save(`report-${reportCard.student?.name || 'student'}-${reportCard.period?.name || 'semester'}.pdf`);
  };

  // Filter courses not yet added
  const availableCourses = courses.filter(
    c => !entries.some(e => e.course_id === c.id)
  );

  if (reportCardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!reportCard) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('reportCards.reportNotFound')}</p>
        <Button className="mt-4" onClick={() => navigate('/teacher/report-cards')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/report-cards')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t('reportCards.reportCardDetail')}</h1>
          <p className="text-muted-foreground">{reportCard.period?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            {t('reportCards.downloadPdf')}
          </Button>
          <Button
            onClick={handleSaveEntries}
            disabled={bulkUpsertEntries.isPending || reportCard.status === 'finalized'}
          >
            <Save className="w-4 h-4 mr-2" />
            {bulkUpsertEntries.isPending ? t('common.saving') : t('common.save')}
          </Button>
          {reportCard.status !== 'finalized' ? (
            <Button
              variant="default"
              onClick={() => setSignatureDialogOpen(true)}
            >
              <PenTool className="w-4 h-4 mr-2" />
              {t('reportCards.finalize')}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleUnfinalize}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('reportCards.unfinalize')}
            </Button>
          )}
        </div>
      </div>

      {/* Student Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={reportCard.student?.avatar_url || undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {reportCard.student?.name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{reportCard.student?.name}</h2>
              <p className="text-muted-foreground">{reportCard.student?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t('reportCards.average')}</p>
                <p className="text-3xl font-bold text-primary">
                  {reportCard.overall_average?.toFixed(1) || '-'}
                </p>
              </div>
              <Badge
                variant={reportCard.status === 'finalized' ? 'default' : 'secondary'}
                className="h-8"
              >
                {reportCard.status === 'finalized' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {t('common.finalized')}
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-1" />
                    {t('common.draft')}
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('reportCards.gradePerSubject')}</CardTitle>
              <CardDescription className='mt-2'>{t('reportCards.autoCalculated')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleCalculateFinalGrade}
                disabled={reportCard.status === 'finalized' || isCalculating || entries.length === 0}
              >
                <Calculator className="w-4 h-4 mr-2" />
                {isCalculating ? t('reportCards.calculatingGrades') : t('reportCards.calculateFinalGrade')}
              </Button>
              <Button
                variant="outline"
                onClick={handleSyncAttendance}
                disabled={reportCard.status === 'finalized' || syncStudentAttendance.isPending}
                title={t('reportCards.calculatedFromAttendance')}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncStudentAttendance.isPending ? 'animate-spin' : ''}`} />
                {syncStudentAttendance.isPending ? t('reportCards.syncingAttendance') : t('reportCards.calculateAttendance')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setAddCourseDialogOpen(true)}
                disabled={reportCard.status === 'finalized'}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('reportCards.addSubject')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">{t('reportCards.noSubjectsYet')}</p>
              <Button variant="outline" onClick={() => setAddCourseDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('reportCards.addSubject')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reportCards.subject')}</TableHead>
                  <TableHead className="w-32">{t('reportCards.examAverage')}</TableHead>
                  <TableHead className="w-32">{t('reportCards.assignmentAverage')}</TableHead>
                  <TableHead className="w-24">{t('attendance.title') || 'Attendance'}</TableHead>
                  <TableHead className="w-32">{t('reportCards.overallAverage')}</TableHead>
                  <TableHead className="w-32">{t('reportCards.finalGrade')}</TableHead>
                  <TableHead className="w-24">{t('reportCards.kkm')}</TableHead>
                  <TableHead className="w-24">{t('reportCards.status')}</TableHead>
                  <TableHead className="w-64">{t('reportCards.notes')}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {entries.map((entry) => {
                  const localEntry = localEntries[entry.id] || {
                    exam_average: entry.exam_average?.toString() || '',
                    assignment_average: entry.assignment_average?.toString() || '',
                    final_grade: entry.final_grade.toString(),
                    kkm: entry.kkm.toString(),
                    teacher_notes: entry.teacher_notes || '',
                    attendance_grade: entry.attendance_grade?.toString() || '',
                  };
                  const finalGrade = parseFloat(localEntry.final_grade) || 0;
                  const kkm = parseInt(localEntry.kkm) || 60;
                  const passed = finalGrade >= kkm;

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.course?.title || '-'}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={localEntry.exam_average}
                          onChange={(e) => handleUpdateEntry(entry.id, 'exam_average', e.target.value)}
                          disabled={reportCard.status === 'finalized'}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={localEntry.assignment_average}
                          onChange={(e) => handleUpdateEntry(entry.id, 'assignment_average', e.target.value)}
                          disabled={reportCard.status === 'finalized'}
                          className="w-full"
                        />
                      </TableCell>
                      {/* Attendance: Show Read-Only or Calculated? 
                          Currently per-subject attendance isn't fully linked in Rapor entries table, 
                          but typically Report Card has 1 Overall Attendance. 
                          If we want Per-Course Attendance, we'd need to fetch it separately. 
                          For now, just sticking to standard marks. 
                      */}
                      <TableCell>
                        <div className="text-center font-medium bg-muted/50 p-2 rounded">
                          {localEntry.attendance_grade
                            ? parseFloat(localEntry.attendance_grade).toFixed(1)
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center font-medium">
                          {(() => {
                            const examAvg = parseFloat(localEntry.exam_average) || 0;
                            const assignAvg = parseFloat(localEntry.assignment_average) || 0;
                            const hasExam = localEntry.exam_average !== '';
                            const hasAssignment = localEntry.assignment_average !== '';

                            if (!hasExam && !hasAssignment) return '-';
                            if (hasExam && !hasAssignment) return examAvg.toFixed(2);
                            if (!hasExam && hasAssignment) return assignAvg.toFixed(2);

                            const overall = (examAvg + assignAvg) / 2;
                            return overall.toFixed(2);
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={localEntry.final_grade}
                          onChange={(e) => handleUpdateEntry(entry.id, 'final_grade', e.target.value)}
                          disabled={reportCard.status === 'finalized'}
                          className="w-full font-semibold"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={localEntry.kkm}
                          onChange={(e) => handleUpdateEntry(entry.id, 'kkm', e.target.value)}
                          disabled={reportCard.status === 'finalized'}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={passed ? 'default' : 'destructive'}>
                          {passed ? t('reportCards.passed') : t('reportCards.notPassed')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder={t('dialogs.notesPlaceholder')}
                          value={localEntry.teacher_notes}
                          onChange={(e) => handleUpdateEntry(entry.id, 'teacher_notes', e.target.value)}
                          disabled={reportCard.status === 'finalized'}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEntry.mutate(entry.id)}
                          disabled={reportCard.status === 'finalized'}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Attendance Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{t('attendance.attendancePercentage') || 'Attendance'}</h3>
              <p className="text-muted-foreground">{t('reportCards.calculatedFromAttendance') || 'Based on session records'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('reportCards.grade')}</p>
              <div className="flex items-baseline gap-2 justify-end">
                <span className="text-3xl font-bold text-blue-600">
                  {(reportCard as any).attendance_percentage !== null && (reportCard as any).attendance_percentage !== undefined
                    ? `${(reportCard as any).attendance_percentage.toFixed(1)}%`
                    : '-'}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({(reportCard as any).attendance_grade?.toFixed(1) || '-'})
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Notes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dialogs.generalNotes')}</CardTitle>
          <CardDescription>{t('dialogs.notesForStudent')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t('dialogs.writeGeneralNotes')}
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            disabled={reportCard.status === 'finalized'}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Add Course Dialog */}
      <Dialog open={addCourseDialogOpen} onOpenChange={setAddCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogs.addSubject')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.selectSubjectToAdd')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('reportCards.subject')}</Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('dialogs.chooseSubject')} />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableCourses.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {t('dialogs.allSubjectsAdded')}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCourseDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddCourse} disabled={!selectedCourseId}>
              {t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dialogs.signatureAndFinalize')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.drawSignature')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex gap-2 border-b pb-2">
              <Button
                variant={signatureMode === 'draw' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSignatureMode('draw')}
              >
                Draw
              </Button>
              <Button
                variant={signatureMode === 'upload' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSignatureMode('upload')}
              >
                Upload
              </Button>
            </div>

            {signatureMode === 'draw' ? (
              <div className="space-y-2">
                <div className="border-2 border-dashed rounded-lg p-1 bg-white">
                  <canvas
                    ref={signatureCanvasRef}
                    width={380}
                    height={150}
                    className="w-full cursor-crosshair rounded"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={clearSignature}>
                  {t('dialogs.clearSignature')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleSignatureUpload}
                />
                {signatureImage && (
                  <div className="mt-4 border rounded p-2 bg-white flex justify-center">
                    <img src={signatureImage} alt="Signature Preview" className="max-h-32 object-contain" />
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSignatureImage(null)} disabled={!signatureImage}>
                  {t('dialogs.clearSignature')}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignatureDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleFinalize} disabled={finalizeReportCard.isPending}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {finalizeReportCard.isPending ? t('common.loading') : t('dialogs.finalizeReportCard')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportCardDetail;
