type WorkflowLikeOrder = {
  workflow_state?: string | null;
  status?: string | null;
  docstatus?: number | string | null;
};

const normalizeWorkflowValue = (value?: string | null) => String(value ?? "").trim();

export function getSalesOrderWorkflowState(order?: WorkflowLikeOrder | null) {
  const workflowState = normalizeWorkflowValue(order?.workflow_state);
  if (workflowState) return workflowState;

  const status = normalizeWorkflowValue(order?.status);
  if (status) return status;

  return Number(order?.docstatus) === 0 ? "Draft" : "Unknown";
}

export function canEditOrder(order?: WorkflowLikeOrder | null) {
  const state = getSalesOrderWorkflowState(order).toLowerCase();
  if (!state) return false;

  return state === "draft"
    || state === "pending approval"
    || state === "pending_approval"
    || state === "submitted"
    || state === "approval requested"
    || state === "approval_requested";
}

export function canCancelOrder(order?: WorkflowLikeOrder | null) {
  const state = getSalesOrderWorkflowState(order).toLowerCase();
  if (!state) return false;

  return state === "draft"
    || state === "pending approval"
    || state === "pending_approval"
    || state === "submitted"
    || state === "approved";
}

export function canApproveOrder(order?: WorkflowLikeOrder | null) {
  const state = getSalesOrderWorkflowState(order).toLowerCase();
  return state === "pending approval"
    || state === "pending_approval"
    || state === "submitted"
    || state === "approval requested"
    || state === "approval_requested"
    || state === "awaiting approval"
    || state === "awaiting_approval";
}

export function canRejectOrder(order?: WorkflowLikeOrder | null) {
  const state = getSalesOrderWorkflowState(order).toLowerCase();
  return state === "pending approval"
    || state === "pending_approval"
    || state === "submitted"
    || state === "approval requested"
    || state === "approval_requested"
    || state === "awaiting approval"
    || state === "awaiting_approval";
}

export function isOrderWorkflowTerminal(order?: WorkflowLikeOrder | null) {
  const state = getSalesOrderWorkflowState(order).toLowerCase();
  return ["rejected", "cancelled", "shipped", "delivered"].includes(state);
}
