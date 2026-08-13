import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  Bell,
  Camera,
  CheckCircle2,
  Clock,
  Gauge,
  QrCode,
  Settings,
  ShieldAlert,
  ShieldX,
  ShieldCheck,
  Siren,
  Stethoscope,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Mail, MapPin, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/system/page-header";
import { StatCard } from "@/components/system/stat-card";
import { StatCardSkeleton, PanelSkeleton } from "@/components/system/loading-skeletons";
import { StatusIndicator } from "@/components/system/status-indicator";
import { EmptyState } from "@/components/system/empty-state";
import { UsersTable } from "@/components/admin/users-table";
import { RecordsTable, type RecordColumn } from "@/components/admin/records-table";
import { CountBarChart, SharePieChart } from "@/components/admin/admin-charts";
import { ApprovalBadge } from "@/components/admin/status-badge";
import { useAuth } from "@/hooks/use-auth";
import { useAccess } from "@/hooks/use-access";
import { notificationsQuery } from "@/lib/api";
import {
  adminDataQuery,
  isQrScanActivity,
  setApprovalStatus,
  roleFor,
  type AdminActivity,
  type AdminDelivery,
  type AdminEmergency,
  type AdminMedAiLog,
  type AdminPushToken,
  type AdminResqrId,
  type AdminRole,
  type AdminSecurityEvent,
  type AdminUser,
} from "@/lib/admin";
import { deleteUserAccount } from "@/lib/admin.functions";
import { SUPER_ADMIN_EMAIL, type ApprovalStatus } from "@/lib/access";
import { formatDuration, statusLabel } from "@/lib/emergency";
import { logSecurityEvent } from "@/lib/audit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — RESQORA" },
      {
        name: "description",
        content:
          "RESQORA operator console: approve or reject new accounts, review SOS sessions, accident reports, medical AI logs, QR scans and platform analytics.",
      },
      { property: "og:title", content: "RESQORA Admin Dashboard" },
      {
        property: "og:description",
        content:
          "Account approvals, emergency reports and platform analytics for RESQORA operators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const MENU = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "users", label: "User Management", icon: Users },
  { id: "pending", label: "Pending Approvals", icon: Clock },
  { id: "approved", label: "Approved Users", icon: UserCheck },
  { id: "rejected", label: "Rejected Users", icon: ShieldX },
  { id: "sos", label: "Active SOS Sessions", icon: Siren },
  { id: "incidents", label: "Accident Reports", icon: Camera },
  { id: "scans", label: "RESQR ID Management", icon: QrCode },
  { id: "medai", label: "AI Consultation Logs", icon: Stethoscope },
  { id: "live", label: "Live Emergency Monitor", icon: MapPin },
  { id: "email", label: "Email Notification Logs", icon: Mail },
  { id: "push", label: "Push Notification Logs", icon: Bell },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "audit", label: "Audit Logs", icon: ScrollText },
  { id: "settings", label: "System Settings", icon: Settings },
] as const;

type MenuId = (typeof MENU)[number]["id"];

