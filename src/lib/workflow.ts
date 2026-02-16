// Workflow types and constants for Maintenance Request system

export type AppRole =
  | 'admin'
  | 'local_user'
  | 'store_coordinator'
  | 'store_manager'
  | 'maintenance_coordinator'
  | 'regional_manager'
  | 'maintenance_manager'
  | 'admin_manager'
  | 'quality_verification';

export const ALL_ROLES: { value: AppRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'store_coordinator', label: 'Store Coordinator' },
  { value: 'store_manager', label: 'Store Manager' },
  { value: 'maintenance_coordinator', label: 'Maintenance Coordinator' },
  { value: 'regional_manager', label: 'Regional Manager' },
  { value: 'maintenance_manager', label: 'Maintenance Manager' },
  { value: 'admin_manager', label: 'Admin Manager' },
  { value: 'quality_verification', label: 'Quality Verification' },
  { value: 'local_user', label: 'Local User' },
];

export type FlowType = 'internal' | 'external';

export type RequestStatus =
  | 'Submitted'
  | 'Pending-Stage-2'
  | 'Pending-Stage-3'
  // Internal path
  | 'Internal-Pending-MM'
  | 'Internal-Pending-SM'
  | 'Completed-Internal'
  // External path
  | 'External-Pending-RM'
  | 'External-Pending-MC-QC'
  | 'External-Pending-MM'
  | 'External-Pending-Admin'
  | 'External-Pending-MC-2'
  | 'External-Pending-MM-2'
  | 'External-Pending-SM'
  | 'Completed-External'
  // Rejection
  | 'Rejected';

export const ALL_STATUSES: RequestStatus[] = [
  'Submitted',
  'Pending-Stage-2',
  'Pending-Stage-3',
  'Internal-Pending-MM',
  'Internal-Pending-SM',
  'Completed-Internal',
  'External-Pending-RM',
  'External-Pending-MC-QC',
  'External-Pending-MM',
  'External-Pending-Admin',
  'External-Pending-MC-2',
  'External-Pending-MM-2',
  'External-Pending-SM',
  'Completed-External',
  'Rejected',
];

export type WorkflowAction = 'submit' | 'approve' | 'reject' | 'decide_internal' | 'decide_external' | 'acknowledge' | 'verify' | 'return' | 'quality_check' | 'close' | 'send_back' | 're_raise';

export interface StageInfo {
  stage: number;
  label: string;
  status: RequestStatus;
  actorRole: AppRole;
  actorLabel: string;
  actions: { action: WorkflowAction; label: string; variant: 'default' | 'destructive' | 'outline' }[];
  nextStatus?: RequestStatus;
  rejectStatus?: RequestStatus;
  returnToStage?: number;
  /** Whether this stage requires a quality check (Good/Better + comment) */
  requiresQualityCheck?: boolean;
}

// Common stages (both flows) - Stages 1-3
export const COMMON_STAGES: StageInfo[] = [
  {
    stage: 1,
    label: 'Request Creation',
    status: 'Submitted',
    actorRole: 'store_coordinator',
    actorLabel: 'Store Coordinator',
    actions: [],
  },
  {
    stage: 2,
    label: 'Store Manager Approval',
    status: 'Pending-Stage-2',
    actorRole: 'store_manager',
    actorLabel: 'Store Manager',
    actions: [
      { action: 'approve', label: 'Approve', variant: 'default' },
      { action: 'reject', label: 'Reject', variant: 'destructive' },
    ],
    nextStatus: 'Pending-Stage-3',
    rejectStatus: 'Rejected',
  },
  {
    stage: 3,
    label: 'Coordinator Decision',
    status: 'Pending-Stage-3',
    actorRole: 'maintenance_coordinator',
    actorLabel: 'Maintenance Coordinator',
    actions: [
      { action: 'decide_internal', label: 'Internal', variant: 'default' },
      { action: 'decide_external', label: 'External', variant: 'outline' },
    ],
  },
];

// Internal path: Stage 4 → 5 → Completed
export const INTERNAL_STAGES: StageInfo[] = [
  {
    stage: 4,
    label: 'Maintenance Manager Approval',
    status: 'Internal-Pending-MM',
    actorRole: 'maintenance_manager',
    actorLabel: 'Maintenance Manager',
    actions: [
      { action: 'approve', label: 'Approve', variant: 'default' },
    ],
    nextStatus: 'Internal-Pending-SM',
  },
  {
    stage: 5,
    label: 'Store Manager Verify & Close',
    status: 'Internal-Pending-SM',
    actorRole: 'store_manager',
    actorLabel: 'Store Manager',
    actions: [
      { action: 'close', label: 'Verify & Close', variant: 'default' },
    ],
    nextStatus: 'Completed-Internal',
  },
];

