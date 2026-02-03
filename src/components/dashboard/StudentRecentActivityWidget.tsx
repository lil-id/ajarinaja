import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentRecentActivity } from '@/hooks/useStudentRecentActivity';
import { Loader2, FileText, ClipboardList, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function StudentRecentActivityWidget() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: activities, isLoading } = useStudentRecentActivity(5);

    const handleNavigate = (activity: any) => {
        if (activity.type === 'assignment') {
            navigate(`/student/assignments/${activity.id}`);
        } else {
            navigate(`/student/exam/${activity.id}/results`);
        }
    };

    if (isLoading) {
        return (
            <Card className="border-0 shadow-card h-full">
                <CardHeader>
                    <CardTitle className="text-lg">{t('dashboard.recentActivity')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-card h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t('dashboard.recentActivity')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
                {!activities || activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        {t('dashboard.noRecentActivity')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {activities.map((activity) => (
                            <div
                                key={`${activity.type}-${activity.id}`}
                                onClick={() => handleNavigate(activity)}
                                className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                            >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.type === 'assignment'
                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                                        }`}>
                                        {activity.type === 'assignment' ? (
                                            <ClipboardList className="w-5 h-5" />
                                        ) : (
                                            <FileText className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-foreground truncate">
                                            {activity.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {activity.courseName}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(activity.submittedAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge
                                        variant={activity.status === 'graded' ? 'default' : 'secondary'}
                                        className={`text-[10px] ${activity.status === 'graded' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : ''}`}
                                    >
                                        {activity.status === 'graded' ? t('common.graded') : t('common.submitted')}
                                    </Badge>
                                    {activity.status === 'graded' && activity.score !== undefined && (
                                        <span className="text-xs font-medium">
                                            {activity.score}/{activity.maxPoints || 100}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {activities.length >= 5 && (
                            <button
                                onClick={() => navigate('/student/assignments')}
                                className="w-full text-sm text-primary hover:text-primary/80 transition-colors py-2 flex items-center justify-center gap-1 mt-2"
                            >
                                {t('common.viewAll')}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
