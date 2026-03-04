/**
 * @fileoverview Operator Periods Page
 * @description Centralized management of academic periods for the operator.
 * This is the single source of truth for academic periods — teachers can only view/select.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicPeriods, type CreateAcademicPeriodData } from '@/hooks/useAcademicPeriods';
import { CalendarDays, Plus, Trash2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';

const OperatorPeriods = () => {
    const { t, i18n } = useTranslation();
    const { periods, isLoading, createPeriod, deletePeriod, setActivePeriod } = useAcademicPeriods();
    const dateLocale = i18n.language === 'id' ? idLocale : enUS;

    const [createOpen, setCreateOpen] = useState(false);
    const [newPeriod, setNewPeriod] = useState<CreateAcademicPeriodData>({
        name: '',
        academic_year: '',
        semester: 1,
        start_date: '',
        end_date: '',
    });

    const handleCreate = async () => {
        if (!newPeriod.name || !newPeriod.academic_year || !newPeriod.start_date || !newPeriod.end_date) return;
        await createPeriod.mutateAsync(newPeriod);
        setCreateOpen(false);
        setNewPeriod({ name: '', academic_year: '', semester: 1, start_date: '', end_date: '' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('operator.periods.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('operator.periods.description')}</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('operator.periods.createPeriod')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('operator.periods.createPeriod')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="p-name">{t('reportCards.periodName')}</Label>
                                <Input
                                    id="p-name"
                                    placeholder="2024/2025 Semester 1"
                                    value={newPeriod.name}
                                    onChange={e => setNewPeriod({ ...newPeriod, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="p-year">{t('reportCards.academicYear')}</Label>
                                    <Input
                                        id="p-year"
                                        placeholder="2024/2025"
                                        value={newPeriod.academic_year}
                                        onChange={e => setNewPeriod({ ...newPeriod, academic_year: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-sem">{t('reportCards.semester')}</Label>
                                    <Select
                                        value={newPeriod.semester.toString()}
                                        onValueChange={v => setNewPeriod({ ...newPeriod, semester: parseInt(v) })}
                                    >
                                        <SelectTrigger id="p-sem"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">{t('reportCards.semester1')}</SelectItem>
                                            <SelectItem value="2">{t('reportCards.semester2')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="p-start">{t('reportCards.startDate')}</Label>
                                    <Input
                                        id="p-start"
                                        type="date"
                                        value={newPeriod.start_date}
                                        onChange={e => setNewPeriod({ ...newPeriod, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-end">{t('reportCards.endDate')}</Label>
                                    <Input
                                        id="p-end"
                                        type="date"
                                        value={newPeriod.end_date}
                                        onChange={e => setNewPeriod({ ...newPeriod, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
                            <Button onClick={handleCreate} disabled={createPeriod.isPending}>
                                {createPeriod.isPending ? t('common.loading') : t('operator.periods.createPeriod')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Periods List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5" />
                        {t('operator.periods.listTitle')} ({periods.length})
                    </CardTitle>
                    <CardDescription>{t('operator.periods.listDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                        </div>
                    ) : periods.length === 0 ? (
                        <div className="flex flex-col items-center py-12 text-muted-foreground">
                            <CalendarDays className="w-12 h-12 mb-3" />
                            <p>{t('operator.periods.noPeriods')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {periods.map(period => (
                                <div key={period.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{period.name}</p>
                                            {period.is_active && (
                                                <Badge variant="secondary">{t('reportCards.periodActive')}</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {format(new Date(period.start_date), 'd MMM yyyy', { locale: dateLocale })} —{' '}
                                            {format(new Date(period.end_date), 'd MMM yyyy', { locale: dateLocale })}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {!period.is_active && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setActivePeriod.mutate(period.id)}
                                                disabled={setActivePeriod.isPending}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                {t('reportCards.setActive')}
                                            </Button>
                                        )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t('operator.periods.deletePeriod')}</AlertDialogTitle>
                                                    <AlertDialogDescription>{t('operator.periods.deleteConfirm')}</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deletePeriod.mutate(period.id)}>
                                                        {t('common.delete')}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default OperatorPeriods;
