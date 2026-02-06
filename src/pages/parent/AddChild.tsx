/**
 * @fileoverview Add Child Page
 * @description Page for parents to search and verify their children using pairing code
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useSearchStudents } from '@/hooks/useSearchStudents';
import { useVerifyChild } from '@/hooks/useVerifyChild';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AddChild() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [pairingCode, setPairingCode] = useState('');

    const { students, isLoading: isSearching } = useSearchStudents(searchQuery);
    const { verifyChild, isVerifying, isSuccess } = useVerifyChild();

    const handleVerify = () => {
        if (!selectedStudent || !pairingCode) return;

        verifyChild({
            student_user_id: selectedStudent.user_id,
            pairing_code: pairingCode,
        });
    };

    // Redirect to overview after successful verification
    if (isSuccess) {
        setTimeout(() => navigate('/parent'), 1500);
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/parent')}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">{t('parent.addChild')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('parent.addChildDescription')}
                    </p>
                </div>
            </div>

            {/* Success State */}
            {isSuccess ? (
                <Card className="border-green-500">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold text-green-700 mb-2">
                            {t('parent.childAddedSuccess')}
                        </h3>
                        <p className="text-muted-foreground">
                            {t('parent.redirecting')}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Step 1: Search Child */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('parent.step1SearchChild')}</CardTitle>
                            <CardDescription>
                                {t('parent.searchByNameOrEmail')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('parent.searchPlaceholder')}
                                    className="pl-10"
                                />
                            </div>

                            {/* Search Results */}
                            {isSearching && searchQuery.length >= 2 && (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}

                            {!isSearching && students.length > 0 && (
                                <div className="space-y-2">
                                    <Label>{t('parent.searchResults')}</Label>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {students.map((student) => (
                                            <Card
                                                key={student.user_id}
                                                className={`cursor-pointer transition-all ${selectedStudent?.user_id === student.user_id
                                                    ? 'border-primary ring-2 ring-primary/20'
                                                    : 'hover:border-primary/50'
                                                    }`}
                                                onClick={() => setSelectedStudent(student)}
                                            >
                                                <CardContent className="flex items-center gap-4 p-4">
                                                    <Avatar>
                                                        <AvatarImage src={student.avatar_url} alt={student.name} />
                                                        <AvatarFallback>
                                                            {student.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{student.name}</p>
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {student.email}
                                                        </p>
                                                    </div>
                                                    {selectedStudent?.user_id === student.user_id && (
                                                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isSearching && searchQuery.length >= 2 && students.length === 0 && (
                                <Alert>
                                    <AlertDescription>
                                        {t('parent.noStudentsFound')}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Step 2: Enter Pairing Code */}
                    {selectedStudent && (
                        <Card className="border-primary/50">
                            <CardHeader>
                                <CardTitle>{t('parent.step2EnterCode')}</CardTitle>
                                <CardDescription>
                                    {t('parent.askChildForCode')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <AlertDescription>
                                        {t('parent.selectedStudent')}: <strong>{selectedStudent.name}</strong> ({selectedStudent.email})
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-2">
                                    <Label htmlFor="pairing-code">{t('parent.pairingCode')}</Label>
                                    <Input
                                        id="pairing-code"
                                        value={pairingCode}
                                        onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                                        placeholder="CONTOH: ABC-123-DEF"
                                        className="font-mono text-lg tracking-wider text-center uppercase"
                                        maxLength={11}
                                    />
                                    <p className="text-sm text-muted-foreground text-center">
                                        {t('parent.codeFormat')}
                                    </p>
                                </div>

                                <Button
                                    onClick={handleVerify}
                                    disabled={!pairingCode || pairingCode.length !== 11 || isVerifying}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isVerifying ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {t('parent.verifying')}
                                        </>
                                    ) : (
                                        t('parent.verifyAndAdd')
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
