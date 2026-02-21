import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Clock, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceSummaryProps {
    stats: {
        present: number;
        late: number;
        excused: number;
        absent: number;
        total: number;
    };
}

export const AttendanceSummary = ({ stats }: AttendanceSummaryProps) => {
    const { t } = useTranslation();

    const items = [
        {
            label: t('attendance.status.present'),
            value: stats.present,
            icon: Check,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50'
        },
        {
            label: t('attendance.status.late'),
            value: stats.late,
            icon: Clock,
            color: 'bg-amber-500',
            textColor: 'text-amber-600',
            bgColor: 'bg-amber-50'
        },
        {
            label: t('attendance.status.excused'),
            value: stats.excused,
            icon: FileText,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            label: t('attendance.status.absent'),
            value: stats.absent,
            icon: X,
            color: 'bg-rose-500',
            textColor: 'text-rose-600',
            bgColor: 'bg-rose-50'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item) => (
                <Card key={item.label} className="border-none shadow-sm overflow-hidden">
                    <CardContent className={cn("p-4 flex items-center gap-4", item.bgColor)}>
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm", item.color)}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                            <p className={cn("text-2xl font-bold", item.textColor)}>{item.value}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
