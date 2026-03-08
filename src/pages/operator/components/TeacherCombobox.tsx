import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export interface TeacherComboboxProps {
    teachers: { id: string; name: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function TeacherCombobox({
    teachers,
    value,
    onChange,
    placeholder,
    className,
}: TeacherComboboxProps) {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);

    // Map special values to human-readable text for display
    const displayValue = React.useMemo(() => {
        if (value === 'all') return t('operator.calendar.allTeachers');
        if (value === 'unassigned') return t('operator.calendar.unassigned');
        const teacher = teachers.find((t) => t.id === value);
        return teacher ? teacher.name : placeholder || t('operator.calendar.searchTeacher');
    }, [value, teachers, t, placeholder]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('w-[220px] justify-between bg-background', className)}
                >
                    <span className={cn('truncate', value === 'unassigned' && 'text-destructive font-medium')}>
                        {displayValue}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="end">
                <Command
                    filter={(value, search) => {
                        // Custom filter function to handle our special IDs
                        if (value === 'all' || value === 'unassigned') {
                            const optionText = value === 'all'
                                ? t('operator.calendar.allTeachers').toLowerCase()
                                : t('operator.calendar.unassigned').toLowerCase();
                            return optionText.includes(search.toLowerCase()) ? 1 : 0;
                        }
                        return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                    }}
                >
                    <CommandInput placeholder={t('operator.calendar.searchTeacher')} />
                    <CommandList>
                        <CommandEmpty>{t('operator.calendar.teacherNotFound')}</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value={t('operator.calendar.allTeachers')}
                                onSelect={() => {
                                    onChange('all');
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4',
                                        value === 'all' ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                                {t('operator.calendar.allTeachers')}
                            </CommandItem>
                            <CommandItem
                                value={t('operator.calendar.unassigned')}
                                onSelect={() => {
                                    onChange('unassigned');
                                    setOpen(false);
                                }}
                                className="text-destructive font-medium data-[selected=true]:text-destructive/80"
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4',
                                        value === 'unassigned' ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                                {t('operator.calendar.unassigned')}
                            </CommandItem>
                        </CommandGroup>
                        <CommandGroup heading={t('operator.reports.teachers')}>
                            {teachers.map((teacher) => (
                                <CommandItem
                                    key={teacher.id}
                                    value={teacher.name}
                                    onSelect={() => {
                                        onChange(teacher.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === teacher.id ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    {teacher.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
