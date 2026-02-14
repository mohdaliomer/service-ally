import { ComplaintStatus, Priority } from '@/lib/types';
import { cn } from '@/lib/utils';

const statusStyles: Record<ComplaintStatus, string> = {
  'Open': 'bg-status-open/15 text-status-open',
  'Assigned': 'bg-status-assigned/15 text-status-assigned',
  'In Progress': 'bg-status-in-progress/15 text-status-in-progress',
  'On Hold': 'bg-status-on-hold/15 text-status-on-hold',
  'Closed (Pending)': 'bg-status-closed-pending/15 text-status-closed-pending',
  'Closed': 'bg-status-closed/15 text-status-closed',
};

const priorityStyles: Record<Priority, string> = {
  'Low': 'bg-priority-low/15 text-priority-low',
  'Medium': 'bg-priority-medium/15 text-priority-medium',
  'High': 'bg-priority-high/15 text-priority-high',
  'Critical': 'bg-priority-critical/15 text-priority-critical',
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', statusStyles[status])}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', priorityStyles[priority])}>
      {priority}
    </span>
  );
}
