import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Plus, Trash2, Calendar, Pin, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function DemoOperatorAnnouncements() {
    const { t } = useTranslation();

    const announcements = [
        {
            id: '1',
            title: 'Welcome to the New Academic Year!',
            content: 'We are excited to start this new year together. Please check your schedules and ensure all materials are ready.',
            created_at: new Date().toISOString(),
            is_pinned: true,
            target_roles: ['teacher', 'student', 'parent']
        },
        {
            id: '2',
            title: 'Reporting Maintenance',
            content: 'The reporting system will be undergoing maintenance this weekend. Please ensure all grades are saved before Friday evening.',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            is_pinned: false,
            target_roles: ['teacher']
        }
    ];

    const getRoleLabel = (role: string): string => {
        const labels: Record<string, string> = {
            teacher: t('operator.announcements.teachers'),
            student: t('operator.announcements.students'),
            parent: t('operator.announcements.parents'),
        };
        return labels[role] || role;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {t('operator.announcements.title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('operator.announcements.description')} (Demo)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 h-fit">
                        <Eye className="w-3 h-3 mr-1" /> {t('demo.viewOnly')}
                    </Badge>
                    <Button variant="default" disabled>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('operator.announcements.create')}
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {announcements.map((announcement) => (
                    <Card key={announcement.id} className="border-0 shadow-sm">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
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
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" disabled>
                                        <Pin className={`w-4 h-4 ${announcement.is_pinned ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" disabled>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
