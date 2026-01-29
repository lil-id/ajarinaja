import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRecentSubmissions } from '@/hooks/useRecentSubmissions';
import { Loader2, FileText, ClipboardList, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function RecentSubmissionsWidget() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: submissions, isLoading } = useRecentSubmissions(5);

    const handleNavigate = (submission: typeof submissions[0]) => {
        if (submission.item_type === 'assignment') {
            navigate(`/teacher/assignments/${submission.assignment_id}/submissions`);
        } else {
            navigate(`/teacher/exams/${submission.exam_id}/grade`);
        }
    };

    if (isLoading) {
        return (
            <Card className="border-0 shadow-card">
                <CardHeader>
                    <CardTitle className="text-lg">{t('dashboard.recentSubmissions')}</CardTitle>
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
        <Card className="border-0 shadow-card">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t('dashboard.recentSubmissions')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!submissions || submissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        {t('dashboard.noRecentSubmissions')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {submissions.map((submission) => (
                            <div
                                key={submission.id}
                                onClick={() => handleNavigate(submission)}
                                className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                            >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${submission.item_type === 'assignment'
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-secondary/10 text-secondary'
                                        }`}>
                                        {submission.item_type === 'assignment' ? (
                                            <ClipboardList className="w-5 h-5" />
                                        ) : (
                                            <FileText className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-foreground truncate">
                                            {submission.student_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {submission.item_title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge variant={submission.graded ? 'secondary' : 'outline'} className="text-xs">
                                        {submission.graded ? t('common.graded') : t('common.pending')}
                                    </Badge>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}

                        {submissions.length >= 5 && (
                            <button
                                onClick={() => navigate('/teacher/assignments')}
                                className="w-full text-sm text-primary hover:text-primary/80 transition-colors py-2 flex items-center justify-center gap-1"
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
