/**
 * @fileoverview Operator Classes Page
 * @description Manage school classes (Rombongan Belajar) — create, view, update, and delete.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { GraduationCap, MoreVertical, Plus, Trash2, Pencil, Users } from 'lucide-react';
import { useClasses, type CreateClassData } from '@/hooks/useClasses';
import { useRoleUsers } from '@/hooks/useRoleUsers';
import { useAcademicPeriods } from '@/hooks/useAcademicPeriods';

const GRADE_LEVELS = [7, 8, 9, 10, 11, 12];

const emptyForm: CreateClassData = {
    name: '',
    grade_level: 10,
    homeroom_teacher_id: null,
    academic_year_id: null,
};

const OperatorClasses = () => {
    const { t } = useTranslation();
    const { classes, isLoading, createClass, updateClass, deleteClass } = useClasses();
    const { data: teachers = [] } = useRoleUsers('teacher');
    const { periods } = useAcademicPeriods();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CreateClassData>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const activePeriod = periods.find((p) => p.is_active);

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...emptyForm, academic_year_id: activePeriod?.id ?? null });
        setDialogOpen(true);
    };

    const openEdit = (cls: (typeof classes)[number]) => {
        setEditingId(cls.id);
        setForm({
            name: cls.name,
            grade_level: cls.grade_level,
            homeroom_teacher_id: cls.homeroom_teacher_id,
            academic_year_id: cls.academic_year_id,
        });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!form.name.trim()) return;
        if (editingId) {
            updateClass.mutate({ id: editingId, ...form }, { onSuccess: () => setDialogOpen(false) });
        } else {
            createClass.mutate(form, { onSuccess: () => setDialogOpen(false) });
        }
    };

    const handleDelete = (id: string) => {
        deleteClass.mutate(id, { onSuccess: () => setDeleteTarget(null) });
    };

    const isPending = createClass.isPending || updateClass.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('operator.classes.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('operator.classes.description')}</p>
                </div>
                <Button onClick={openCreate} className="gap-2 w-fit">
                    <Plus className="w-4 h-4" />
                    {t('operator.classes.addClass')}
                </Button>
            </div>

            {/* Classes Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ) : classes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                        <GraduationCap className="w-12 h-12 text-muted-foreground/40" />
                        <p className="text-muted-foreground font-medium">{t('operator.classes.noClasses')}</p>
                        <p className="text-sm text-muted-foreground">{t('operator.classes.noClassesDesc')}</p>
                        <Button onClick={openCreate} variant="outline" className="mt-2 gap-2">
                            <Plus className="w-4 h-4" />
                            {t('operator.classes.addClass')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls) => (
                        <Card key={cls.id} className="group relative hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg leading-tight">{cls.name}</CardTitle>
                                        <CardDescription>
                                            {t('operator.classes.grade')} {cls.grade_level}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEdit(cls)}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                {t('common.edit')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setDeleteTarget(cls.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                {t('common.delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="w-4 h-4 flex-shrink-0" />
                                    <span>
                                        {cls.student_count ?? 0} {t('operator.classes.students')}
                                    </span>
                                </div>
                                {cls.homeroom_teacher && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <GraduationCap className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{(cls.homeroom_teacher as unknown as { name: string }).name}</span>
                                    </div>
                                )}
                                {cls.academic_period && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                        {(cls.academic_period as unknown as { name: string }).name}
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? t('operator.classes.editClass') : t('operator.classes.addClass')}
                        </DialogTitle>
                        <DialogDescription>{t('operator.classes.classDialogDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="class-name">{t('operator.classes.className')}</Label>
                            <Input
                                id="class-name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder={t('operator.classes.classNamePlaceholder')}
                                maxLength={50}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('operator.classes.gradeLevel')}</Label>
                            <Select
                                value={String(form.grade_level)}
                                onValueChange={(v) => setForm({ ...form, grade_level: Number(v) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {GRADE_LEVELS.map((g) => (
                                        <SelectItem key={g} value={String(g)}>
                                            {t('operator.classes.grade')} {g}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('operator.classes.homeroomTeacher')}</Label>
                            <Select
                                value={form.homeroom_teacher_id ?? 'none'}
                                onValueChange={(v) =>
                                    setForm({ ...form, homeroom_teacher_id: v === 'none' ? null : v })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('operator.classes.selectTeacher')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('operator.classes.noTeacher')}</SelectItem>
                                    {teachers.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('operator.classes.academicPeriod')}</Label>
                            <Select
                                value={form.academic_year_id ?? 'none'}
                                onValueChange={(v) =>
                                    setForm({ ...form, academic_year_id: v === 'none' ? null : v })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('operator.classes.selectPeriod')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('operator.classes.noPeriod')}</SelectItem>
                                    {periods.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSave} disabled={isPending || !form.name.trim()}>
                            {isPending ? t('common.saving') : t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('operator.classes.deleteClassTitle')}</DialogTitle>
                        <DialogDescription>{t('operator.classes.deleteClassDesc')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteTarget && handleDelete(deleteTarget)}
                            disabled={deleteClass.isPending}
                        >
                            {deleteClass.isPending ? t('common.deleting') : t('common.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OperatorClasses;
