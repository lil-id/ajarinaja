import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Calendar,
  Users,
  Edit,
  CheckCircle,
  Clock,
  GraduationCap,
  Search,
  UsersRound
} from 'lucide-react';
import { useAcademicPeriods } from '@/hooks/useAcademicPeriods';
import { useReportCards } from '@/hooks/useReportCards';
import { useTeacherStudents } from '@/hooks/useEnrollments';
import { useHomeroomClassesByPeriod } from '@/hooks/useClasses';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';

/**
 * Teacher Report Cards Management page.
 * 
 * Dashboard for managing report cards per academic period.
 * Academic periods are managed centrally by the Operator (Bagian Akademik).
 * Teachers select an existing period to view and create report cards.
 * 
 * @returns {JSX.Element} The rendered Report Cards page.
 */
const ReportCards = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [createBulkReportOpen, setCreateBulkReportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const { periods, isLoading: periodsLoading } = useAcademicPeriods();
  const { reportCards, isLoading: reportCardsLoading, createReportCard, createBulkReportCards } = useReportCards(selectedPeriod);
  const { data: enrolledStudents = [], isLoading: studentsLoading } = useTeacherStudents();
  const { data: homeroomClasses = [], isLoading: homeroomClassesLoading } = useHomeroomClassesByPeriod(selectedPeriod);

  const dateLocale = i18n.language === 'id' ? idLocale : enUS;

  // Set default selected period to first active or first period
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      const activePeriod = periods.find(p => p.is_active);
      setSelectedPeriod(activePeriod?.id || periods[0].id);
    }
  }, [periods, selectedPeriod]);

  const handleCreateReportCard = async (studentId: string) => {
    if (!selectedPeriod) return;
    await createReportCard.mutateAsync({ student_id: studentId, period_id: selectedPeriod });
    setCreateReportOpen(false);
  };

  const handleCreateBulkReportCards = async () => {
    if (!selectedPeriod || !selectedClassId) return;

    try {
      // Fetch students for the selected class
      const { data: classStudents, error } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', selectedClassId);

      if (error) throw error;

      if (!classStudents || classStudents.length === 0) {
        toast.error(t('reportCards.noStudentsInClass'));
        return;
      }

      // Filter out students who already have a report card for this period
      const existingStudentIds = new Set(reportCards.map((rc) => rc.student_id));
      const newStudentIds = classStudents
        .map((cs) => cs.student_id)
        .filter((id) => !existingStudentIds.has(id));

      if (newStudentIds.length === 0) {
        toast.info(t('toast.reportCardAlreadyExists'));
        setCreateBulkReportOpen(false);
        return;
      }

      // Prepare payload
      const bulkData = newStudentIds.map((studentId) => ({
        student_id: studentId,
        period_id: selectedPeriod,
      }));

      // Execute bulk creation
      await createBulkReportCards.mutateAsync(bulkData);

      toast.success(t('reportCards.bulkReportCardsCreated', { count: newStudentIds.length }));
      setCreateBulkReportOpen(false);
      setSelectedClassId('');
    } catch (error) {
      console.error('Failed to create bulk report cards:', error);
      toast.error(t('toast.error'));
    }
  };

  const filteredReportCards = reportCards.filter(rc =>
    rc.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rc.student?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentPeriod = periods.find(p => p.id === selectedPeriod);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('reportCards.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('reportCards.description')}
          </p>
        </div>
      </div>

      {/* Info: operator manages periods */}
      {periods.length === 0 && !periodsLoading && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200">
          <Calendar className="w-5 h-5 flex-shrink-0" />
          <span>{t('reportCards.noPeriodsOperatorNote')}</span>
        </div>
      )}

      {/* Period Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('reportCards.academicPeriod')}</CardTitle>
          <CardDescription>{t('reportCards.selectPeriod')}</CardDescription>
        </CardHeader>
        <CardContent>
          {periodsLoading ? (
            <div className="flex gap-2">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          ) : periods.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t('reportCards.noPeriods')}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => (
                <Button
                  key={period.id}
                  variant={selectedPeriod === period.id ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod(period.id)}
                >
                  {period.name}
                  {period.is_active && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {t('reportCards.periodActive')}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Cards List */}
      {selectedPeriod && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('reportCards.reportCardList')} - {t('reportCards.semester')} {currentPeriod?.semester} {currentPeriod?.academic_year}
                </CardTitle>
                <CardDescription>
                  {currentPeriod && format(new Date(currentPeriod.start_date), 'd MMM yyyy', { locale: dateLocale })} - {currentPeriod && format(new Date(currentPeriod.end_date), 'd MMM yyyy', { locale: dateLocale })}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('reportCards.searchStudents')}
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Dialog open={createReportOpen} onOpenChange={setCreateReportOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('reportCards.createReportCard')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('reportCards.createReportCard')}</DialogTitle>
                      <DialogDescription>
                        {t('reportCards.selectStudent')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      {enrolledStudents && enrolledStudents.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {enrolledStudents.map((student) => (
                            <div
                              key={student.user_id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                              onClick={() => handleCreateReportCard(student.user_id)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={student.avatar_url || undefined} />
                                  <AvatarFallback>{student.name?.charAt(0) || 'S'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium inline-block max-w-[200px] truncate" title={student.name}>{student.name}</p>
                                  <p className="text-sm text-muted-foreground inline-block max-w-[200px] truncate" title={student.email}>{student.email}</p>
                                </div>
                              </div>
                              <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          {t('reportCards.noStudents')}
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Bulk Create Dialog */}
                <Dialog open={createBulkReportOpen} onOpenChange={setCreateBulkReportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary">
                      <UsersRound className="w-4 h-4 mr-2" />
                      {t('reportCards.createBulkReportCards')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('reportCards.createReportCardClass')}</DialogTitle>
                      <DialogDescription>
                        {t('reportCards.selectHomeroomClass')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      {homeroomClassesLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : homeroomClasses.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {homeroomClasses.map((cls) => (
                            <div
                              key={cls.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedClassId === cls.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                                }`}
                              onClick={() => setSelectedClassId(cls.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                  <UsersRound className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{cls.name}</p>
                                  <p className="text-sm text-muted-foreground">Level {cls.grade_level}</p>
                                </div>
                              </div>
                              {selectedClassId === cls.id && (
                                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          {t('reportCards.noHomeroomClassNote')}
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateBulkReportOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button
                        onClick={handleCreateBulkReportCards}
                        disabled={!selectedClassId || createBulkReportCards.isPending}
                      >
                        {createBulkReportCards.isPending ? t('common.creating') : t('common.create')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reportCardsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredReportCards.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('reportCards.noReportCards')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('reportCards.selectStudent')}
                </p>
                <div className="flex justify-center gap-3 mt-4">
                  <Button onClick={() => setCreateReportOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('reportCards.createFirstReportCard')}
                  </Button>
                  <Button variant="secondary" onClick={() => setCreateBulkReportOpen(true)}>
                    <UsersRound className="w-4 h-4 mr-2" />
                    {t('reportCards.createBulkReportCards')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReportCards.map((reportCard) => (
                  <div
                    key={reportCard.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/teacher/report-cards/${reportCard.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={reportCard.student?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {reportCard.student?.name?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{reportCard.student?.name || 'Unknown Student'}</h4>
                        <p className="text-sm text-muted-foreground">{reportCard.student?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {reportCard.overall_average !== null && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t('reportCards.average')}</p>
                          <p className="text-xl font-bold">{reportCard.overall_average}</p>
                        </div>
                      )}
                      <Badge variant={reportCard.status === 'finalized' ? 'default' : 'secondary'}>
                        {reportCard.status === 'finalized' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t('common.finalized')}
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            {t('common.draft')}
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportCards;
