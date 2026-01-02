import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, AlertTriangle, Clock, TrendingDown, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { arrayMove } from '@dnd-kit/sortable';
import SortableList from '@/components/SortableContext';
import SortableItem from '@/components/SortableItem';

export interface RiskCriterion {
  id: string;
  type: 'missed' | 'below_kkm' | 'late' | 'custom';
  name: string;
  description: string;
  enabled: boolean;
  severity: 'high' | 'medium' | 'low';
}

// Preset risk criteria that map to system behaviors
const PRESET_CRITERIA: Omit<RiskCriterion, 'id'>[] = [
  {
    type: 'missed',
    name: 'Missed Submission',
    description: 'Student did not submit by the deadline',
    enabled: false,
    severity: 'high',
  },
  {
    type: 'below_kkm',
    name: 'Below Passing Grade (KKM)',
    description: 'Score is below the minimum passing threshold',
    enabled: false,
    severity: 'medium',
  },
  {
    type: 'late',
    name: 'Late Submission',
    description: 'Submitted after the deadline',
    enabled: false,
    severity: 'low',
  },
];

interface RiskCriteriaBuilderProps {
  criteria: RiskCriterion[];
  onChange: (criteria: RiskCriterion[]) => void;
  allowCustom?: boolean;
  allowLate?: boolean; // Only show late option for assignments, not exams
  className?: string;
}

const severityColors = {
  high: 'border-destructive/50 bg-destructive/5',
  medium: 'border-orange-500/50 bg-orange-500/5',
  low: 'border-yellow-500/50 bg-yellow-500/5',
};

const severityBadgeColors = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-orange-500 text-white',
  low: 'bg-yellow-500 text-yellow-900',
};

const typeIcons = {
  missed: Ban,
  below_kkm: TrendingDown,
  late: Clock,
  custom: AlertTriangle,
};

const RiskCriteriaBuilder: React.FC<RiskCriteriaBuilderProps> = ({
  criteria,
  onChange,
  allowCustom = true,
  allowLate = true,
  className,
}) => {
  // Initialize with presets if empty
  React.useEffect(() => {
    if (criteria.length === 0) {
      const initialCriteria = PRESET_CRITERIA
        .filter(c => allowLate || c.type !== 'late')
        .map(c => ({ ...c, id: crypto.randomUUID() }));
      onChange(initialCriteria);
    }
  }, []);

  const updateCriterion = (id: string, updates: Partial<RiskCriterion>) => {
    onChange(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const toggleCriterion = (id: string) => {
    const criterion = criteria.find(c => c.id === id);
    if (criterion) {
      updateCriterion(id, { enabled: !criterion.enabled });
    }
  };

  const addCustomCriterion = () => {
    const newCriterion: RiskCriterion = {
      id: crypto.randomUUID(),
      type: 'custom',
      name: '',
      description: '',
      enabled: true,
      severity: 'medium',
    };
    onChange([...criteria, newCriterion]);
  };

  const removeCriterion = (id: string) => {
    onChange(criteria.filter(c => c.id !== id));
  };

  const handleReorder = (oldIndex: number, newIndex: number) => {
    onChange(arrayMove(criteria, oldIndex, newIndex));
  };

  const enabledCount = criteria.filter(c => c.enabled).length;

  const renderCriterionCard = (criterion: RiskCriterion) => {
    const Icon = typeIcons[criterion.type];
    const isPreset = criterion.type !== 'custom';

    return (
      <Card 
        className={cn(
          'transition-all',
          criterion.enabled 
            ? severityColors[criterion.severity]
            : 'opacity-60 border-dashed'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
              criterion.enabled ? 'bg-background' : 'bg-muted'
            )}>
              <Icon className={cn(
                'h-5 w-5',
                criterion.enabled 
                  ? criterion.severity === 'high' ? 'text-destructive'
                    : criterion.severity === 'medium' ? 'text-orange-500'
                    : 'text-yellow-500'
                  : 'text-muted-foreground'
              )} />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  {isPreset ? (
                    <>
                      <h4 className="font-medium">{criterion.name}</h4>
                      <p className="text-sm text-muted-foreground">{criterion.description}</p>
                    </>
                  ) : (
                    <>
                      <Input
                        placeholder="Criterion name (e.g., Low Participation)"
                        value={criterion.name}
                        onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
                        className="font-medium h-8"
                      />
                      <Textarea
                        placeholder="Description of when this applies..."
                        value={criterion.description}
                        onChange={(e) => updateCriterion(criterion.id, { description: e.target.value })}
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  <Switch
                    checked={criterion.enabled}
                    onCheckedChange={() => toggleCriterion(criterion.id)}
                  />
                  {!isPreset && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeCriterion(criterion.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Severity selector - only show when enabled */}
              {criterion.enabled && (
                <div className="flex items-center gap-3">
                  <Label className="text-sm text-muted-foreground">Risk Level:</Label>
                  <Select
                    value={criterion.severity}
                    onValueChange={(v: 'high' | 'medium' | 'low') => 
                      updateCriterion(criterion.id, { severity: v })
                    }
                  >
                    <SelectTrigger className="w-36 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-destructive" />
                          High Risk
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          Medium Risk
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500" />
                          Low Risk
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Severity badge preview */}
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    severityBadgeColors[criterion.severity]
                  )}>
                    {criterion.severity.charAt(0).toUpperCase() + criterion.severity.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <div>
            <h3 className="font-medium">Risk Monitoring Criteria</h3>
            <p className="text-sm text-muted-foreground">
              {enabledCount > 0 
                ? `${enabledCount} criteria active - students matching these will be flagged as at-risk`
                : 'Enable criteria to monitor student performance'}
            </p>
          </div>
        </div>
      </div>

      {/* Criteria Cards with Drag and Drop */}
      <SortableList
        items={criteria.map(c => c.id)}
        onReorder={handleReorder}
      >
        <div className="space-y-3">
          {criteria.map((criterion) => (
            <SortableItem 
              key={criterion.id} 
              id={criterion.id}
              showHandle={criterion.type === 'custom'}
            >
              {renderCriterionCard(criterion)}
            </SortableItem>
          ))}
        </div>
      </SortableList>

      {/* Add Custom Criterion */}
      {allowCustom && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={addCustomCriterion}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Risk Criterion
        </Button>
      )}

      {/* Summary */}
      {enabledCount > 0 && (
        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-sm font-medium mb-2">Active Risk Labels:</p>
          <div className="flex flex-wrap gap-2">
            {criteria.filter(c => c.enabled).map(c => (
              <span
                key={c.id}
                className={cn(
                  'text-xs px-2 py-1 rounded-full font-medium',
                  severityBadgeColors[c.severity]
                )}
              >
                {c.name || 'Unnamed'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskCriteriaBuilder;
