import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Upload, FileText, Trash2, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAIMaterials } from '@/hooks/useAIMaterials';
import { useQuestionGeneration, GeneratedQuestion } from '@/hooks/useQuestionGeneration';
import { MaterialUploadDialog } from './MaterialUploadDialog';
import { formatDistanceToNow } from 'date-fns';

export function AIQuestionGenerator() {
    const { t } = useTranslation();
    const { materials, isLoading, deleteMaterial, stats } = useAIMaterials();
    const { generateQuestions, saveToBank } = useQuestionGeneration();

    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<string>('');
    const [numQuestions, setNumQuestions] = useState(10);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [topic, setTopic] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
    const [editingQuestions, setEditingQuestions] = useState<GeneratedQuestion[]>([]);
    const configSectionRef = useRef<HTMLDivElement>(null);

    const handleGenerate = () => {
        if (!selectedMaterial) return;

        generateQuestions.mutate(
            {
                materialId: selectedMaterial,
                numQuestions,
                difficulty,
                topic: topic || undefined,
            },
            {
                onSuccess: (data) => {
                    setGeneratedQuestions(data.questions);
                    setEditingQuestions([...data.questions]);
                },
            }
        );
    };

    const handleSaveToBank = () => {
        if (editingQuestions.length === 0) return;

        saveToBank.mutate(
            { questions: editingQuestions },
            {
                onSuccess: () => {
                    setGeneratedQuestions([]);
                    setEditingQuestions([]);
                    setSelectedMaterial('');
                    setTopic('');
                },
            }
        );
    };

    const handleDeleteQuestion = (index: number) => {
        setEditingQuestions(editingQuestions.filter((_, i) => i !== index));
    };

    const handleEditQuestion = (index: number, updates: Partial<GeneratedQuestion>) => {
        setEditingQuestions(
            editingQuestions.map((q, i) => (i === index ? { ...q, ...updates } : q))
        );
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            {/* Progress Stepper */}
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        {t('ai.workflowTitle')}
                    </CardTitle>
                    <CardDescription>{t('ai.workflowDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Step 1: Upload Material */}
                        <div className="flex items-start gap-4">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${materials.length > 0
                                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                                }`}>
                                {materials.length > 0 ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    <Upload className="w-5 h-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-base">{t('ai.step1Title')}</h3>
                                    <Badge variant={materials.length > 0 ? "default" : "secondary"}>
                                        {materials.length} {t('ai.uploaded')}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t('ai.step1Description')}
                                </p>
                            </div>
                        </div>

                        {/* Connector Line */}
                        <div className={`ml-5 w-0.5 h-6 ${materials.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />

                        {/* Step 2: Process Material */}
                        <div className="flex items-start gap-4">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${stats?.ready_materials && stats.ready_materials > 0
                                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                : materials.some(m => m.status === 'processing')
                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500 animate-pulse'
                                    : materials.length > 0
                                        ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                                        : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                                }`}>
                                {stats?.ready_materials && stats.ready_materials > 0 ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : materials.some(m => m.status === 'processing') ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <FileText className="w-5 h-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-base">{t('ai.step2Title')}</h3>
                                    <Badge variant={stats?.ready_materials && stats.ready_materials > 0 ? "default" : "secondary"}>
                                        {stats?.ready_materials || 0} {t('ai.ready')} • {stats?.total_chunks || 0} {t('ai.chunks')}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t('ai.step2Description')}
                                </p>
                            </div>
                        </div>

                        {/* Connector Line */}
                        <div className={`ml-5 w-0.5 h-6 ${stats?.ready_materials && stats.ready_materials > 0 ? 'bg-green-500' : 'bg-gray-300'
                            }`} />

                        {/* Step 3: Generate Questions */}
                        <div className="flex items-start gap-4">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${generatedQuestions.length > 0
                                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                : generateQuestions.isPending
                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500 animate-pulse'
                                    : stats?.ready_materials && stats.ready_materials > 0
                                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                                        : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                                }`}>
                                {generatedQuestions.length > 0 ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : generateQuestions.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Sparkles className="w-5 h-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-base">{t('ai.step3Title')}</h3>
                                    <Badge variant={generatedQuestions.length > 0 ? "default" : "secondary"}>
                                        {editingQuestions.length} {t('ai.generated')}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t('ai.step3Description')}
                                </p>
                            </div>
                        </div>

                        {/* Connector Line */}
                        <div className={`ml-5 w-0.5 h-6 ${generatedQuestions.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />

                        {/* Step 4: Save to Bank */}
                        <div className="flex items-start gap-4">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${stats?.total_questions_generated && stats.total_questions_generated > 0
                                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                : saveToBank.isPending
                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500 animate-pulse'
                                    : generatedQuestions.length > 0
                                        ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
                                        : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                                }`}>
                                {stats?.total_questions_generated && stats.total_questions_generated > 0 ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : saveToBank.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <FileText className="w-5 h-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-base">{t('ai.step4Title')}</h3>
                                    <Badge variant={stats?.total_questions_generated && stats.total_questions_generated > 0 ? "default" : "secondary"}>
                                        {stats?.total_questions_generated || 0} {t('ai.saved')}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t('ai.step4Description')}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Upload Material */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t('ai.myMaterials')}</CardTitle>
                            <CardDescription>{t('ai.uploadMaterialDescription')}</CardDescription>
                        </div>
                        <Button onClick={() => setUploadDialogOpen(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            {t('ai.uploadMaterial')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : materials.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">{t('ai.noMaterialsYet')}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t('ai.noMaterialsDescription')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {materials.map((material) => (
                                <Card key={material.id} className="relative">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-base">{material.title}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    {formatDistanceToNow(new Date(material.created_at), { addSuffix: true })}
                                                </CardDescription>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteMaterial.mutate(material.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2">
                                            {material.status === 'ready' && (
                                                <Badge variant="default" className="gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {t('ai.ready')}
                                                </Badge>
                                            )}
                                            {material.status === 'processing' && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Clock className="w-3 h-3 animate-pulse" />
                                                    {t('ai.processing')}
                                                </Badge>
                                            )}
                                            {material.status === 'error' && (
                                                <Badge variant="destructive" className="gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {t('ai.error')}
                                                </Badge>
                                            )}
                                            {material.total_chunks > 0 && (
                                                <span className="text-sm text-muted-foreground">
                                                    {material.total_chunks} {t('ai.chunks')}
                                                </span>
                                            )}
                                        </div>
                                        {material.status === 'ready' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full mt-3"
                                                onClick={() => {
                                                    setSelectedMaterial(material.id);
                                                    setTimeout(() => {
                                                        configSectionRef.current?.scrollIntoView({
                                                            behavior: 'smooth',
                                                            block: 'start'
                                                        });
                                                    }, 100);
                                                }}
                                            >
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                {t('ai.generateQuestions')}
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Generation Configuration */}
            {selectedMaterial && generatedQuestions.length === 0 && (
                <Card ref={configSectionRef}>
                    <CardHeader>
                        <CardTitle>{t('ai.generateQuestions')}</CardTitle>
                        <CardDescription>
                            {t('ai.configureParameters')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>{t('ai.numberOfQuestions')}: {numQuestions}</Label>
                            <Slider
                                value={[numQuestions]}
                                onValueChange={([value]) => setNumQuestions(value)}
                                min={1}
                                max={50}
                                step={1}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('ai.difficulty')}</Label>
                            <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">{t('ai.easy')}</SelectItem>
                                    <SelectItem value="medium">{t('ai.medium')}</SelectItem>
                                    <SelectItem value="hard">{t('ai.hard')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('ai.topicFocus')}</Label>
                            <Input
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder={t('ai.topicFocusPlaceholder')}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleGenerate}
                                disabled={generateQuestions.isPending}
                                className="flex-1"
                            >
                                {generateQuestions.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t('ai.generating')}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        {t('ai.generateQuestions')}
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedMaterial('')}>
                                {t('common.cancel')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Generated Questions Preview */}
            {editingQuestions.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{t('ai.generatedQuestions')}</CardTitle>
                                <CardDescription>
                                    {editingQuestions.length} {t('ai.questionsGenerated')} - {t('ai.reviewBeforeSaving')}
                                </CardDescription>
                            </div>
                            <Button onClick={handleSaveToBank} disabled={saveToBank.isPending}>
                                {saveToBank.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : null}
                                {t('ai.saveToBank')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {editingQuestions.map((question, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="secondary">{t('ai.questionLabel')} {index + 1}</Badge>
                                                <Badge>{question.difficulty || 'medium'}</Badge>
                                            </div>
                                            <Textarea
                                                value={question.question_text}
                                                onChange={(e) =>
                                                    handleEditQuestion(index, { question_text: e.target.value })
                                                }
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteQuestion(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                {question.question_type === 'multiple_choice' && question.options && (
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">{t('ai.optionsLabel')}</Label>
                                            {question.options.map((option, optionIndex) => (
                                                <div key={optionIndex} className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <span className="text-sm font-medium text-muted-foreground min-w-[24px]">
                                                            {String.fromCharCode(65 + optionIndex)}.
                                                        </span>
                                                        <Input
                                                            value={option}
                                                            onChange={(e) => {
                                                                const newOptions = [...question.options!];
                                                                newOptions[optionIndex] = e.target.value;
                                                                handleEditQuestion(index, { options: newOptions });
                                                            }}
                                                            className={
                                                                question.correct_answer === optionIndex
                                                                    ? 'border-green-500 bg-green-50'
                                                                    : ''
                                                            }
                                                        />
                                                    </div>
                                                    {question.correct_answer === optionIndex && (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">{t('ai.correctAnswerLabel')}</Label>
                                            <Select
                                                value={question.correct_answer?.toString()}
                                                onValueChange={(value) =>
                                                    handleEditQuestion(index, { correct_answer: parseInt(value) })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {question.options.map((option, optionIndex) => (
                                                        <SelectItem key={optionIndex} value={optionIndex.toString()}>
                                                            {String.fromCharCode(65 + optionIndex)}. {option.substring(0, 50)}
                                                            {option.length > 50 && '...'}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">{t('ai.explanationLabel')}</Label>
                                            <Textarea
                                                value={question.explanation || ''}
                                                onChange={(e) =>
                                                    handleEditQuestion(index, { explanation: e.target.value })
                                                }
                                                placeholder={t('ai.explanationPlaceholder')}
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                    </CardContent>
                                )}

                            </Card>
                        ))}
                    </CardContent>
                </Card>
            )}

            <MaterialUploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
        </div>
    );
}
