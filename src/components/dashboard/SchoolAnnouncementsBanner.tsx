/**
 * @fileoverview School Announcements Banner Widget
 * @description Displays school-wide announcements on dashboards for all roles.
 * Pinned announcements show first, limited to most recent entries.
 */

import { useTranslation } from 'react-i18next';
import { useSchoolAnnouncements } from '@/hooks/useSchoolAnnouncements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Pin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const MAX_VISIBLE = 3;

/**
 * Lightweight banner that shows the latest school-wide announcements.
 * Intended for teacher, student, and parent dashboards.
 */
export function SchoolAnnouncementsBanner() {
    const { t } = useTranslation();
    const { announcements, isLoading } = useSchoolAnnouncements();

    // Only show pinned announcements on dashboards
    const pinnedAnnouncements = announcements.filter(a => a.is_pinned);

    // Don't render anything while loading or when there are no pinned announcements
    if (isLoading || pinnedAnnouncements.length === 0) return null;

    const visible = pinnedAnnouncements.slice(0, MAX_VISIBLE);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                    {t('operator.announcements.title')}
                </h2>
            </div>

            {visible.map((announcement) => (
                <Card
                    key={announcement.id}
                    className="border-0 shadow-card animate-slide-up"
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    {announcement.is_pinned && (
                                        <Badge variant="default" className="gap-1 text-xs">
                                            <Pin className="w-3 h-3" />
                                            {t('operator.announcements.pinLabel')}
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-base">{announcement.title}</CardTitle>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(announcement.created_at), 'PPp')}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">
                            {announcement.content}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
