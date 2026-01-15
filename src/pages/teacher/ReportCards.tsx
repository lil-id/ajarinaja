import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Users, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle,
  Clock,
  GraduationCap,
  Search
} from 'lucide-react';
import { useAcademicPeriods, type CreateAcademicPeriodData } from '@/hooks/useAcademicPeriods';
import { useReportCards } from '@/hooks/useReportCards';
import { useTeacherStudents } from '@/hooks/useEnrollments';
import { format } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';

const ReportCards = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [createPeriodOpen, setCreatePeriodOpen] = useState(false);
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state for new period
  const [newPeriod, setNewPeriod] = useState<CreateAcademicPeriodData>({
    name: '',
    academic_year: '',
    semester: 1,
    start_date: '',
    end_date: '',
  });

  const { periods, isLoading: periodsLoading, createPeriod, deletePeriod, setActivePeriod } = useAcademicPeriods();
  const { reportCards, isLoading: reportCardsLoading, createReportCard } = useReportCards(selectedPeriod);
  const { data: enrolledStudents = [], isLoading: studentsLoading } = useTeacherStudents();

  const dateLocale = i18n.language === 'id' ? idLocale : enUS;

  // Set default selected period to first active or first period
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      const activePeriod = periods.find(p => p.is_active);
      setSelectedPeriod(activePeriod?.id || periods[0].id);
    }
  }, [periods, selectedPeriod]);

  const handleCreatePeriod = async () => {
    if (!newPeriod.name || !newPeriod.academic_year || !newPeriod.start_date || !newPeriod.end_date) return;
    
    await createPeriod.mutateAsync(newPeriod);
    setCreatePeriodOpen(false);
    setNewPeriod({
      name: '',
      academic_year: '',
      semester: 1,
      start_date: '',
      end_date: '',
    });
  };

  const handleCreateReportCard = async (studentId: string) => {
    if (!selectedPeriod) return;
    
    await createReportCard.mutateAsync({
      student_id: studentId,
      period_id: selectedPeriod,
    });
    setCreateReportOpen(false);
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
        <div className="flex gap-2">
          <Dialog open={createPeriodOpen} onOpenChange={setCreatePeriodOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                {t('reportCards.createPeriod')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('reportCards.createPeriod')}</DialogTitle>
                <DialogDescription>
                  {t('dialogs.selectSubjectToAdd').replace('subject', 'period')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="period-name">{t('reportCards.periodName')}</Label>
                  <Input
                    id="period-name"
                    placeholder="2024/2025 Semester 1"
                    value={newPeriod.name}
                    onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="academic-year">{t('reportCards.academicYear')}</Label>
                    <Input
                      id="academic-year"
                      placeholder="2024/2025"
                      value={newPeriod.academic_year}
                      onChange={(e) => setNewPeriod({ ...newPeriod, academic_year: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester">{t('reportCards.semester')}</Label>
                    <Select
                      value={newPeriod.semester.toString()}
                      onValueChange={(v) => setNewPeriod({ ...newPeriod, semester: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t('reportCards.semester1')}</SelectItem>
                        <SelectItem value="2">{t('reportCards.semester2')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">{t('reportCards.startDate')}</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newPeriod.start_date}
                      onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">{t('reportCards.endDate')}</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={newPeriod.end_date}
                      onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreatePeriodOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreatePeriod} disabled={createPeriod.isPending}>
                  {createPeriod.isPending ? t('common.loading') : t('reportCards.createPeriod')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => setCreatePeriodOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('reportCards.createFirstPeriod')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => (
                <div key={period.id} className="relative group">
                  <Button
                    variant={selectedPeriod === period.id ? "default" : "outline"}
                    className="pr-8"
                    onClick={() => setSelectedPeriod(period.id)}
                  >
                    {period.name}
                    {period.is_active && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {t('reportCards.periodActive')}
                      </Badge>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setActivePeriod.mutate(period.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t('reportCards.setActive')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deletePeriod.mutate(period.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
                  {t('reportCards.reportCardList')} - {currentPeriod?.name}
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
                        <div className="space-y-2 max-h-64 overflow-y-auto">
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
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-sm text-muted-foreground">{student.email}</p>
                                </div>
                              </div>
                              <Plus className="w-5 h-5 text-muted-foreground" />
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
                <Button onClick={() => setCreateReportOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('reportCards.createFirstReportCard')}
                </Button>
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
