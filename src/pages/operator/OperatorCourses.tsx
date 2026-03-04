/**
 * @fileoverview Operator Courses Page
 * @description Read-only view of all courses from all teachers for the operator.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAllCourses, CourseWithTeacher } from '@/hooks/useAllCourses';
import { useAcademicPeriods } from '@/hooks/useAcademicPeriods';
import { useRoleUsers } from '@/hooks/useRoleUsers';
import { BookOpen, Search, Users, UserPlus } from 'lucide-react';

const OperatorCourses = () => {
    const { t } = useTranslation();
    const { courses, isLoading, reassignCourseTeacher } = useAllCourses();
    const { periods } = useAcademicPeriods();
    const { data: teachers = [] } = useRoleUsers('teacher');

    const [search, setSearch] = useState('');
    const [filterPeriod, setFilterPeriod] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Assign Teacher Modal State
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<CourseWithTeacher | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');

    const filtered = courses.filter(c => {
        const matchSearch =
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            (c.teacher_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchPeriod = filterPeriod === 'all' || c.period_id === filterPeriod;
        const matchStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchSearch && matchPeriod && matchStatus;
    });

    const handleOpenAssignDialog = (course: CourseWithTeacher) => {
        setSelectedCourse(course);
        setSelectedTeacherId(course.teacher_id);
        setAssignDialogOpen(true);
    };

    const handleAssignTeacher = () => {
        if (!selectedCourse || !selectedTeacherId) return;

        reassignCourseTeacher.mutate({
            courseId: selectedCourse.id,
            teacherId: selectedTeacherId
        }, {
            onSuccess: () => {
                setAssignDialogOpen(false);
                setSelectedCourse(null);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">{t('operator.courses.title')}</h1>
                <p className="text-muted-foreground mt-1">{t('operator.courses.description')}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={t('operator.courses.searchPlaceholder')}
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('courses.selectPeriod')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('courses.allSemesters')}</SelectItem>
                        {periods.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder={t('common.status')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="published">{t('common.published')}</SelectItem>
                        <SelectItem value="draft">{t('common.draft')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Courses List */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('operator.courses.listTitle')} ({filtered.length})</CardTitle>
                    <CardDescription>{t('operator.courses.listDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center py-12 text-muted-foreground">
                            <BookOpen className="w-12 h-12 mb-3" />
                            <p>{t('operator.courses.noCoursesFound')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map(course => (
                                <div
                                    key={course.id}
                                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-10 h-10">
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                                {course.title.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{course.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {course.teacher_name} {course.period_name ? `· ${course.period_name}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" />
                                            {course.enrollment_count}
                                        </span>
                                        <Badge variant={course.status === 'published' ? 'secondary' : 'outline'}>
                                            {course.status === 'published' ? t('common.published') : t('common.draft')}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="ml-2"
                                            onClick={() => handleOpenAssignDialog(course)}
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            {t('operator.courses.assignTeacher')}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assign Teacher Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('operator.courses.assignTeacher')}</DialogTitle>
                        <DialogDescription>
                            {selectedCourse?.title}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('operator.courses.selectTeacher')}</label>
                            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('operator.courses.selectTeacher')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map(teacher => (
                                        <SelectItem key={teacher.id} value={teacher.id}>
                                            {teacher.name} ({teacher.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleAssignTeacher}
                            disabled={!selectedTeacherId || selectedTeacherId === selectedCourse?.teacher_id || reassignCourseTeacher.isPending}
                        >
                            {t('common.saveChanges')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OperatorCourses;
