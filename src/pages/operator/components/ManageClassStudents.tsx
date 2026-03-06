import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Trash2, Users } from 'lucide-react';
import { useRoleUsers } from '@/hooks/useRoleUsers';
import { useClassStudents } from '@/hooks/useClasses';

interface ManageClassStudentsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classId: string;
    classNameStr: string;
}

export const ManageClassStudents = ({ open, onOpenChange, classId, classNameStr }: ManageClassStudentsProps) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: allStudents = [] } = useRoleUsers('student');
    const { students: enrolledStudents, isLoading, addStudent, removeStudent } = useClassStudents(classId);

    // Derive available vs enrolled
    const availableStudents = useMemo(() => {
        const enrolledIds = new Set(enrolledStudents.map((s) => s.student_id));
        return allStudents.filter(
            (student) => !enrolledIds.has(student.id) && student.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allStudents, enrolledStudents, searchQuery]);

    const filteredEnrolled = useMemo(() => {
        return enrolledStudents.filter(
            (s) => (s.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [enrolledStudents, searchQuery]);

    const handleAdd = (studentId: string) => {
        addStudent.mutate({ classId, studentId });
    };

    const handleRemove = (membershipId: string) => {
        removeStudent.mutate(membershipId);
    };

    const isPending = addStudent.isPending || removeStudent.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[95vw] md:w-[90vw] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {t('operator.classes.manageStudents')} - {classNameStr}
                    </DialogTitle>
                    <DialogDescription>
                        {t('operator.classes.classDialogDesc')}
                    </DialogDescription>
                </DialogHeader>

                {/* Search Bar */}
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={t('operator.classes.searchStudent')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 overflow-hidden h-[50vh]">
                    {/* Enrolled Column */}
                    <div className="flex flex-col border rounded-md">
                        <div className="bg-muted p-2 border-b font-medium text-sm flex justify-between items-center">
                            {t('operator.classes.students')}
                            <Badge variant="secondary">{enrolledStudents.length}</Badge>
                        </div>
                        <ScrollArea className="flex-1 p-2">
                            {isLoading ? (
                                <p className="text-sm text-muted-foreground p-2">Loading...</p>
                            ) : filteredEnrolled.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-4 text-center">
                                    {searchQuery ? t('operator.classes.noStudentsFound') : t('operator.classes.noStudentsInClass')}
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {filteredEnrolled.map((membership) => (
                                        <li key={membership.id} className="flex items-center justify-between gap-2 p-2 hover:bg-muted/50 rounded-md border text-sm">
                                            <span className="truncate flex-1 font-medium">{membership.student?.name}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                                                onClick={() => handleRemove(membership.id)}
                                                disabled={isPending}
                                                aria-label={t('operator.classes.removeStudent')}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Available Column */}
                    <div className="flex flex-col border rounded-md">
                        <div className="bg-muted p-2 border-b font-medium text-sm">
                            {t('operator.classes.addStudent')}
                        </div>
                        <ScrollArea className="flex-1 p-2">
                            {availableStudents.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-4 text-center">
                                    {t('operator.classes.noStudentsFound')}
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {availableStudents.map((student) => (
                                        <li key={student.id} className="flex items-center justify-between gap-2 p-2 hover:bg-muted/50 rounded-md border text-sm">
                                            <span className="truncate flex-1 font-medium">{student.name}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 px-2 flex-shrink-0"
                                                onClick={() => handleAdd(student.id)}
                                                disabled={isPending}
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1" />
                                                {t('operator.classes.addStudent')}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
