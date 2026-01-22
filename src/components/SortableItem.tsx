import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the SortableItem component.
 */
interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  showHandle?: boolean;
}

/**
 * Individual sortable item component for use within a SortableList.
 * Provides drag handle and drag styles.
 * 
 * @param {SortableItemProps} props - Component props.
 * @returns {JSX.Element} The sortable item wrapper.
 */
export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  children,
  className,
  showHandle = true
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'opacity-50',
        className
      )}
    >
      <div className="flex items-start gap-2">
        {showHandle && (
          <button
            type="button"
            className="mt-3 cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export default SortableItem;
