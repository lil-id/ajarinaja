import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAIMaterials } from '@/hooks/useAIMaterials';
import { useTeacherCourses } from '@/hooks/useCourses';

interface MaterialUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['.pdf', '.txt'];

export function MaterialUploadDialog({ open, onOpenChange }: MaterialUploadDialogProps) {
    const { t } = useTranslation();
    const { courses = [] } = useTeacherCourses();
    const { uploadMaterial } = useAIMaterials();

    const [title, setTitle] = useState('');
    const [courseId, setCourseId] = useState<string>('none');
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const validateFile = (file: File): string | null => {
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!ACCEPTED_FILE_TYPES.includes(fileExt)) {
            return `File type not supported. Please upload: ${ACCEPTED_FILE_TYPES.join(', ')}`;
        }

        if (file.size > MAX_FILE_SIZE) {
            return `File size exceeds 10MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
        }

        return null;
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            const error = validateFile(droppedFile);
            if (error) {
                alert(error);
                return;
            }
            setFile(droppedFile);
            if (!title) {
                setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
            }
        }
    }, [title]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const error = validateFile(selectedFile);
            if (error) {
                alert(error);
                return;
            }
            setFile(selectedFile);
            if (!title) {
                setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
            }
        }
    };

    const handleSubmit = () => {
        if (!file || !title) return;

        uploadMaterial.mutate(
            {
                file,
                title,
                courseId: courseId && courseId !== 'none' ? courseId : undefined,
            },
            {
                onSuccess: () => {
                    setTitle('');
                    setCourseId('none');
                    setFile(null);
                    onOpenChange(false);
                },
            }
        );
    };

    const handleClose = () => {
        setTitle('');
        setCourseId('none');
        setFile(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{t('ai.uploadMaterial')}</DialogTitle>
                    <DialogDescription>
                        {t('ai.uploadMaterialDescription')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* File upload area */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="space-y-2">
                                <FileText className="w-12 h-12 mx-auto text-primary" />
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-sm font-medium truncate max-w-[420px]" title={file.name}>{file.name}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setFile(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">{t('ai.dragAndDrop')}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {t('ai.orClickToSelect')}
                                    </p>
                                </div>
                                <Input
                                    type="file"
                                    accept={ACCEPTED_FILE_TYPES.join(',')}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <Label
                                    htmlFor="file-upload"
                                    className="inline-block cursor-pointer"
                                >
                                    <Button type="button" variant="outline" size="sm" asChild>
                                        <span>{t('ai.selectFile')}</span>
                                    </Button>
                                </Label>
                                <p className="text-xs text-muted-foreground mt-2">
                                    PDF, TXT (Max 10MB)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Title input */}
                    <div className="space-y-2">
                        <Label htmlFor="title">{t('ai.materialTitle')}</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('ai.materialTitlePlaceholder')}
                        />
                    </div>

                    {/* Course selection (optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="course">{t('ai.linkedCourse')} ({t('common.optional')})</Label>
                        <Select value={courseId} onValueChange={setCourseId}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('ai.selectCourse')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('ai.noCourse')}</SelectItem>
                                {courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!file || !title || uploadMaterial.isPending}
                    >
                        {uploadMaterial.isPending && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {t('ai.uploadAndProcess')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
