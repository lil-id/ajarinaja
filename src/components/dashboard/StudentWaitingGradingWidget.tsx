import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentWaitingGrading } from '@/hooks/useStudentWaitingGrading';
import { Loader2, Clock, ArrowRight, ClipboardList, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

export function StudentWaitingGradingWidget() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data, isLoading } = useStudentWaitingGrading();

    const handleNavigate = (item: any) => {
        if (item.type === 'assignment') {
            navigate(`/student/assignments/${item.id}`);
        } else {
            navigate(`/student/exam/${item.id}/results`);
        }
    };

    if (isLoading) {
        return (
            <Card className="border-0 shadow-card h-full">
                <CardHeader>
                    <CardTitle className="text-lg">{t('dashboard.pendingGrading')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { total = 0, items = [] } = data || {};

    return (
        <Card className="border-0 shadow-card h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    {t('dashboard.pendingGrading')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
                {total === 0 ? (
                    <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-2">
                            <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {t('dashboard.allGraded')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Total Badge */}
                        <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-yellow-500/10">
                            <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{total}</span>
                            <span className="text-sm text-muted-foreground">
                                {t('assignments.ungraded')}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {items.slice(0, 5).map((item) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => handleNavigate(item)}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === 'assignment'
                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                            : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                                            }`}>
                                            {item.type === 'assignment' ? (
                                                <ClipboardList className="w-4 h-4" />
                                            ) : (
                                                <FileText className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {item.courseName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
