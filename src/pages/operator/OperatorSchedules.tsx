/**
 * @fileoverview Operator Schedules Page (Jadwal Pelajaran)
 * @description Build and manage weekly class schedules. Assigns courses and teachers to specific classes.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
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
import { CalendarDays, MoreVertical, Plus, Trash2, Pencil, AlertTriangle, Clock } from 'lucide-react';
import { useSchedules, DAY_LABELS, type CreateScheduleData, type ClassSchedule } from '@/hooks/useSchedules';
import { useClasses } from '@/hooks/useClasses';
import { useRoleUsers } from '@/hooks/useRoleUsers';
import { useAllCourses } from '@/hooks/useAllCourses';

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6];

const emptyForm: CreateScheduleData = {
    class_id: '',
    course_id: '',
    teacher_id: null,
    day_of_week: 1,
    start_time: '07:00',
    end_time: '08:30',
    room: '',
};

const OperatorSchedules = () => {
    const { t } = useTranslation();
    const { schedules, isLoading, createSchedule, updateSchedule, deleteSchedule } = useSchedules();
    const { classes } = useClasses();
    const { data: teachers = [] } = useRoleUsers('teacher');
    const { courses } = useAllCourses();

    const [filterClassId, setFilterClassId] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CreateScheduleData>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (s: ClassSchedule) => {
        setEditingId(s.id);
        setForm({
            class_id: s.class_id,
            course_id: s.course_id,
            teacher_id: s.teacher_id,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            room: s.room ?? '',
        });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!form.class_id || !form.course_id) return;
        const payload = { ...form, teacher_id: form.teacher_id || null, room: form.room || null };
        if (editingId) {
            updateSchedule.mutate({ id: editingId, ...payload }, { onSuccess: () => setDialogOpen(false) });
        } else {
            createSchedule.mutate(payload, { onSuccess: () => setDialogOpen(false) });
        }
    };

    const filtered = filterClassId === 'all'
        ? schedules
        : schedules.filter((s) => s.class_id === filterClassId);

    // Group by day_of_week for a weekly view
    const byDay = DAY_OPTIONS.reduce((acc, d) => {
        acc[d] = filtered.filter((s) => s.day_of_week === d);
        return acc;
    }, {} as Record<number, ClassSchedule[]>);

    const isPending = createSchedule.isPending || updateSchedule.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('operator.schedules.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('operator.schedules.description')}</p>
                </div>
                <Button onClick={openCreate} className="gap-2 w-fit">
                    <Plus className="w-4 h-4" />
                    {t('operator.schedules.addSchedule')}
                </Button>
            </div>

            {/* Filter by class */}
            <div className="flex items-center gap-4">
                <Label>{t('operator.schedules.filterByClass')}</Label>
                <Select value={filterClassId} onValueChange={setFilterClassId}>
                    <SelectTrigger className="w-52">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('operator.schedules.allClasses')}</SelectItem>
                        {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Weekly Grid */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
            ) : schedules.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                        <CalendarDays className="w-12 h-12 text-muted-foreground/40" />
                        <p className="text-muted-foreground font-medium">{t('operator.schedules.noSchedules')}</p>
                        <p className="text-sm text-muted-foreground">{t('operator.schedules.noSchedulesDesc')}</p>
                        <Button onClick={openCreate} variant="outline" className="mt-2 gap-2">
                            <Plus className="w-4 h-4" />
                            {t('operator.schedules.addSchedule')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {DAY_OPTIONS.filter((d) => byDay[d].length > 0).map((day) => (
                        <Card key={day}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4" />
                                    {DAY_LABELS[day]}
                                    <Badge variant="secondary" className="ml-1">{byDay[day].length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {byDay[day].map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center gap-3 p-3 rounded-lg border group hover:bg-muted/50 transition-colors"
                                    >
                                        {/* Unassigned alert */}
                                        {!s.teacher_id && (
                                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                        )}
                                        {/* Time */}
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground w-28 flex-shrink-0">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</span>
                                        </div>
                                        {/* Course + class */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {(s.course as unknown as { title: string })?.title ?? '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {(s.class as unknown as { name: string })?.name ?? '—'}
                                                {s.room && ` · ${s.room}`}
                                            </p>
                                        </div>
                                        {/* Teacher or unassigned badge */}
                                        {s.teacher_id ? (
                                            <span className="text-xs text-muted-foreground truncate max-w-[140px] hidden sm:block">
                                                {(s.teacher as unknown as { name: string })?.name ?? '—'}
                                            </span>
                                        ) : (
                                            <Badge variant="outline" className="text-amber-600 border-amber-400 flex-shrink-0 text-xs">
                                                {t('operator.schedules.unassigned')}
                                            </Badge>
                                        )}
                                        {/* Actions */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(s)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    {t('common.edit')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeleteTarget(s.id)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    {t('common.delete')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? t('operator.schedules.editSchedule') : t('operator.schedules.addSchedule')}
                        </DialogTitle>
                        <DialogDescription>{t('operator.schedules.scheduleDialogDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>{t('operator.schedules.class')}</Label>
                            <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('operator.classes.selectClass')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('operator.schedules.course')}</Label>
                            <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('operator.schedules.selectCourse')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('operator.schedules.teacher')}</Label>
                            <Select
                                value={form.teacher_id ?? 'none'}
                                onValueChange={(v) => setForm({ ...form, teacher_id: v === 'none' ? null : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('operator.classes.selectTeacher')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('operator.schedules.unassignedTeacher')}</SelectItem>
                                    {teachers.map((tc) => (
                                        <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('operator.schedules.dayOfWeek')}</Label>
                            <Select
                                value={String(form.day_of_week)}
                                onValueChange={(v) => setForm({ ...form, day_of_week: Number(v) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAY_OPTIONS.map((d) => (
                                        <SelectItem key={d} value={String(d)}>{DAY_LABELS[d]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="start-time">{t('operator.schedules.startTime')}</Label>
                                <Input
                                    id="start-time"
                                    type="time"
                                    value={form.start_time}
                                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-time">{t('operator.schedules.endTime')}</Label>
                                <Input
                                    id="end-time"
                                    type="time"
                                    value={form.end_time}
                                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room">{t('operator.schedules.room')}</Label>
                            <Input
                                id="room"
                                value={form.room ?? ''}
                                onChange={(e) => setForm({ ...form, room: e.target.value })}
                                placeholder={t('operator.schedules.roomPlaceholder')}
                                maxLength={50}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSave} disabled={isPending || !form.class_id || !form.course_id}>
                            {isPending ? t('common.saving') : t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('operator.schedules.deleteScheduleTitle')}</DialogTitle>
                        <DialogDescription>{t('operator.schedules.deleteScheduleDesc')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteTarget && deleteSchedule.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })}
                            disabled={deleteSchedule.isPending}
                        >
                            {deleteSchedule.isPending ? t('common.deleting') : t('common.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OperatorSchedules;
