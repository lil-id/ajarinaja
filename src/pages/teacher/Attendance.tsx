
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/contexts/AuthContext';
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
import { ArrowRight, Users, QrCode } from "lucide-react";
import { LiveSessionWidget } from "@/components/dashboard/LiveSessionWidget";
import { AttendanceComparisonTable } from "@/components/attendance/AttendanceComparisonTable";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const TeacherAttendance = () => {
    const { t } = useTranslation();
    const { courses, isLoading } = useCourses();
    const navigate = useNavigate();
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');

    const activeCourses = courses?.filter(course => course.status !== 'draft') || [];

    // Auto-select first course when courses are loaded
    useEffect(() => {
        if (activeCourses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(activeCourses[0].id);
        }
    }, [courses]); // keep dependency on courses to re-calc activeCourses

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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>{t('nav.courses')}</CardTitle>
                            <CardDescription>{t('attendance.monitorStatus') || 'Monitor attendance status across all your students'}</CardDescription>
                        </div>

                        {/* Course Selector */}
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
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            {t('common.loading') || 'Loading...'}
                        </div>
                    ) : courses?.length > 0 ? (
                        <div className="space-y-6">
                            {selectedCourseId ? (
                                <AttendanceComparisonTable courseId={selectedCourseId} />
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
