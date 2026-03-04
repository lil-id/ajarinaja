/**
 * @fileoverview Operator Users Page
 * @description View all students and teachers in the school with search functionality.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSchoolStudents } from '@/hooks/useSchoolStudents';
import { useRoleUsers } from '@/hooks/useRoleUsers';
import { Users, Search, GraduationCap } from 'lucide-react';

const OperatorUsers = () => {
    const { t } = useTranslation();
    const { students, isLoading: isLoadingStudents } = useSchoolStudents();
    const { data: teachers = [], isLoading: isLoadingTeachers } = useRoleUsers('teacher');
    const [search, setSearch] = useState('');

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-foreground">{t('operator.users.title')}</h1>
                <p className="text-muted-foreground mt-1">{t('operator.users.description')}</p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder={t('operator.users.searchPlaceholder')}
                    className="pl-9 max-w-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <Tabs defaultValue="students" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="students" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {t('operator.users.tabStudents')} ({filteredStudents.length})
                    </TabsTrigger>
                    <TabsTrigger value="teachers" className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        {t('operator.users.tabTeachers')} ({filteredTeachers.length})
                    </TabsTrigger>
                </TabsList>

                {/* Students Tab */}
                <TabsContent value="students">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                {t('operator.users.studentsListTitle')}
                            </CardTitle>
                            <CardDescription>{t('operator.users.studentsListDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingStudents ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-muted-foreground">
                                    <Users className="w-12 h-12 mb-3" />
                                    <p>{t('operator.users.noStudentsFound')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredStudents.map(student => (
                                        <div
                                            key={student.user_id}
                                            className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={student.avatar_url || undefined} />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{student.name}</p>
                                                    <p className="text-xs text-muted-foreground">{student.email}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline">
                                                {student.enrollment_count} {t('operator.users.courses')}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Teachers Tab */}
                <TabsContent value="teachers">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="w-5 h-5" />
                                {t('operator.users.teachersListTitle')}
                            </CardTitle>
                            <CardDescription>{t('operator.users.teachersListDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingTeachers ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                                </div>
                            ) : filteredTeachers.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-muted-foreground">
                                    <GraduationCap className="w-12 h-12 mb-3" />
                                    <p>{t('operator.users.noTeachersFound')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredTeachers.map(teacher => (
                                        <div
                                            key={teacher.id}
                                            className="flex items-center p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={teacher.avatar_url || undefined} />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                        {teacher.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{teacher.name}</p>
                                                    <p className="text-xs text-muted-foreground">{teacher.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default OperatorUsers;