// External path: RM → MC QC → MM → Admin → MC → MM → SM → Completed
export const EXTERNAL_STAGES: StageInfo[] = [
  {
    stage: 4,
    label: 'Regional Manager Approval',
    status: 'External-Pending-RM',
    actorRole: 'regional_manager',
    actorLabel: 'Regional Manager',
    actions: [
      { action: 'approve', label: 'Approve', variant: 'default' },
      { action: 'reject', label: 'Reject', variant: 'destructive' },
    ],
    nextStatus: 'External-Pending-MC-QC',
    rejectStatus: 'Rejected',
  },
  {
    stage: 5,
    label: 'Maintenance Coordinator Quality Check',
    status: 'External-Pending-MC-QC',
    actorRole: 'maintenance_coordinator',
    actorLabel: 'Maintenance Coordinator',
    actions: [
      { action: 'quality_check', label: 'Submit Quality Check', variant: 'default' },
    ],
    nextStatus: 'External-Pending-MM',
    requiresQualityCheck: true,
  },
  {
    stage: 6,
    label: 'Maintenance Manager Approval',
    status: 'External-Pending-MM',
    actorRole: 'maintenance_manager',
    actorLabel: 'Maintenance Manager',
    actions: [
      { action: 'approve', label: 'Approve', variant: 'default' },
    ],
    nextStatus: 'External-Pending-Admin',
  },
  {
    stage: 7,
    label: 'Admin Manager Approval',
    status: 'External-Pending-Admin',
    actorRole: 'admin_manager',
    actorLabel: 'Admin Manager',
    actions: [
      { action: 'approve', label: 'Approve', variant: 'default' },
      { action: 'reject', label: 'Reject', variant: 'destructive' },
    ],
    nextStatus: 'External-Pending-MC-2',
    rejectStatus: 'Rejected',
  },
  {
    stage: 8,
    label: 'Maintenance Coordinator Acknowledge',
    status: 'External-Pending-MC-2',
    actorRole: 'maintenance_coordinator',
    actorLabel: 'Maintenance Coordinator',
    actions: [
      { action: 'acknowledge', label: 'Acknowledge & Forward', variant: 'default' },
    ],
    nextStatus: 'External-Pending-MM-2',
  },
  {
    stage: 9,
    label: 'Maintenance Manager Final Approval',
    status: 'External-Pending-MM-2',
    actorRole: 'maintenance_manager',
    actorLabel: 'Maintenance Manager',
    actions: [
      { action: 'approve', label: 'Approve', variant: 'default' },
    ],
    nextStatus: 'External-Pending-SM',
  },
  {
    stage: 10,
    label: 'Store Manager Verify & Close',
    status: 'External-Pending-SM',
    actorRole: 'store_manager',
    actorLabel: 'Store Manager',
    actions: [
      { action: 'close', label: 'Verify & Close', variant: 'default' },
    ],
    nextStatus: 'Completed-External',
  },
];

export function getStagesForFlow(flowType: FlowType | null): StageInfo[] {
  if (!flowType) return COMMON_STAGES;
  if (flowType === 'internal') return [...COMMON_STAGES, ...INTERNAL_STAGES];
  return [...COMMON_STAGES, ...EXTERNAL_STAGES];
}

export function getCurrentStageInfo(status: string, flowType: string | null): StageInfo | undefined {
  const stages = getStagesForFlow(flowType as FlowType | null);
  return stages.find(s => s.status === status);
}

export function getNextStatusAfterAction(
  currentStatus: string,
  flowType: string | null,
  action: WorkflowAction
): { nextStatus: RequestStatus; nextStage: number } | null {
  const stageInfo = getCurrentStageInfo(currentStatus, flowType);
  if (!stageInfo) return null;

  // Send back to Store Coordinator (stage 1)
  if (action === 'send_back') {
    return { nextStatus: 'Submitted', nextStage: 1 };
  }

  // Re-raise: return to the stage that sent it back (requires sentBackFromStatus/Stage)
  if (action === 're_raise') {
    // This is handled specially in the UI - caller must provide the target status/stage
    return null;
  }

  // Stage 3 decision point
  if (stageInfo.stage === 3) {
    if (action === 'decide_internal') {
      return { nextStatus: 'Internal-Pending-MM', nextStage: 4 };
    }
    if (action === 'decide_external') {
      return { nextStatus: 'External-Pending-RM', nextStage: 4 };
    }
  }

  if (action === 'reject' && stageInfo.rejectStatus) {
    return { nextStatus: stageInfo.rejectStatus, nextStage: stageInfo.stage };
  }

  if (stageInfo.nextStatus) {
    return { nextStatus: stageInfo.nextStatus, nextStage: stageInfo.stage + 1 };
  }

  return null;
}

export function canActOnStage(userRole: AppRole | null, stageInfo: StageInfo): boolean {
  if (!userRole) return false;
  if (userRole === 'admin') return true;
  return userRole === stageInfo.actorRole;
}

export function isCompleted(status: string): boolean {
  return status === 'Completed-Internal' || status === 'Completed-External';
}

export function isRejected(status: string): boolean {
  return status === 'Rejected';
}

export function getRoleBadgeLabel(role: string): string {
  return ALL_ROLES.find(r => r.value === role)?.label || role;
}
