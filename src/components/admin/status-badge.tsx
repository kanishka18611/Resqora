import { cn } from "@/lib/utils";
import type { ApprovalStatus } from "@/lib/access";

const TONE: Record<ApprovalStatus, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-alert/10 text-alert",
};

const LABEL: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        TONE[status],
      )}
    >
      {LABEL[status]}
    </span>
  );
}
