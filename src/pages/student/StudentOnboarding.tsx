import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useStudentEnrolledClass } from '@/hooks/useStudentEnrolledClass';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, GraduationCap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const StudentOnboarding = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { profile, signOut } = useAuth();
    const { availableClasses, isEnrolled, isLoading, enrollInClass } = useStudentEnrolledClass();

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [confirmed, setConfirmed] = useState(false);

    // If already enrolled, redirect to dashboard immediately
    useEffect(() => {
        if (!isLoading && isEnrolled) {
            navigate('/student');
        }
    }, [isLoading, isEnrolled, navigate]);

    const handleSave = () => {
        if (!selectedClassId || !confirmed) return;
        enrollInClass.mutate(selectedClassId);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    if (isLoading || isEnrolled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground animate-pulse">Memuat data kelas...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
            <Card className="w-full max-w-md shadow-lg border-primary/20 bg-background">
                <CardHeader className="text-center space-y-4 pb-6">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">{t('onboarding.title')}</CardTitle>
                        <CardDescription className="mt-2 text-base">
                            Halo, <span className="font-semibold text-foreground">{profile?.name}</span>!<br />
                            {t('onboarding.description')}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Pilih Kelas Anda
                        </label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-full h-11">
                                <SelectValue placeholder={t('onboarding.selectClassPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableClasses.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        Tidak ada kelas yang tersedia.
                                    </div>
                                ) : (
                                    availableClasses.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.name} <span className="text-muted-foreground text-xs ml-2">(Tingkat {cls.grade_level})</span>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedClassId && (
                        <Alert className="bg-primary/5 border-primary/20 py-3">
                            <AlertCircle className="h-4 w-4 text-primary" />
                            <AlertDescription className="text-sm ml-2">
                                Anda memilih bergabung dengan kelas. Pastikan ini adalah kelas Anda yang sebenarnya.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex items-start space-x-3 pt-2">
                        <Checkbox
                            id="confirm"
                            checked={confirmed}
                            onCheckedChange={(c) => setConfirmed(c as boolean)}
                            className="mt-0.5"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="confirm"
                                className="text-sm font-medium leading-snug cursor-pointer select-none"
                            >
                                {t('onboarding.confirmText')}
                            </label>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button
                        className="w-full h-11 text-base font-semibold"
                        disabled={!selectedClassId || !confirmed || enrollInClass.isPending}
                        onClick={handleSave}
                    >
                        {enrollInClass.isPending ? 'Menyimpan...' : t('onboarding.submitBtn')}
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground text-sm"
                        onClick={handleLogout}
                    >
                        Batal & Keluar
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default StudentOnboarding;
