import { cn } from '@/lib/utils';
import type { Priority } from '@/lib/types';

const statusStyles: Record<string, string> = {
  // Common
  'Submitted': 'bg-blue-500/15 text-blue-600',
  'Pending-Stage-2': 'bg-amber-500/15 text-amber-600',
  'Pending-Stage-3': 'bg-amber-500/15 text-amber-600',
  // Internal
  'Internal-Work': 'bg-indigo-500/15 text-indigo-600',
  'Internal-Pending-Completion': 'bg-orange-500/15 text-orange-600',
  'Pending-Acknowledgement': 'bg-teal-500/15 text-teal-600',
  'Completed-Internal': 'bg-emerald-500/15 text-emerald-600',
  // External
  'External-Pending-RM': 'bg-amber-500/15 text-amber-600',
  'External-Coordinator': 'bg-indigo-500/15 text-indigo-600',
  'External-Pending-Maint-Mgr': 'bg-orange-500/15 text-orange-600',
  'External-Pending-Admin': 'bg-purple-500/15 text-purple-600',
  'External-Pending-QC': 'bg-cyan-500/15 text-cyan-600',
  'External-Pending-Final': 'bg-orange-500/15 text-orange-600',
  'External-Pending-Acknowledgement': 'bg-teal-500/15 text-teal-600',
  'Completed-External': 'bg-emerald-500/15 text-emerald-600',
  // Other
  'Rejected': 'bg-red-500/15 text-red-600',
  // Legacy statuses
  'Open': 'bg-blue-500/15 text-blue-600',
  'Assigned': 'bg-amber-500/15 text-amber-600',
  'In Progress': 'bg-indigo-500/15 text-indigo-600',
  'On Hold': 'bg-gray-500/15 text-gray-600',
  'Closed (Pending)': 'bg-teal-500/15 text-teal-600',
  'Closed': 'bg-emerald-500/15 text-emerald-600',
};

const priorityStyles: Record<Priority, string> = {
  'Low': 'bg-priority-low/15 text-priority-low',
  'Medium': 'bg-priority-medium/15 text-priority-medium',
  'High': 'bg-priority-high/15 text-priority-high',
  'Critical': 'bg-priority-critical/15 text-priority-critical',
};

const statusLabels: Record<string, string> = {
  'Submitted': 'Submitted',
  'Pending-Stage-2': 'Pending Store Manager',
  'Pending-Stage-3': 'Pending Coordinator',
  'Internal-Work': 'Internal Work',
  'Internal-Pending-Completion': 'Pending Completion Approval',
  'Pending-Acknowledgement': 'Pending Acknowledgement',
  'Completed-Internal': 'Completed (Internal)',
  'External-Pending-RM': 'Pending Regional Manager',
  'External-Coordinator': 'Coordinator Working',
  'External-Pending-Maint-Mgr': 'Pending Maint. Manager',
  'External-Pending-Admin': 'Pending Admin Manager',
  'External-Pending-QC': 'Pending QC',
  'External-Pending-Final': 'Pending Final Approval',
  'External-Pending-Acknowledgement': 'Pending Acknowledgement',
  'Completed-External': 'Completed (External)',
  'Rejected': 'Rejected',
};

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || 'bg-muted text-muted-foreground';
  const label = statusLabels[status] || status;
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', style)}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', priorityStyles[priority] || 'bg-muted text-muted-foreground')}>
      {priority}
    </span>
  );
}
