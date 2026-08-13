import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LifeBuoy, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAccess } from "@/hooks/use-access";
import { profileQuery } from "@/lib/api";
import { approvalLabel, SUPER_ADMIN_EMAIL } from "@/lib/access";

export const Route = createFileRoute("/_app/support")({
  head: () => ({
    meta: [
      { title: "Contact support — RESQORA" },
      {
        name: "description",
        content:
          "Reach the RESQORA operations team about account approval, emergency alerts or medical profile questions.",
      },
      { property: "og:title", content: "Contact RESQORA support" },
      {
        property: "og:description",
        content: "Account approval help and emergency platform support for RESQORA members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { user } = useAuth();
  const access = useAccess();
  const profile = useQuery(profileQuery(user?.id));

  const subject = encodeURIComponent(`RESQORA support — ${user?.email ?? "account"}`);
  const body = encodeURIComponent(
    [
      "Hello RESQORA team,",
      "",
      `Account: ${user?.email ?? "—"}`,
      `Name: ${profile.data?.full_name || "—"}`,
      `Approval status: ${approvalLabel(access.status)}`,
      "",
      "How can we help?",
      "",
    ].join("\n"),
  );

  return (
    <>
      <PageHeader
        icon={LifeBuoy}
        title="Contact support"
        description="Questions about approval, alerts or your medical profile — the operations team replies here."
      />

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="text-sm font-semibold text-foreground">Your account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
            <dd className="mt-1 truncate text-sm text-foreground">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Name</dt>
            <dd className="mt-1 truncate text-sm text-foreground">
              {profile.data?.full_name || "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Status</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {access.isAdmin ? "Administrator" : approvalLabel(access.status)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="glass-panel rounded-3xl p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-foreground">Email the team</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Approval requests, access problems and data questions. We pre-fill your account details
            so nothing gets lost.
          </p>
          <Button asChild className="mt-4 rounded-2xl">
            <a href={`mailto:${SUPER_ADMIN_EMAIL}?subject=${subject}&body=${body}`}>
              <Mail className="size-4" />
              Write to support
            </a>
          </Button>
        </section>

        <section className="glass-panel rounded-3xl p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-alert/10 text-alert">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            In a real emergency, don&apos;t wait for us
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Support is not an emergency line. Call your local emergency number immediately — in
            India dial 112 for any emergency or 108 for an ambulance.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="emergency" className="rounded-2xl">
              <a href="tel:112">Call 112</a>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl">
              <a href="tel:108">Ambulance 108</a>
            </Button>
          </div>
        </section>
      </div>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MessageCircle className="size-4 text-primary" aria-hidden="true" />
          Common questions
        </h2>
        <ul className="mt-4 space-y-4 text-sm">
          <li>
            <p className="font-medium text-foreground">Why is my account pending?</p>
            <p className="mt-1 text-muted-foreground">
              Every new RESQORA account is reviewed by an administrator before emergency features
              are unlocked. You keep access to your profile, About and support while you wait.
            </p>
          </li>
          <li>
            <p className="font-medium text-foreground">How long does approval take?</p>
            <p className="mt-1 text-muted-foreground">
              Administrators are notified the moment you register. Once approved, your access opens
              automatically — no need to sign out and back in.
            </p>
          </li>
          <li>
            <p className="font-medium text-foreground">Can I speed it up?</p>
            <p className="mt-1 text-muted-foreground">
              Complete your medical profile and add emergency contacts. A complete profile is
              reviewed faster and makes your alerts far more useful to responders.
            </p>
          </li>
        </ul>
      </section>
    </>
  );
}