function AdminPage() {
  const { user } = useAuth();
  const access = useAccess();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<MenuId>("dashboard");

  const data = useQuery({ ...adminDataQuery(), enabled: access.isAdmin });
  const notifications = useQuery({ ...notificationsQuery(user?.id), enabled: access.isAdmin });

  const approval = useMutation({
    mutationFn: async ({ user: target, status }: { user: AdminUser; status: ApprovalStatus }) => {
      await setApprovalStatus(target.id, status);
      return { target, status };
    },
    onSuccess: ({ target, status }) => {
      toast.success(
        status === "approved"
          ? `${target.full_name || target.email} now has full access`
          : `${target.full_name || target.email} was rejected`,
      );
      void logSecurityEvent("Admin action", `Account ${status}: ${target.email ?? target.id}`);
      void queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removal = useMutation({
    mutationFn: async (target: AdminUser) => {
      await deleteUserAccount({ data: { userId: target.id } });
      return target;
    },
    onSuccess: (target) => {
      toast.success(`${target.full_name || target.email} was deleted`);
      void logSecurityEvent("Admin action", `Account deleted: ${target.email ?? target.id}`);
      void queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const stats = useMemo(() => {
    const users = data.data?.users ?? [];
    const emergencies = data.data?.emergencies ?? [];
    const activity = data.data?.activity ?? [];
    const medai = data.data?.medai ?? [];
    const resqr = data.data?.resqr ?? [];
    const deliveries = data.data?.deliveries ?? [];
    const pushTokens = data.data?.pushTokens ?? [];
    const security = data.data?.security ?? [];
    const roles = data.data?.roles ?? [];

    const pending = users.filter((u) => u.approval_status === "pending");
    const approved = users.filter((u) => u.approval_status === "approved");
    const rejected = users.filter((u) => u.approval_status === "rejected");
    const sos = emergencies.filter((e) => e.type === "sos");
    const incidents = emergencies.filter((e) => e.type !== "sos");
    const active = emergencies.filter((e) => e.status !== "resolved" && e.status !== "cancelled");
    const resolved = emergencies.filter((e) => e.status === "resolved");
    const scans = activity.filter(isQrScanActivity);
    const avg =
      resolved.length > 0
        ? Math.round(
            resolved.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0) / resolved.length,
          )
        : null;

    const byType = new Map<string, number>();
    for (const item of emergencies) byType.set(item.type, (byType.get(item.type) ?? 0) + 1);
    const bySeverity = new Map<string, number>();
    for (const item of emergencies)
      bySeverity.set(item.severity, (bySeverity.get(item.severity) ?? 0) + 1);

    const signupsByDay = new Map<string, number>();
    for (const item of users) {
      const day = new Date(item.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      signupsByDay.set(day, (signupsByDay.get(day) ?? 0) + 1);
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = users.filter((u) => new Date(u.created_at) >= startOfToday);

    return {
      today,
      users,
      emergencies,
      activity,
      medai,
      resqr,
      deliveries,
      pushTokens,
      security,
      roles,
      pending,
      approved,
      rejected,
      sos,
      incidents,
      active,
      scans,
      avg,
      types: [...byType.entries()].map(([name, value]) => ({ name, value })),
      severities: [...bySeverity.entries()].map(([name, value]) => ({ name, value })),
      signups: [...signupsByDay.entries()]
        .slice(0, 14)
        .reverse()
        .map(([name, value]) => ({ name, value })),
    };
  }, [data.data]);

  const registrationAlerts = useMemo(
    () =>
      (notifications.data ?? []).filter(
        (item) => item.title === "New User Registration" || item.title === "New user registration",
      ),
    [notifications.data],
  );

  if (access.loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Only the super-admin account holds the admin role, so this is the whole gate.
  if (!access.isAdmin) {
    return (
      <>
        <PageHeader
          icon={ShieldAlert}
          title="Admin dashboard"
          description="Restricted to RESQORA operators."
        />
        <EmptyState
          icon={ShieldAlert}
          title="Operator access required"
          description={`This console is limited to the RESQORA administrator account (${SUPER_ADMIN_EMAIL}).`}
        />
      </>
    );
  }

  const busyId = approval.isPending
    ? (approval.variables?.user.id ?? null)
    : removal.isPending
      ? (removal.variables?.id ?? null)
      : null;
  const onSetStatus = (target: AdminUser, status: ApprovalStatus) =>
    approval.mutate({ user: target, status });

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="Admin dashboard"
        description="Account approvals, emergency reports and live platform analytics."
        actions={
          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            {stats.pending.length} awaiting approval
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Admin sections" className="glass-panel h-fit rounded-3xl p-2">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {MENU.map((item) => (
              <li key={item.id} className="shrink-0 lg:w-full">
                <button
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={tab === item.id ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 whitespace-nowrap rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    tab === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                  {item.id === "pending" && stats.pending.length > 0 && (
                    <span className="ml-auto rounded-full bg-warning/15 px-1.5 text-[10px] font-bold text-warning">
                      {stats.pending.length}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          {data.isLoading ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <StatCardSkeleton key={i} />
                ))}
              </div>
              <PanelSkeleton rows={4} />
            </>
          ) : data.isError ? (
            <EmptyState
              icon={ShieldAlert}
              title="Couldn't load platform data"
              description={(data.error as Error).message}
            />
          ) : (
            <>
              {tab === "dashboard" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      icon={Users}
                      label="Total users"
                      value={String(stats.users.length)}
                      delta={`${stats.approved.length} approved`}
                    />
                    <StatCard
                      icon={Clock}
                      label="Pending approval"
                      value={String(stats.pending.length)}
                      delta={stats.pending.length > 0 ? "Action needed" : "All clear"}
                    />
                    <StatCard
                      icon={CheckCircle2}
                      label="Approved users"
                      value={String(stats.approved.length)}
                    />
                    <StatCard
                      icon={ShieldX}
                      label="Rejected users"
                      value={String(stats.rejected.length)}
                    />
                    <StatCard
                      icon={UserRound}
                      label="Today's registrations"
                      value={String(stats.today.length)}
                    />
                    <StatCard
                      icon={Siren}
                      label="SOS sessions"
                      value={String(stats.sos.length)}
                      delta={stats.active.length > 0 ? `${stats.active.length} live` : "None live"}
                    />
                    <StatCard
                      icon={Clock}
                      label="Avg. resolution"
                      value={stats.avg ? formatDuration(stats.avg) : "—"}
                    />
                  </div>

                  <section className="glass-panel rounded-3xl p-5">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Bell className="size-4 text-primary" aria-hidden="true" />
                      Registration notifications
                    </h2>
                    {registrationAlerts.length === 0 ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        No new registrations since your last review.
                      </p>
                    ) : (
                      <ul className="mt-4 space-y-3">
                        {registrationAlerts.slice(0, 6).map((item) => (
                          <li
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-4"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">
                                New User Registration
                              </p>
                              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                {item.body}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <UsersTable
                    users={stats.pending}
                    filter="pending"
                    busyId={busyId}
                    roles={stats.roles}
                    onSetStatus={onSetStatus}
                    emptyLabel="No accounts awaiting approval"
                  />
                </>
              )}

              {tab === "users" && (
                <UsersTable
                  users={stats.users}
                  busyId={busyId}
                  roles={stats.roles}
                  onSetStatus={onSetStatus}
                  onDelete={(target) => removal.mutate(target)}
                  emptyLabel="No accounts registered yet"
                />
              )}

              {tab === "pending" && (
                <UsersTable
                  users={stats.pending}
                  filter="pending"
                  busyId={busyId}
                  roles={stats.roles}
                  onSetStatus={onSetStatus}
                  emptyLabel="No accounts awaiting approval"
                />
              )}

              {tab === "approved" && (
                <UsersTable
                  users={stats.approved}
                  filter="approved"
                  busyId={busyId}
                  roles={stats.roles}
                  onSetStatus={onSetStatus}
                  onDelete={(target) => removal.mutate(target)}
                  emptyLabel="No approved accounts yet"
                />
              )}

              {tab === "rejected" && (
                <UsersTable
                  users={stats.rejected}
                  filter="rejected"
                  busyId={busyId}
                  roles={stats.roles}
                  onSetStatus={onSetStatus}
                  onDelete={(target) => removal.mutate(target)}
                  emptyLabel="No rejected accounts"
                />
              )}

              {tab === "sos" && (
                <EmergencyRecords rows={stats.sos} users={stats.users} title="SOS sessions" />
              )}
              {tab === "incidents" && (
                <EmergencyRecords
                  rows={stats.incidents}
                  users={stats.users}
                  title="accident reports"
                />
              )}

              {tab === "live" && <LiveMonitor rows={stats.active} users={stats.users} />}
              {tab === "email" && (
                <DeliveryRecords
                  rows={stats.deliveries.filter((row) => row.channel === "email")}
                  users={stats.users}
                  label="email alerts"
                />
              )}
              {tab === "push" && <PushRecords tokens={stats.pushTokens} users={stats.users} />}
              {tab === "audit" && <AuditRecords rows={stats.security} users={stats.users} />}

              {tab === "medai" && <MedAiRecords rows={stats.medai} users={stats.users} />}
              {tab === "scans" && (
                <ScanRecords activity={stats.scans} resqr={stats.resqr} users={stats.users} />
              )}

              {tab === "analytics" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={Users} label="Total users" value={String(stats.users.length)} />
                    <StatCard
                      icon={Clock}
                      label="Pending users"
                      value={String(stats.pending.length)}
                    />
                    <StatCard
                      icon={CheckCircle2}
                      label="Approved users"
                      value={String(stats.approved.length)}
                    />
                    <StatCard
                      icon={ShieldAlert}
                      label="Rejected users"
                      value={String(stats.rejected.length)}
                    />
                    <StatCard icon={Siren} label="SOS count" value={String(stats.sos.length)} />
                    <StatCard
                      icon={Camera}
                      label="Incident reports"
                      value={String(stats.incidents.length)}
                    />
                    <StatCard icon={QrCode} label="QR scans" value={String(stats.scans.length)} />
                    <StatCard
                      icon={Stethoscope}
                      label="AI consultations"
                      value={String(stats.medai.length)}
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <SharePieChart
                      title="Account approval mix"
                      data={[
                        { name: "Approved", value: stats.approved.length },
                        { name: "Pending", value: stats.pending.length },
                        { name: "Rejected", value: stats.rejected.length },
                      ]}
                    />
                    <CountBarChart title="Emergencies by type" data={stats.types} />
                    <CountBarChart title="Emergencies by severity" data={stats.severities} />
                    <CountBarChart title="Registrations per day" data={stats.signups} />
                  </div>
                </>
              )}

              {tab === "settings" && (
                <section className="glass-panel space-y-5 rounded-3xl p-6">
                  <SystemSettings />
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Approval policy</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Every new RESQORA account is created as <strong>pending</strong>. Pending
                      accounts can only reach their profile, the About page and support — emergency
                      SOS, accident reporting, RESQ AI, RESQR ID, medical profile, guardian, nearby
                      services, history and contacts stay locked until you approve them.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Super administrator
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {SUPER_ADMIN_EMAIL}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This address receives the admin role automatically on sign-up. Every other
                      account is a normal user, and admin routes are enforced by database policies —
                      not just by hiding menu items.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Signed in as
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <UserRound className="size-4" aria-hidden="true" />
                      {user?.email}
                      <ApprovalBadge status="approved" />
                    </p>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function userLabel(users: AdminUser[], userId: string) {
  const match = users.find((u) => u.id === userId);
  return match?.full_name || match?.email || `${userId.slice(0, 8)}…`;
}

/** Live command view of every emergency that has not been resolved or cancelled. */
function LiveMonitor({ rows, users }: { rows: AdminEmergency[]; users: AdminUser[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No active emergencies"
        description="Live SOS sessions appear here the moment a member triggers one."
      />
    );
  }
  return (
    <div className="grid gap-4">
      {rows.map((row) => (
        <section key={row.id} className="glass-panel rounded-3xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Emergency {row.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {userLabel(users, row.user_id)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {row.address ??
                  (row.latitude != null && row.longitude != null
                    ? `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`
                    : "Waiting for GPS")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusIndicator status="critical" label={statusLabel(row.status)} />
              <span className="rounded-full bg-alert/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-alert">
                {row.severity} · {row.type}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {row.latitude != null && row.longitude != null && (
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="size-4" />
                  Live location
                </a>
              </Button>
            )}
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link to="/history">
                <Activity className="size-4" />
                Emergency records
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Started {new Date(row.started_at).toLocaleString()} · guardian links are issued
            automatically when the member has a designated guardian.
          </p>
        </section>
      ))}
    </div>
  );
}

function DeliveryRecords({
  rows,
  users,
  label,
}: {
  rows: AdminDelivery[];
  users: AdminUser[];
  label: string;
}) {
  const columns: RecordColumn<AdminDelivery>[] = [
    {
      key: "user",
      label: "User",
      render: (row) => <span className="font-medium">{userLabel(users, row.user_id)}</span>,
      text: (row) => userLabel(users, row.user_id),
    },
    {
      key: "contact",
      label: "Recipient",
      render: (row) => (
        <span>
          {row.contact_name}
          <span className="block text-xs text-muted-foreground">
            {row.contact_email ?? row.contact_phone ?? "—"}
          </span>
        </span>
      ),
      text: (row) => `${row.contact_name} ${row.contact_email ?? ""} ${row.contact_phone ?? ""}`,
    },
    {
      key: "kind",
      label: "Type",
      render: (row) => <span className="capitalize text-muted-foreground">{row.kind}</span>,
      text: (row) => row.kind,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusIndicator
          status={row.status === "sent" ? "safe" : row.status === "failed" ? "critical" : "offline"}
          label={row.error ? `${row.status} — ${row.error}` : row.status}
        />
      ),
      text: (row) => `${row.status} ${row.error ?? ""}`,
    },
    {
      key: "created",
      label: "When",
      render: (row) => (
        <span className="text-muted-foreground">
          {new Date(row.sent_at ?? row.created_at).toLocaleString()}
        </span>
      ),
      text: (row) => new Date(row.sent_at ?? row.created_at).toLocaleString(),
    },
  ];

  return (
    <RecordsTable
      rows={rows}
      columns={columns}
      searchPlaceholder="Search recipients, status or type"
      emptyTitle={`No ${label} sent yet`}
      emptyDescription="Delivery attempts are recorded here for every emergency alert."
    />
  );
}

function PushRecords({ tokens, users }: { tokens: AdminPushToken[]; users: AdminUser[] }) {
  const columns: RecordColumn<AdminPushToken>[] = [
    {
      key: "user",
      label: "User",
      render: (row) => <span className="font-medium">{userLabel(users, row.user_id)}</span>,
      text: (row) => userLabel(users, row.user_id),
    },
    {
      key: "platform",
      label: "Platform",
      render: (row) => <span className="capitalize text-muted-foreground">{row.platform}</span>,
      text: (row) => row.platform,
    },
    {
      key: "device",
      label: "Device",
      render: (row) => (
        <span className="line-clamp-2 text-muted-foreground">{row.user_agent ?? "—"}</span>
      ),
      text: (row) => row.user_agent ?? "",
    },
    {
      key: "state",
      label: "State",
      render: (row) => (
        <StatusIndicator
          status={row.active ? "safe" : "offline"}
          label={row.active ? "Active" : "Inactive"}
        />
      ),
      text: (row) => (row.active ? "active" : "inactive"),
    },
    {
      key: "seen",
      label: "Last seen",
      render: (row) => (
        <span className="text-muted-foreground">{new Date(row.last_seen_at).toLocaleString()}</span>
      ),
      text: (row) => new Date(row.last_seen_at).toLocaleString(),
    },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Bell} label="Registered devices" value={String(tokens.length)} />
        <StatCard
          icon={ShieldCheck}
          label="Active devices"
          value={String(tokens.filter((t) => t.active).length)}
        />
        <StatCard
          icon={Users}
          label="Members reachable"
          value={String(new Set(tokens.filter((t) => t.active).map((t) => t.user_id)).size)}
        />
      </div>
      <RecordsTable
        rows={tokens}
        columns={columns}
        searchPlaceholder="Search push devices"
        emptyTitle="No push devices registered"
        emptyDescription="Members appear here once they enable push notifications."
      />
    </>
  );
}

function AuditRecords({ rows, users }: { rows: AdminSecurityEvent[]; users: AdminUser[] }) {
  const columns: RecordColumn<AdminSecurityEvent>[] = [
    {
      key: "user",
      label: "Actor",
      render: (row) => (
        <span className="font-medium">
          {row.user_id ? userLabel(users, row.user_id) : "System"}
        </span>
      ),
      text: (row) => (row.user_id ? userLabel(users, row.user_id) : "system"),
    },
    { key: "event", label: "Event", render: (row) => row.event, text: (row) => row.event },
    {
      key: "detail",
      label: "Detail",
      render: (row) => <span className="text-muted-foreground">{row.detail ?? "—"}</span>,
      text: (row) => row.detail ?? "",
    },
    {
      key: "created",
      label: "When",
      render: (row) => (
        <span className="text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
      ),
      text: (row) => new Date(row.created_at).toLocaleString(),
    },
  ];

  return (
    <RecordsTable
      rows={rows}
      columns={columns}
      searchPlaceholder="Search audit trail"
      emptyTitle="No security events recorded"
      emptyDescription="Sign-ins, approvals, SOS activations and admin actions are logged here."
    />
  );
}

const INTEGRATIONS = [
  { name: "Emergency numbers", detail: "108 ambulance · 100 police · 101 fire · 112 unified" },
  { name: "EmailJS", detail: "Emergency and guardian email alerts" },
  { name: "Firebase Cloud Messaging", detail: "Web push notifications" },
  { name: "Google Maps Platform", detail: "Places, geocoding and navigation links" },
  { name: "RESQORA cloud database", detail: "Accounts, emergencies, telemetry and logs" },
  { name: "RESQORA AI engine", detail: "RESQ AI triage and accident vision analysis" },
] as const;

/** Read-only integration health board — credentials stay server-side and are never rendered. */
function SystemSettings() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">Platform services</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Every integration below is configured with server-side credentials. Keys are never exposed
        to the browser or to this console.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {INTEGRATIONS.map((item) => (
          <li key={item.name} className="rounded-2xl border border-border bg-card/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
              {item.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmergencyRecords({
  rows,
  users,
  title,
}: {
  rows: AdminEmergency[];
  users: AdminUser[];
  title: string;
}) {
  const columns: RecordColumn<AdminEmergency>[] = [
    {
      key: "user",
      label: "User",
      render: (row) => <span className="font-medium">{userLabel(users, row.user_id)}</span>,
      text: (row) => userLabel(users, row.user_id),
    },
    {
      key: "type",
      label: "Type / severity",
      render: (row) => (
        <span className="capitalize">
          {row.type} · {row.severity}
        </span>
      ),
      text: (row) => `${row.type} ${row.severity}`,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusIndicator
          status={
            row.status === "resolved" ? "safe" : row.status === "cancelled" ? "offline" : "critical"
          }
          label={statusLabel(row.status)}
        />
      ),
      text: (row) => row.status,
    },
    {
      key: "location",
      label: "Location",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.address ??
            (row.latitude != null && row.longitude != null
              ? `${row.latitude.toFixed(3)}, ${row.longitude.toFixed(3)}`
              : "No GPS")}
        </span>
      ),
      text: (row) => row.address ?? "",
    },
    {
      key: "started",
      label: "Started",
      render: (row) => (
        <span className="text-muted-foreground">{new Date(row.started_at).toLocaleString()}</span>
      ),
      text: (row) => new Date(row.started_at).toLocaleString(),
    },
  ];

  return (
    <RecordsTable
      rows={rows}
      columns={columns}
      searchPlaceholder="Search by user, type, status or address"
      emptyTitle={`No ${title} recorded`}
      emptyDescription="Records appear here as soon as members use RESQORA."
    />
  );
}

function MedAiRecords({ rows, users }: { rows: AdminMedAiLog[]; users: AdminUser[] }) {
  const columns: RecordColumn<AdminMedAiLog>[] = [
    {
      key: "user",
      label: "User",
      render: (row) => <span className="font-medium">{userLabel(users, row.user_id)}</span>,
      text: (row) => userLabel(users, row.user_id),
    },
    { key: "title", label: "Consultation", render: (row) => row.title, text: (row) => row.title },
    {
      key: "urgency",
      label: "Urgency / specialist",
      render: (row) => (
        <span className="capitalize text-muted-foreground">
          {row.urgency ?? "—"} · {row.specialist ?? "—"}
        </span>
      ),
      text: (row) => `${row.urgency ?? ""} ${row.specialist ?? ""}`,
    },
    {
      key: "language",
      label: "Language",
      render: (row) => <span className="uppercase text-muted-foreground">{row.language}</span>,
      text: (row) => row.language,
    },
    {
      key: "created",
      label: "When",
      render: (row) => (
        <span className="text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
      ),
      text: (row) => new Date(row.created_at).toLocaleString(),
    },
  ];

  return (
    <RecordsTable
      rows={rows}
      columns={columns}
      searchPlaceholder="Search AI consultations"
      emptyTitle="No medical AI consultations yet"
      emptyDescription="RESQ AI and MedAI sessions are listed here as members use them."
    />
  );
}

function ScanRecords({
  activity,
  resqr,
  users,
}: {
  activity: AdminActivity[];
  resqr: AdminResqrId[];
  users: AdminUser[];
}) {
  const columns: RecordColumn<AdminActivity>[] = [
    {
      key: "user",
      label: "User",
      render: (row) => <span className="font-medium">{userLabel(users, row.user_id)}</span>,
      text: (row) => userLabel(users, row.user_id),
    },
    { key: "action", label: "Event", render: (row) => row.action, text: (row) => row.action },
    {
      key: "detail",
      label: "Detail",
      render: (row) => <span className="text-muted-foreground">{row.detail ?? "—"}</span>,
      text: (row) => row.detail ?? "",
    },
    {
      key: "created",
      label: "When",
      render: (row) => (
        <span className="text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
      ),
      text: (row) => new Date(row.created_at).toLocaleString(),
    },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={QrCode} label="Scan events" value={String(activity.length)} />
        <StatCard icon={Activity} label="Issued RESQR IDs" value={String(resqr.length)} />
        <StatCard
          icon={ShieldCheck}
          label="Active RESQR IDs"
          value={String(resqr.filter((item) => item.active).length)}
        />
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <RecordsTable
          rows={activity}
          columns={columns}
          searchPlaceholder="Search QR scan events"
          emptyTitle="No QR scans recorded"
          emptyDescription="RESQR ID scans made by signed-in members appear here."
        />
      </motion.div>
    </>
  );
}
