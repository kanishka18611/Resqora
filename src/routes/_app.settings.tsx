import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  LogOut,
  MapPin,
  Moon,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, type Profile } from "@/lib/api";
import { logSecurityEvent } from "@/lib/audit";
import { pushPermission, requestPushPermission, showPush } from "@/lib/push";
import { pushConfigured, registerPushDevice, unregisterPushDevice } from "@/lib/fcm";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — RESQORA" },
      {
        name: "description",
        content:
          "Control RESQORA privacy, location sharing, crash detection, notification preferences, appearance and account access.",
      },
      { property: "og:title", content: "RESQORA Settings" },
      { property: "og:description", content: "Privacy, location, notifications and appearance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: SettingsIcon },
];

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { data: profile } = useQuery(profileQuery(user?.id));
  const [permission, setPermission] = useState<ReturnType<typeof pushPermission>>("default");
  const [fcmReady, setFcmReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPermission(pushPermission());
    void pushConfigured().then(setFcmReady);
  }, []);

  async function togglePush(next: boolean) {
    if (!user) return;
    setBusy(true);
    try {
      if (next) {
        const result = await registerPushDevice(user.id);
        if (result.status === "denied") {
          setPermission("denied");
          toast.error("Notifications are blocked in your browser settings");
          return;
        }
        if (result.status === "not-configured") {
          toast.error("Push notifications are not configured for this deployment yet");
          return;
        }
        if (result.status === "unsupported") {
          toast.error("This browser cannot receive push notifications");
          return;
        }
        if (result.status === "failed") {
          toast.error(result.error);
          return;
        }
        setPermission("granted");
      } else {
        await unregisterPushDevice(user.id);
      }
      await update({ notify_push: next });
    } finally {
      setBusy(false);
    }
  }

  async function update(patch: Partial<Profile>) {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Preference saved");
  }

  async function signOut() {
    void logSecurityEvent("Signed out", "User signed out of RESQORA");
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <>
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        description="Privacy, safety automation, notifications and appearance."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            Privacy & location
          </h2>
          <div className="mt-4 space-y-4">
            <ToggleRow
              id="location-sharing"
              label="Share live location during emergencies"
              description="Contacts and responders see your GPS position until the alert is resolved."
              checked={profile?.location_sharing ?? true}
              onChange={(value) => update({ location_sharing: value })}
            />
            <Separator />
            <ToggleRow
              id="crash-detection-setting"
              label="Automatic crash detection"
              description="Escalate to an SOS if a severe impact is detected and you don't respond in 10 seconds."
              checked={profile?.crash_detection ?? true}
              onChange={(value) => update({ crash_detection: value })}
            />
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bell className="size-4 text-primary" aria-hidden="true" />
            Notifications
          </h2>
          <div className="mt-4 space-y-4">
            <ToggleRow
              id="notify-emergency"
              label="Emergency alerts"
              description="Status changes on your active emergencies."
              checked={profile?.notify_emergency ?? true}
              onChange={(value) => update({ notify_emergency: value })}
            />
            <Separator />
            <ToggleRow
              id="notify-safety"
              label="Safety tips"
              description="Occasional preparedness guidance for your area."
              checked={profile?.notify_safety_tips ?? true}
              onChange={(value) => update({ notify_safety_tips: value })}
            />
            <Separator />
            <ToggleRow
              id="notify-system"
              label="Product updates"
              description="New RESQORA features and account notices."
              checked={profile?.notify_system ?? true}
              onChange={(value) => update({ notify_system: value })}
            />
            <Separator />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Emergency push notifications</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {fcmReady
                    ? "SOS activation, Guardian alerts, live tracking and resolution reach this device instantly."
                    : "Push delivery is not configured for this deployment yet."}
                </p>
              </div>
              <Switch
                id="notify-push"
                aria-label="Emergency push notifications"
                disabled={busy || !fcmReady || permission === "unsupported"}
                checked={(profile?.notify_push ?? true) && permission === "granted"}
                onCheckedChange={(value) => void togglePush(value)}
              />
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Device push notifications</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {permission === "unsupported"
                    ? "This browser does not support notifications."
                    : permission === "granted"
                      ? "Enabled — check-in reminders and emergency updates appear on this device."
                      : permission === "denied"
                        ? "Blocked in your browser settings. Re-allow notifications for this site."
                        : "Allow RESQORA to send check-in reminders and disaster alerts to this device."}
                </p>
              </div>
              <Button
                size="sm"
                variant={permission === "granted" ? "outline" : "hero"}
                disabled={permission === "unsupported" || permission === "denied"}
                onClick={async () => {
                  if (permission === "granted") {
                    showPush(
                      "RESQORA test alert",
                      "Push notifications are working on this device.",
                    );
                    return;
                  }
                  const result = await requestPushPermission();
                  setPermission(result);
                  if (result === "granted") {
                    showPush(
                      "Push notifications enabled",
                      "RESQORA can now reach you on this device.",
                    );
                    toast.success("Push notifications enabled");
                  } else {
                    toast.error("Notification permission was not granted");
                  }
                }}
              >
                {permission === "granted" ? "Send test" : "Enable"}
              </Button>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sun className="size-4 text-primary" aria-hidden="true" />
            Appearance
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTheme(option.value);
                  void update({ theme: option.value });
                }}
                aria-pressed={theme === option.value}
                className={cn(
                  "flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border text-xs font-semibold transition-colors",
                  theme === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground",
                )}
              >
                <option.icon className="size-5" aria-hidden="true" />
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Account
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate text-foreground">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Protection</dt>
              <dd className="text-foreground">
                {profile?.onboarding_completed ? "Active" : "Setup incomplete"}
              </dd>
            </div>
          </dl>
          <Button variant="outline" className="mt-5 w-full" onClick={signOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </section>
      </div>
    </>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
