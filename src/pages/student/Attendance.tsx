
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentLiveSessionWidget } from "@/components/dashboard/StudentLiveSessionWidget";
import { AttendanceComparisonTable } from "@/components/attendance/AttendanceComparisonTable";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const StudentAttendance = () => {
    const { t } = useTranslation();
    const { courses, isLoading } = useCourses();
    const { user } = useAuth();
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');

    // Students see all courses they are enrolled in (which useCourses returns for them)
    // Filter out draft courses just in case, though backend usually handles this for students
    const activeCourses = courses?.filter(course => course.status !== 'draft') || [];

    // Auto-select first course when courses are loaded
    useEffect(() => {
        if (activeCourses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(activeCourses[0].id);
        }
    }, [courses]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('attendance.title') || 'Attendance'}</h1>
                    <p className="text-muted-foreground">{t('attendance.checkInSubtitle') || 'Check in to classes and view your attendance history'}</p>
                </div>
            </div>

            {/* Live Session Widget for Check-in */}
            {selectedCourseId && (
                <StudentLiveSessionWidget courseId={selectedCourseId} />
            )}

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>{t('attendance.history') || 'Attendance History'}</CardTitle>
                            <CardDescription>{t('attendance.historyDesc') || 'View your attendance records for this course'}</CardDescription>
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
                                <AttendanceComparisonTable
                                    courseId={selectedCourseId}
                                    readOnly={true}
                                    targetStudentId={user?.id}
                                />
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    {t('attendance.selectCoursePrompt') || 'Please select a course to view attendance.'}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 flex flex-col items-center justify-center text-muted-foreground space-y-3">
                            <AlertCircle className="w-10 h-10 opacity-20" />
                            <p>{t('common.noCourses') || 'No courses found'}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentAttendance;
