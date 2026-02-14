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
  | 'Internal-Work'
  | 'Internal-Pending-Completion'
  | 'Pending-Acknowledgement'
  | 'Completed-Internal'
  // External path
  | 'External-Pending-RM'
  | 'External-Coordinator'
  | 'External-Pending-Maint-Mgr'
  | 'External-Pending-Admin'
  | 'External-Pending-QC'
  | 'External-Pending-Final'
  | 'External-Pending-Acknowledgement'
  | 'Completed-External'
  // Rejection
  | 'Rejected';

export const ALL_STATUSES: RequestStatus[] = [
  'Submitted',
  'Pending-Stage-2',
  'Pending-Stage-3',
  'Internal-Work',
  'Internal-Pending-Completion',
  'Pending-Acknowledgement',
  'Completed-Internal',
  'External-Pending-RM',
  'External-Coordinator',
  'External-Pending-Maint-Mgr',
  'External-Pending-Admin',
  'External-Pending-QC',
  'External-Pending-Final',
  'External-Pending-Acknowledgement',
  'Completed-External',
  'Rejected',
];

export type WorkflowAction = 'submit' | 'approve' | 'reject' | 'decide_internal' | 'decide_external' | 'acknowledge' | 'verify' | 'return';

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
}

// Common stages (both flows)
export const COMMON_STAGES: StageInfo[] = [
  {
    stage: 1,
    label: 'Request Creation',
    status: 'Submitted',
    actorRole: 'store_coordinator',
    actorLabel: 'Store / Maintenance Coordinator',
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

export const INTERNAL_STAGES: StageInfo[] = [
  {
    stage: 4,
    label: 'Internal Work Coordination',
    status: 'Internal-Work',
    actorRole: 'maintenance_coordinator',
    actorLabel: 'Maintenance Coordinator',
    actions: [
      { action: 'submit', label: 'Submit for Approval', variant: 'default' },
    ],
    nextStatus: 'Internal-Pending-Completion',
  },
  {
    stage: 5,
    label: 'Work Completion Approval',
    status: 'Internal-Pending-Completion',
    actorRole: 'maintenance_manager',
    actorLabel: 'Maintenance Manager (Naseer)',
    actions: [
      { action: 'approve', label: 'Approve', variant: 'default' },
      { action: 'reject', label: 'Reject (Rework)', variant: 'destructive' },
    ],
    nextStatus: 'Pending-Acknowledgement',
    returnToStage: 4,
  },
  {
    stage: 6,
    label: 'Store Acknowledgement',
    status: 'Pending-Acknowledgement',
    actorRole: 'store_manager',
    actorLabel: 'Store Manager',
    actions: [
      { action: 'acknowledge', label: 'Acknowledge Completion', variant: 'default' },
    ],
    nextStatus: 'Completed-Internal',
  },
];

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
    nextStatus: 'External-Coordinator',
    rejectStatus: 'Rejected',
  },
  {
    stage: 5,
    label: 'Coordinator Work Management',
    status: 'External-Coordinator',
    actorRole: 'maintenance_coordinator',
    actorLabel: 'Maintenance Coordinator',
    actions: [
      { action: 'submit', label: 'Submit for Approval', variant: 'default' },
    ],
    nextStatus: 'External-Pending-Maint-Mgr',
  },
  {
    stage: 6,
    label: 'Maintenance Manager Approval',
    status: 'External-Pending-Maint-Mgr',
    actorRole: 'maintenance_manager',
    actorLabel: 'Maintenance Manager (Naseer)',
    actions: [
      { action: 'approve', label: 'Approve', variant: 'default' },
      { action: 'reject', label: 'Reject (Revise)', variant: 'destructive' },
    ],
    nextStatus: 'External-Pending-Admin',
    returnToStage: 5,
  },
  {
    stage: 7,
    label: 'Admin Manager Approval',
    status: 'External-Pending-Admin',
    actorRole: 'admin_manager',
    actorLabel: 'Admin Manager (Sadath)',
    actions: [
      { action: 'approve', label: 'Approve', variant: 'default' },
      { action: 'reject', label: 'Reject', variant: 'destructive' },
    ],
    nextStatus: 'External-Pending-QC',
    rejectStatus: 'Rejected',
  },
  {
    stage: 8,
    label: 'Quality Verification & Inspection',
    status: 'External-Pending-QC',
    actorRole: 'quality_verification',
    actorLabel: 'Quality Verification',
    actions: [
      { action: 'verify', label: 'Verify (Pass)', variant: 'default' },
      { action: 'return', label: 'Return (Fail)', variant: 'destructive' },
    ],
    nextStatus: 'External-Pending-Final',
    returnToStage: 5,
  },
  {
    stage: 9,
    label: 'Final Approval',
    status: 'External-Pending-Final',
    actorRole: 'maintenance_manager',
    actorLabel: 'Maintenance Manager (Naseer)',
    actions: [
      { action: 'approve', label: 'Approve', variant: 'default' },
      { action: 'reject', label: 'Reject', variant: 'destructive' },
    ],
    nextStatus: 'External-Pending-Acknowledgement',
    rejectStatus: 'Rejected',
  },
  {
    stage: 10,
    label: 'Store Acknowledgement',
    status: 'External-Pending-Acknowledgement',
    actorRole: 'store_manager',
    actorLabel: 'Store Manager',
    actions: [
      { action: 'acknowledge', label: 'Acknowledge Completion', variant: 'default' },
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

  // Stage 3 decision point
  if (stageInfo.stage === 3) {
    if (action === 'decide_internal') {
      return { nextStatus: 'Internal-Work', nextStage: 4 };
    }
    if (action === 'decide_external') {
      return { nextStatus: 'External-Pending-RM', nextStage: 4 };
    }
  }

  if (action === 'reject' && stageInfo.rejectStatus) {
    return { nextStatus: stageInfo.rejectStatus, nextStage: stageInfo.stage };
  }

  if ((action === 'reject' || action === 'return') && stageInfo.returnToStage) {
    const returnStage = getStagesForFlow(flowType as FlowType)
      .find(s => s.stage === stageInfo.returnToStage);
    if (returnStage) {
      return { nextStatus: returnStage.status, nextStage: returnStage.stage };
    }
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
