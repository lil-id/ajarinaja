import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCourseAttendanceStats } from '@/hooks/useAttendanceSessions';
import { Loader2, Download, FileSpreadsheet, FileText, Filter, Calendar as CalendarIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subMonths } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface AttendanceStudentSummaryProps {
    courseId: string;
}

type Period = 'all' | '1month' | '3months' | 'semester' | 'custom';

export function AttendanceStudentSummary({ courseId }: AttendanceStudentSummaryProps) {
    const { t } = useTranslation();
    const [period, setPeriod] = useState<Period>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    // Calculate filter range based on period
    const filterRange = useMemo(() => {
        if (period === 'custom') {
            return { from: dateRange?.from, to: dateRange?.to };
        }

        const now = new Date();
        let from: Date | undefined;
        // To today
        const to = now;

        switch (period) {
            case '1month':
                from = subMonths(now, 1);
                break;
            case '3months':
                from = subMonths(now, 3);
                break;
            case 'semester':
                from = subMonths(now, 6);
                break;
            case 'all':
            default:
                return undefined;
        }
        return { from, to };
    }, [period, dateRange]);

    const { data: stats, isLoading } = useCourseAttendanceStats(courseId, filterRange);

    const handleExportCSV = () => {
        if (!stats) return;

        const headers = [
            t('auth.name'),
            t('auth.email'),
            t('attendance.status.present'),
            t('attendance.status.late'),
            t('attendance.status.excused'),
            t('attendance.status.absent'),
            t('attendance.attendancePercentage') || 'Attendance %'
        ];

        const rows = stats.map((student: any) => [
            student.name,
            student.email,
            student.present,
            student.late,
            student.excused,
            student.absent,
            `${student.attendancePercentage.toFixed(1)}%`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_summary_${courseId}_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (!stats) return;

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(t('attendance.studentSummary') || 'Student Attendance Summary', 14, 22);

        doc.setFontSize(11);
        let dateText = `${t('common.date')}: ${format(new Date(), 'PPP')}`;
        if (filterRange?.from && filterRange?.to) {
            dateText += ` (${format(filterRange.from, 'PP')} - ${format(filterRange.to, 'PP')})`;
        } else if (period === 'all') {
            dateText += ` (${t('attendance.periodAll') || 'All Time'})`;
        }
        doc.text(dateText, 14, 30);

        const headers = [[
            t('auth.name'),
            t('attendance.status.present'),
            t('attendance.status.late'),
            t('attendance.status.excused'),
            t('attendance.status.absent'),
            '%'
        ]];

        const data = stats.map((student: any) => [
            student.name,
            student.present,
            student.late,
            student.excused,
            student.absent,
            `${student.attendancePercentage.toFixed(1)}%`
        ]);

        autoTable(doc, {
            head: headers,
            body: data,
            startY: 40,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [63, 81, 181] },
        });

        doc.save(`attendance_summary_${courseId}_${period}.pdf`);
    };

    if (isLoading) {
        return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
    }

    if (!stats || stats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="flex items-center gap-2">
                    <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('attendance.periodAll') || 'All Time'}</SelectItem>
                            <SelectItem value="1month">{t('attendance.period1Month') || 'Last 1 Month'}</SelectItem>
                            <SelectItem value="3months">{t('attendance.period3Months') || 'Last 3 Months'}</SelectItem>
                            <SelectItem value="semester">{t('attendance.periodSemester') || 'This Semester (6mo)'}</SelectItem>
                            <SelectItem value="custom">{t('attendance.periodCustom') || 'Custom Range'}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-muted-foreground">{t('courses.noStudentsEnrolled')}</div>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                        {t('attendance.studentSummary') || 'Student Summary'}
                    </CardTitle>
                    <CardDescription>
                        {period === 'all'
                            ? (t('attendance.summaryDescription') || 'Overview of attendance for all students.')
                            : filterRange?.from && filterRange?.to
                                ? `${format(filterRange.from, 'PP')} - ${format(filterRange.to, 'PP')}`
                                : ''}
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-end gap-2">
                    {/* Period Filter */}
                    <div className="flex items-center gap-2">
                        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Select Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('attendance.periodAll') || 'All Time'}</SelectItem>
                                <SelectItem value="1month">{t('attendance.period1Month') || 'Last 1 Month'}</SelectItem>
                                <SelectItem value="3months">{t('attendance.period3Months') || 'Last 3 Months'}</SelectItem>
                                <SelectItem value="semester">{t('attendance.periodSemester') || 'This Semester (6mo)'}</SelectItem>
                                <SelectItem value="custom">{t('attendance.periodCustom') || 'Custom Range'}</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Custom Date Picker */}
                        {period === 'custom' && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] justify-start text-left font-normal",
                                            !dateRange && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                                    {format(dateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(dateRange.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportCSV}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportPDF}>
                            <FileText className="w-4 h-4 mr-2" />
                            PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('auth.name')}</TableHead>
                            <TableHead className="text-center text-green-600">{t('attendance.status.present')}</TableHead>
                            <TableHead className="text-center text-yellow-600">{t('attendance.status.late')}</TableHead>
                            <TableHead className="text-center text-blue-600">{t('attendance.status.excused')}</TableHead>
                            <TableHead className="text-center text-red-600">{t('attendance.status.absent')}</TableHead>
                            <TableHead className="text-right font-bold">%</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.map((student: any) => (
                            <TableRow key={student.id}>
                                <TableCell>
                                    <div className="font-medium">{student.name}</div>
                                    <div className="text-xs text-muted-foreground">{student.email}</div>
                                </TableCell>
                                <TableCell className="text-center font-mono">{student.present}</TableCell>
                                <TableCell className="text-center font-mono">{student.late}</TableCell>
                                <TableCell className="text-center font-mono">{student.excused}</TableCell>
                                <TableCell className="text-center font-mono">{student.absent}</TableCell>
                                <TableCell className="text-right font-bold">
                                    <span className={
                                        student.attendancePercentage < 75 ? 'text-red-500' :
                                            student.attendancePercentage < 85 ? 'text-yellow-500' : 'text-green-500'
                                    }>
                                        {student.attendancePercentage.toFixed(1)}%
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// Helper to calculate percentages
// (Already part of hook return)
