import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    UserPlus,
    Search,
    MoreHorizontal,
    GraduationCap,
    BookOpen,
    Eye,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DemoOperatorClasses() {
    const { t } = useTranslation();

    const classes = [
        { id: '1', name: '10-A', grade: '10', studentCount: 32, advisor: 'Budi Santoso', curriculum: 'Merdeka' },
        { id: '2', name: '10-B', grade: '10', studentCount: 30, advisor: 'Siti Aminah', curriculum: 'Merdeka' },
        { id: '3', name: '11-IPA-1', grade: '11', studentCount: 28, advisor: 'Dewi Lestari', curriculum: '2013 Rev' },
        { id: '4', name: '11-IPS-1', grade: '11', studentCount: 35, advisor: 'Agus Wijaya', curriculum: '2013 Rev' },
        { id: '5', name: '12-IPA-1', grade: '12', studentCount: 25, advisor: 'Eko Prasetyo', curriculum: '2013 Rev' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('nav.classes')}</h1>
                    <p className="text-muted-foreground mt-1">Manage school classes, students, and advisors (Demo).</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 h-fit">
                        <Eye className="w-3 h-3 mr-1" /> {t('demo.viewOnly')}
                    </Badge>
                    <Button disabled>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add New Class
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search classes..."
                        className="pl-9"
                        disabled
                    />
                </div>
                <Button variant="outline" size="icon" disabled>
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                    <Card key={cls.id} className="hover:shadow-md transition-shadow group cursor-default">
                        <CardHeader className="pb-3 text-center border-b bg-muted/20">
                            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle className="text-xl">{cls.name}</CardTitle>
                            <CardDescription>Grade {cls.grade} • {cls.curriculum}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Students</p>
                                    <p className="font-semibold flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                        {cls.studentCount}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Courses</p>
                                    <p className="font-semibold flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                                        12
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Class Advisor</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                        <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{cls.advisor}</p>
                                        <p className="text-[10px] text-muted-foreground">Lead Teacher</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" disabled>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full text-xs h-8" disabled>
                                View Class Details
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-dashed">
                <CardContent className="p-8 text-center space-y-3">
                    <div className="inline-flex p-3 rounded-full bg-muted">
                        <UserPlus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">Create a new class for the current term</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Setting up classes is the first step in organizing your institution for the 2024/2025 academic period.
                    </p>
                    <Button variant="secondary" disabled>Setup Class Guide</Button>
                </CardContent>
            </Card>
        </div>
    );
}
