import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Settings, Save } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    useAttendanceSettings,
    useUpdateAttendanceSettings,
    getDefaultAttendanceSettings,
} from '@/hooks/useAttendanceSettings';
import type { AttendanceSettings } from '@/types/attendance';

interface AttendanceSettingsDialogProps {
    courseId: string;
    trigger?: React.ReactNode;
}

export function AttendanceSettingsDialog({
    courseId,
    trigger,
}: AttendanceSettingsDialogProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const { data: settings, isLoading } = useAttendanceSettings(courseId);
    const updateSettings = useUpdateAttendanceSettings();

    const defaultValues = settings || getDefaultAttendanceSettings(courseId);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AttendanceSettings>({
        defaultValues,
        values: settings || defaultValues,
    });

    const calculationMethod = watch('calculation_method');

    const onSubmit = async (data: AttendanceSettings) => {
        try {
            await updateSettings.mutateAsync(data);
            toast({
                title: t('common.success'),
                description: t('attendance.settingsSaved'),
            });
            setOpen(false);
        } catch (error) {
            toast({
                title: t('common.error'),
                description: t('attendance.settingsSaveFailed'),
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="default">
                        <Settings className="w-4 h-4 mr-2" />
                        {t('attendance.settings')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('attendance.settingsTitle')}</DialogTitle>
                    <DialogDescription>
                        {t('attendance.settingsDescription')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Timing Settings */}
                    <div className="space-y-4">
                        <h3 className="font-medium">{t('attendance.timingSettings')}</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="grace_period">
                                    {t('attendance.gracePeriod')}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="grace_period"
                                        type="number"
                                        min="0"
                                        {...register('grace_period_minutes', {
                                            required: true,
                                            min: 0,
                                        })}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {t('common.minutes')}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('attendance.gracePeriodHelp')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="late_window">
                                    {t('attendance.lateWindow')}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="late_window"
                                        type="number"
                                        min="0"
                                        {...register('late_window_minutes', {
                                            required: true,
                                            min: 0,
                                        })}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {t('common.minutes')}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('attendance.lateWindowHelp')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Grading Settings */}
                    <div className="space-y-4">
                        <h3 className="font-medium">{t('attendance.gradingSettings')}</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="weight">
                                    {t('attendance.weightInGrade')}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="weight"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        {...register('weight_in_grade', {
                                            required: true,
                                            min: 0,
                                            max: 100,
                                        })}
                                    />
                                    <span className="text-sm text-muted-foreground">%</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minimum">
                                    {t('attendance.minimumPercentage')}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="minimum"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        {...register('minimum_percentage', {
                                            required: true,
                                            min: 0,
                                            max: 100,
                                        })}
                                    />
                                    <span className="text-sm text-muted-foreground">%</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('attendance.minimumPercentageHelp')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="method">
                                {t('attendance.calculationMethod')}
                            </Label>
                            <Select
                                value={calculationMethod}
                                onValueChange={(value) =>
                                    setValue('calculation_method', value as 'simple' | 'weighted')
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="simple">
                                        {t('attendance.methodSimple')}
                                    </SelectItem>
                                    <SelectItem value="weighted">
                                        {t('attendance.methodWeighted')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {calculationMethod === 'simple'
                                    ? t('attendance.methodSimpleHelp')
                                    : t('attendance.methodWeightedHelp')}
                            </p>
                        </div>
                    </div>

                    {/* Scoring (only for weighted) */}
                    {calculationMethod === 'weighted' && (
                        <div className="space-y-4">
                            <h3 className="font-medium">{t('attendance.scoringWeights')}</h3>

                            <div className="grid grid-cols-2 gap-4">
                                {(['present', 'late', 'excused', 'absent'] as const).map((status) => (
                                    <div key={status} className="space-y-2">
                                        <Label htmlFor={`scoring_${status}`}>
                                            {t(`attendance.status.${status}`)}
                                        </Label>
                                        <Input
                                            id={`scoring_${status}`}
                                            type="number"
                                            min="0"
                                            max="100"
                                            {...register(`scoring.${status}`, {
                                                required: true,
                                                valueAsNumber: true,
                                            })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={updateSettings.isPending}>
                            <Save className="w-4 h-4 mr-2" />
                            {updateSettings.isPending ? t('common.saving') : t('common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
