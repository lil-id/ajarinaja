import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/contexts/AuthContext';
import { useCourseAttendanceStats } from '@/hooks/useAttendanceSessions';
import { useAttendanceExport } from '@/hooks/useAttendanceExport';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, QrCode, Filter, Calendar as CalendarIcon, FileDown, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { LiveSessionWidget } from "@/components/dashboard/LiveSessionWidget";
import { AttendanceComparisonTable } from "@/components/attendance/AttendanceComparisonTable";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Period = 'all' | '1month' | '3months' | 'semester' | 'custom';

const TeacherAttendance = () => {
    const { t } = useTranslation();
    const { courses, isLoading } = useCourses();
    const navigate = useNavigate();
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');

    // Filter State
    const [period, setPeriod] = useState<Period>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const activeCourses = courses?.filter(course => course.status !== 'draft') || [];
    const { exportToCSV, exportToPDF } = useAttendanceExport();

    // Auto-select first course when courses are loaded
    useEffect(() => {
        if (activeCourses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(activeCourses[0].id);
        }
    }, [courses]);

    const selectedCourse = useMemo(() => {
        return activeCourses.find(c => c.id === selectedCourseId);
    }, [activeCourses, selectedCourseId]);



    // Calculate filter range based on period
    const filterRange = useMemo(() => {
        if (period === 'custom') {
            return { from: dateRange?.from, to: dateRange?.to };
        }

        const now = new Date();
        let from: Date | undefined;
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

    // Fetch stats for export capability
    const { data: stats } = useCourseAttendanceStats(selectedCourseId, filterRange);


    const handleExport = (type: 'csv' | 'pdf') => {
        if (!stats || !selectedCourse) return;
        if (type === 'csv') {
            exportToCSV(stats, selectedCourseId, period, selectedCourse.title);
        } else {
            let dateText = undefined;
            if (filterRange?.from && filterRange?.to) {
                dateText = `${format(filterRange.from, 'PP')} - ${format(filterRange.to, 'PP')}`;
            }
            exportToPDF(stats, selectedCourseId, period, dateText, selectedCourse.title);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('attendance.title') || 'Attendance'}</h1>
                    <p className="text-muted-foreground">{t('attendance.manageSubtitle') || 'Manage attendance sessions and history'}</p>
                </div>
            </div>

            <LiveSessionWidget />

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        {selectedCourseId && (
                            <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-4">
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    <div className="w-full sm:w-[250px]">
                                        <Select
                                            value={selectedCourseId}
                                            onValueChange={setSelectedCourseId}
                                            disabled={isLoading || activeCourses.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('common.selectCourse') || "Select Course"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {activeCourses.map(course => (
                                                    <SelectItem key={course.id} value={course.id}>
                                                        {course.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
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

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" disabled={!stats || stats.length === 0}>
                                            <FileDown className="w-4 h-4 mr-2" />
                                            {t('common.export') || 'Export'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>{t('common.exportOptions') || 'Export Options'}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleExport('csv')}>
                                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                                            Export CSV
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Export PDF
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            {t('common.loading') || 'Loading...'}
                        </div>
                    ) : courses?.length > 0 ? (
                        <div className="space-y-6">
                            {selectedCourseId ? (
                                <AttendanceComparisonTable
                                    courseId={selectedCourseId}
                                    courseName={selectedCourse?.title}
                                />
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    Please select a course to view attendance.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            {t('common.noCourses') || 'No courses found'}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TeacherAttendance;
