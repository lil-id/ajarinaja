import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    Calendar,
    BookOpen,
    Users,
    ChevronLeft,
    ChevronRight,
    Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DemoOperatorSchedules() {
    const { t } = useTranslation();

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [
        '07:30 - 09:00',
        '09:00 - 10:30',
        '10:30 - 12:00',
        '13:00 - 14:30',
        '14:30 - 16:00'
    ];

    const schedules = [
        { day: 'Monday', time: '07:30 - 09:00', subject: 'Mathematics', teacher: 'Budi Santoso', class: '10-A', room: 'R-101' },
        { day: 'Monday', time: '09:00 - 10:30', subject: 'Physics', teacher: 'Dewi Lestari', class: '11-B', room: 'R-202' },
        { day: 'Wednesday', time: '10:30 - 12:00', subject: 'Chemistry', teacher: 'Siti Aminah', class: '12-C', room: 'Lab-01' },
        { day: 'Friday', time: '13:00 - 14:30', subject: 'Biology', teacher: 'Eko Prasetyo', class: '10-A', room: 'Lab-02' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('nav.schedules')}</h1>
                    <p className="text-muted-foreground mt-1">Manage and view institution-wide class schedules (Demo).</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 h-fit">
                        <Eye className="w-3 h-3 mr-1" /> {t('demo.viewOnly')}
                    </Badge>
                    <div className="flex items-center bg-card border rounded-lg p-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium px-2">July 2024</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <CardTitle>Weekly Schedule View</CardTitle>
                        </div>
                        <Badge variant="outline" className="font-mono">Active Term: 2024/2025 S1</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 bg-muted/20 border-b border-r text-left text-xs font-semibold uppercase tracking-wider w-32">Time</th>
                                    {days.map(day => (
                                        <th key={day} className="p-4 bg-muted/20 border-b border-r text-center text-xs font-semibold uppercase tracking-wider">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map(slot => (
                                    <tr key={slot}>
                                        <td className="p-4 border-b border-r text-xs font-medium text-muted-foreground bg-muted/5">{slot}</td>
                                        {days.map(day => {
                                            const entry = schedules.find(s => s.day === day && s.time === slot);
                                            return (
                                                <td key={`${day}-${slot}`} className="p-2 border-b border-r align-top min-w-[150px] min-h-[100px]">
                                                    {entry && (
                                                        <div className="bg-primary/10 border-l-4 border-primary p-2 rounded-r-md text-xs space-y-1">
                                                            <div className="font-bold text-primary truncate">{entry.subject}</div>
                                                            <div className="flex items-center gap-1 text-muted-foreground truncate">
                                                                <Users className="w-3 h-3" />
                                                                {entry.class} • {entry.room}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-muted-foreground truncate">
                                                                <BookOpen className="w-3 h-3" />
                                                                {entry.teacher}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Conflict Analysis</CardTitle>
                        <CardDescription>Scheduled classes and resource availability check</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4 flex items-start gap-3">
                            <div className="p-1 bg-green-500 rounded-full">
                                <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-green-700 dark:text-green-400">No schedule conflicts detected</h4>
                                <p className="text-sm text-green-600 dark:text-green-500 mt-1">All 124 weekly sessions are properly allocated with room and teacher availability.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Sessions</span>
                            <span className="font-bold">124</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Classroom Usage</span>
                            <span className="font-bold text-primary">82%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Avg Load / Teacher</span>
                            <span className="font-bold">18 JTM</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const CheckCircle = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);
