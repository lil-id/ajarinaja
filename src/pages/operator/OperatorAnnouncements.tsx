/**
 * @fileoverview Operator School Announcements Page
 * @description Manage school-wide announcements visible to all roles.
 * Operators can create, pin, and delete announcements with role targeting.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import {
    useSchoolAnnouncements,
    useCreateSchoolAnnouncement,
    useDeleteSchoolAnnouncement,
    useToggleSchoolAnnouncementPin,
} from '@/hooks/useSchoolAnnouncements';
import { Megaphone, Plus, Trash2, Loader2, Calendar, Pin, PinOff, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AVAILABLE_ROLES = ['teacher', 'student', 'parent'] as const;

const OperatorAnnouncements = () => {
    const { t } = useTranslation();
    const { announcements, isLoading } = useSchoolAnnouncements();
    const createAnnouncement = useCreateSchoolAnnouncement();
    const deleteAnnouncement = useDeleteSchoolAnnouncement();
    const togglePin = useToggleSchoolAnnouncementPin();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [form, setForm] = useState({
        title: '',
        content: '',
        is_pinned: false,
        target_roles: ['teacher', 'student', 'parent'] as string[],
    });

    const resetForm = () => {
        setForm({
            title: '',
            content: '',
            is_pinned: false,
            target_roles: ['teacher', 'student', 'parent'],
        });
    };

    const handleToggleRole = (role: string, checked: boolean) => {
        setForm(prev => ({
            ...prev,
            target_roles: checked
                ? [...prev.target_roles, role]
                : prev.target_roles.filter(r => r !== role),
        }));
    };

    const getRoleLabel = (role: string): string => {
        const labels: Record<string, string> = {
            teacher: t('operator.announcements.teachers'),
            student: t('operator.announcements.students'),
            parent: t('operator.announcements.parents'),
        };
        return labels[role] || role;
    };

    const handleCreate = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            toast.error(t('toast.fillRequiredFields'));
            return;
        }
        if (form.target_roles.length === 0) {
            toast.error(t('toast.fillRequiredFields'));
            return;
        }

        try {
            await createAnnouncement.mutateAsync({
                title: form.title.trim(),
                content: form.content.trim(),
                is_pinned: form.is_pinned,
                target_roles: form.target_roles,
            });
            resetForm();
            setIsDialogOpen(false);
            toast.success(t('toast.announcementPosted'));
        } catch {
            toast.error(t('toast.failedToPostAnnouncement'));
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteAnnouncement.mutateAsync(id);
            toast.success(t('toast.announcementDeleted'));
        } catch {
            toast.error(t('toast.failedToDeleteAnnouncement'));
        }
    };

    const handleTogglePin = async (id: string, currentlyPinned: boolean) => {
        try {
            await togglePin.mutateAsync({ id, is_pinned: !currentlyPinned });
            toast.success(!currentlyPinned
                ? t('operator.announcements.pinnedSuccess')
                : t('operator.announcements.unpinnedSuccess'));
        } catch {
            toast.error(t('toast.failedToPostAnnouncement'));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-secondary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {t('operator.announcements.title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('operator.announcements.description')}
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button variant="default">
                            <Plus className="w-4 h-4" />
                            {t('operator.announcements.create')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{t('operator.announcements.create')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label>{t('operator.announcements.titleLabel')}</Label>
                                <Input
                                    placeholder={t('operator.announcements.titlePlaceholder')}
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    maxLength={200}
                                />
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <Label>{t('operator.announcements.contentLabel')}</Label>
                                <Textarea
                                    placeholder={t('operator.announcements.contentPlaceholder')}
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    rows={4}
                                    maxLength={2000}
                                />
                            </div>

                            {/* Target Roles */}
                            <div className="space-y-3">
                                <Label>{t('operator.announcements.targetRoles')}</Label>
                                <div className="flex flex-wrap gap-4">
                                    {AVAILABLE_ROLES.map(role => (
                                        <div key={role} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`role-${role}`}
                                                checked={form.target_roles.includes(role)}
                                                onCheckedChange={(checked) => handleToggleRole(role, !!checked)}
                                            />
                                            <label
                                                htmlFor={`role-${role}`}
                                                className="text-sm font-medium leading-none cursor-pointer"
                                            >
                                                {getRoleLabel(role)}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pin Toggle */}
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">
                                        {t('operator.announcements.pinned')}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {t('operator.announcements.pinnedDescription')}
                                    </p>
                                </div>
                                <Switch
                                    checked={form.is_pinned}
                                    onCheckedChange={(checked) => setForm({ ...form, is_pinned: checked })}
                                />
                            </div>

                            {/* Submit */}
                            <Button
                                onClick={handleCreate}
                                className="w-full"
                                disabled={createAnnouncement.isPending}
                            >
                                {createAnnouncement.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                {t('operator.announcements.create')}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <Card className="border-0 shadow-card">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Megaphone className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {t('operator.announcements.noAnnouncements')}
                        </h3>
                        <p className="text-muted-foreground text-center mb-4">
                            {t('operator.announcements.noAnnouncementsDesc')}
                        </p>
                        <Button variant="default" onClick={() => setIsDialogOpen(true)}>
                            <Plus className="w-4 h-4" />
                            {t('operator.announcements.create')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {announcements.map((announcement, index) => (
                        <Card
                            key={announcement.id}
                            className="border-0 shadow-card animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        {/* Badges row */}
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            {announcement.is_pinned && (
                                                <Badge variant="default" className="gap-1">
                                                    <Pin className="w-3 h-3" />
                                                    {t('operator.announcements.pinLabel')}
                                                </Badge>
                                            )}
                                            {announcement.target_roles.map(role => (
                                                <Badge key={role} variant="outline" className="gap-1 text-xs">
                                                    <Users className="w-3 h-3" />
                                                    {getRoleLabel(role)}
                                                </Badge>
                                            ))}
                                        </div>
                                        <CardTitle>{announcement.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(announcement.created_at), 'PPp')}
                                        </CardDescription>
                                    </div>

                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleTogglePin(announcement.id, announcement.is_pinned)}
                                            title={announcement.is_pinned
                                                ? t('operator.announcements.unpin')
                                                : t('operator.announcements.pinned')}
                                        >
                                            {announcement.is_pinned
                                                ? <PinOff className="w-4 h-4 text-primary" />
                                                : <Pin className="w-4 h-4 text-muted-foreground" />}
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive flex-shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        {t('operator.announcements.deleteConfirm')}
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {t('operator.announcements.deleteConfirmDesc')}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(announcement.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        {t('common.delete')}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OperatorAnnouncements;
