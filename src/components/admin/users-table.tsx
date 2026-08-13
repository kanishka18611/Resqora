import { useMemo, useState } from "react";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApprovalBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/system/empty-state";
import type { AdminRole, AdminUser } from "@/lib/admin";
import { roleFor } from "@/lib/admin";
import type { ApprovalStatus } from "@/lib/access";

type Filter = "all" | ApprovalStatus;

const PAGE_SIZE = 10;

export function UsersTable({
  users,
  roles = [],
  filter: fixedFilter,
  busyId,
  onSetStatus,
  onDelete,
  emptyLabel,
}: {
  users: AdminUser[];
  roles?: AdminRole[];
  /** When set the status filter is locked to this value (Pending / Approved views). */
  filter?: ApprovalStatus;
  busyId: string | null;
  onSetStatus: (user: AdminUser, status: ApprovalStatus) => void;
  onDelete?: (user: AdminUser) => void;
  emptyLabel: string;
}) {
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>(fixedFilter ?? "all");
  const [viewing, setViewing] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [confirming, setConfirming] = useState<{ user: AdminUser; status: ApprovalStatus } | null>(
    null,
  );

  const effectiveFilter: Filter = fixedFilter ?? filter;

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return users.filter((user) => {
      if (effectiveFilter !== "all" && user.approval_status !== effectiveFilter) return false;
      if (!needle) return true;
      return [user.full_name, user.email, user.phone, user.current_city]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [users, term, effectiveFilter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const paged = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="glass-panel rounded-3xl p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setPage(0);
            }}
            placeholder="Search name, email, phone or city"
            aria-label="Search users"
            className="rounded-2xl pl-9"
          />
        </div>
        {!fixedFilter && (
          <div className="flex gap-1 rounded-2xl bg-muted p-1">
            {(["all", "pending", "approved", "rejected"] as Filter[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setFilter(option);
                  setPage(0);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  filter === option
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
        <span className="text-xs text-muted-foreground">{rows.length} shown</span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={UserRound}
            title={emptyLabel}
            description="Nothing matches this view yet."
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {paged.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card/60 p-4"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={`${user.full_name || "User"} profile photo`}
                  className="size-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {(user.full_name || user.email || "?").slice(0, 1).toUpperCase()}
                </span>
              )}

              <div className="min-w-[180px] flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.full_name || "Unnamed user"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user.email ?? "No email"}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {user.phone || "No phone"} · registered{" "}
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>

              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {roleFor(roles, user.id)}
              </span>
              <ApprovalBadge status={user.approval_status} />

              <div className="flex flex-wrap gap-2">
                {user.approval_status !== "approved" && (
                  <Button
                    size="sm"
                    className="rounded-xl"
                    disabled={busyId === user.id}
                    onClick={() => setConfirming({ user, status: "approved" })}
                  >
                    <Check className="size-4" />
                    Approve
                  </Button>
                )}
                {user.approval_status !== "rejected" && (
                  // One revoke action per state: pending accounts are rejected,
                  // already-approved accounts are suspended. Same effect, so only
                  // the label that matches the account's state is shown.
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={busyId === user.id}
                    onClick={() => setConfirming({ user, status: "rejected" })}
                  >
                    {user.approval_status === "approved" ? (
                      <>
                        <Ban className="size-4" />
                        Suspend
                      </>
                    ) : (
                      <>
                        <X className="size-4" />
                        Reject
                      </>
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setViewing(user)}
                >
                  <Eye className="size-4" />
                  View
                </Button>
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-alert hover:text-alert"
                    disabled={busyId === user.id}
                    onClick={() => setDeleting(user)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {rows.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {current + 1} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.full_name || deleting?.email} and all of their emergency records, medical
              profile and RESQR IDs will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-alert text-alert-foreground hover:bg-alert/90"
              onClick={() => {
                if (deleting) onDelete?.(deleting);
                setDeleting(null);
              }}
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(confirming)} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming?.status === "approved" ? "Approve this account?" : "Reject this account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.status === "approved"
                ? `${confirming?.user.full_name || confirming?.user.email} will immediately unlock SOS, accident reporting, RESQ AI, RESQR ID, medical profile, contacts, guardian, history and nearby services.`
                : `${confirming?.user.full_name || confirming?.user.email} will keep basic access only and will see the rejection notice on sign-in.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl"
              onClick={() => {
                if (confirming) onSetStatus(confirming.user, confirming.status);
                setConfirming(null);
              }}
            >
              {confirming?.status === "approved" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{viewing?.full_name || "Unnamed user"}</DialogTitle>
            <DialogDescription>{viewing?.email ?? "No email on record"}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Phone" value={viewing.phone} />
              <Field label="City" value={viewing.current_city} />
              <Field label="Blood group" value={viewing.blood_group} />
              <Field
                label="Onboarding"
                value={viewing.onboarding_completed ? "Complete" : "Incomplete"}
              />
              <Field label="Registered" value={new Date(viewing.created_at).toLocaleString()} />
              <Field
                label="Approved at"
                value={viewing.approved_at ? new Date(viewing.approved_at).toLocaleString() : null}
              />
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <ApprovalBadge status={viewing.approval_status} />
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-foreground">{value || "—"}</dd>
    </div>
  );
}
