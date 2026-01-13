import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Download, 
  CheckCircle, 
  XCircle,
  Calendar,
  Award,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { useReportCardEntries } from '@/hooks/useReportCards';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))'];

const StudentReportCardDetail = () => {
  const { t } = useTranslation();
  const { reportCardId } = useParams<{ reportCardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch report card
  const reportCardQuery = useQuery({
    queryKey: ['my-report-card', reportCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_cards')
        .select('*')
        .eq('id', reportCardId!)
        .eq('student_id', user!.id)
        .eq('status', 'finalized')
        .single();

      if (error) throw error;

      // Fetch period info
      const { data: period } = await supabase
        .from('academic_periods')
        .select('*')
        .eq('id', data.period_id)
        .single();

      return { ...data, period };
    },
    enabled: !!reportCardId && !!user,
  });

  const reportCard = reportCardQuery.data;
  const { entries, isLoading: entriesLoading } = useReportCardEntries(reportCardId);

  // Calculate stats
  const passedCount = entries.filter(e => e.passed).length;
  const failedCount = entries.filter(e => !e.passed).length;
  const pieData = [
    { name: t('reportCards.passed'), value: passedCount },
    { name: t('reportCards.notPassed'), value: failedCount },
  ].filter(d => d.value > 0);

  const bestSubject = entries.reduce((best, entry) => 
    entry.final_grade > (best?.final_grade || 0) ? entry : best
  , entries[0]);

  const handleDownloadPDF = () => {
    if (!reportCard) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('RAPOR DIGITAL', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(reportCard.period?.name || '', 105, 28, { align: 'center' });

    // Student info
    doc.setFontSize(11);
    doc.text(`Rata-rata Keseluruhan: ${reportCard.overall_average?.toFixed(2) || '-'}`, 20, 45);
    doc.text(`Jumlah Mata Pelajaran: ${reportCard.total_courses || entries.length}`, 20, 52);

    // Grades table
    const tableData = entries.map((entry, idx) => [
      (idx + 1).toString(),
      entry.course?.title || '-',
      entry.exam_average?.toString() || '-',
      entry.assignment_average?.toString() || '-',
      entry.final_grade.toString(),
      entry.kkm.toString(),
      entry.passed ? 'Lulus' : 'Tidak Lulus',
      entry.teacher_notes || '-',
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['No', 'Mata Pelajaran', 'Ujian', 'Tugas', 'Nilai Akhir', 'KKM', 'Status', 'Catatan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 10 },
        7: { cellWidth: 35 },
      },
    });

    // Teacher notes
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    if (reportCard.teacher_notes) {
      doc.text('Catatan Guru:', 20, finalY);
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(reportCard.teacher_notes, 170);
      doc.text(splitNotes, 20, finalY + 7);
    }

    // Signature
    if (reportCard.teacher_signature) {
      const signY = reportCard.teacher_notes ? finalY + 30 : finalY;
      doc.addImage(reportCard.teacher_signature, 'PNG', 140, signY, 50, 25);
      doc.setFontSize(10);
      doc.text('Tanda Tangan Guru', 165, signY + 30, { align: 'center' });
    }

    doc.save(`rapor-${reportCard.period?.name || 'semester'}.pdf`);
  };

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
        <p className="text-muted-foreground">{t('reportCards.reportNotFinalizedOrNotFound')}</p>
        <Button className="mt-4" onClick={() => navigate('/student/report-cards')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/student/report-cards')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{reportCard.period?.name}</h1>
          <p className="text-muted-foreground">{t('reportCards.digitalReportCard')}</p>
        </div>
        <Button onClick={handleDownloadPDF}>
          <Download className="w-4 h-4 mr-2" />
          {t('reportCards.downloadPdf')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata</p>
                <p className="text-2xl font-bold">{reportCard.overall_average?.toFixed(1) || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lulus</p>
                <p className="text-2xl font-bold">{passedCount} Mapel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tidak Lulus</p>
                <p className="text-2xl font-bold">{failedCount} Mapel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nilai Tertinggi</p>
                <p className="text-2xl font-bold">{bestSubject?.final_grade || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grades Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Detail Nilai per Mata Pelajaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entriesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada data nilai
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead className="text-center">Ujian</TableHead>
                    <TableHead className="text-center">Tugas</TableHead>
                    <TableHead className="text-center">Nilai Akhir</TableHead>
                    <TableHead className="text-center">KKM</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.course?.title || '-'}</p>
                          {entry.teacher_notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {entry.teacher_notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.exam_average?.toFixed(1) || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.assignment_average?.toFixed(1) || '-'}
                      </TableCell>
                      <TableCell className="text-center font-bold text-lg">
                        {entry.final_grade}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {entry.kkm}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={entry.passed ? 'default' : 'destructive'}>
                          {entry.passed ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Lulus
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Tidak Lulus
                            </>
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="space-y-6">
          {/* Pie Chart */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ringkasan Kelulusan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? '#22c55e' : '#ef4444'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Teacher Notes */}
          {reportCard.teacher_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Catatan Guru</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{reportCard.teacher_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Signature */}
          {reportCard.teacher_signature && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tanda Tangan</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="text-center">
                  <img 
                    src={reportCard.teacher_signature} 
                    alt="Tanda Tangan Guru" 
                    className="max-w-full h-20 object-contain"
                  />
                  <p className="text-sm text-muted-foreground mt-2">Guru</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentReportCardDetail;
