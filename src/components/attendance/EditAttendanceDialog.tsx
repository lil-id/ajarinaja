import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { AttendanceStatus } from '@/hooks/useAttendanceMatrix';
import { Loader2 } from 'lucide-react';

interface EditAttendanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
    date: string;
    currentStatus: AttendanceStatus | undefined;
    sessionId?: string;
    onSaved: () => void;
}

export const EditAttendanceDialog = ({
    open,
    onOpenChange,
    studentId,
    studentName,
    date,
    currentStatus,
    sessionId,
    onSaved
}: EditAttendanceDialogProps) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [status, setStatus] = useState<string>('present');
    const [notes, setNotes] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            if (currentStatus) {
                setStatus(currentStatus.status);
                setNotes(currentStatus.notes || '');
            } else {
                setStatus('present'); // Default for new entry
                setNotes('');
            }
        }
    }, [open, currentStatus]);

    const handleSave = async () => {
        if (!sessionId) {
            toast({
                title: "Error",
                description: "Session ID is missing. Cannot update attendance.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            // We need to upsert.
            // Ideally we call an RPC or just plain insert/update.
            // Since we have RLS, we should check if we can upsert directly.

            const { error } = await supabase
                .from('attendance_records')
                .upsert({
                    session_id: sessionId,
                    student_id: studentId,
                    status: status,
                    notes: notes,
                    check_in_time: new Date().toISOString(), // Update check-in time to now if manual update? Or keep old? 
                    // For manual teacher update, maybe set to now or keeping it null if absent?
                    // Let's set check_in_time if present/late.
                    check_in_method: 'manual_teacher',
                    marked_by: (await supabase.auth.getUser()).data.user?.id
                }, {
                    onConflict: 'session_id,student_id'
                });

            if (error) throw error;

            toast({
                title: "Success",
                description: "Attendance status updated successfully",
            });

            onSaved();
        } catch (error: any) {
            console.error('Error updating attendance:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to update attendance",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('attendance.editStatus') || 'Edit Attendance'}</DialogTitle>
                    <DialogDescription>
                        Update attendance for <strong>{studentName}</strong> on {format(parseISO(date), 'dd MMM yyyy')}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status">{t('attendance.statusLabel') || 'Status'}</Label>
                        <div className="flex gap-2 flex-wrap">
                            {['present', 'late', 'excused', 'sick', 'absent'].map((s) => (
                                <Button
                                    key={s}
                                    type="button"
                                    variant={status === s ? "default" : "outline"}
                                    className={`capitalize ${status === s
                                            ? s === 'present' ? 'bg-green-600 hover:bg-green-700'
                                                : s === 'late' ? 'bg-yellow-600 hover:bg-yellow-700'
                                                    : s === 'excused' ? 'bg-blue-600 hover:bg-blue-700'
                                                        : s === 'sick' ? 'bg-blue-400 hover:bg-blue-500'
                                                            : 'bg-red-600 hover:bg-red-700'
                                            : ''
                                        }`}
                                    onClick={() => setStatus(s)}
                                >
                                    {t(`attendance.statusTypes.${s}`) || s}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">{t('common.notes') || 'Notes'}</Label>
                        <Textarea
                            id="notes"
                            placeholder="Optional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {t('common.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
