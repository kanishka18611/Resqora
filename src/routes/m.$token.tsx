import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse, Phone, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/m/$token")({
  head: () => ({
    meta: [
      { title: "Emergency medical profile — RESQORA" },
      {
        name: "description",
        content:
          "Responder view of an RESQORA emergency medical profile: blood group, allergies, conditions, notes and trusted contacts.",
      },
      { property: "og:title", content: "Emergency medical profile — RESQORA" },
      {
        property: "og:description",
        content: "Secure responder access to critical medical details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SharedProfilePage,
});

type SharedProfile = {
  full_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  medications: string | null;
  home_address: string | null;
  current_city: string | null;
  phone: string | null;
  contacts: { name: string; relationship: string; phone: string }[];
  notes: { title: string; category: string; content: string }[];
};

function ageOf(dob: string | null) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function SharedProfilePage() {
  const { token } = Route.useParams();
  const shared = useQuery({
    queryKey: ["shared-profile", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_shared_profile", { _token: token });
      if (error) throw new Error(error.message);
      return (data as unknown as SharedProfile | null) ?? null;
    },
  });

  const profile = shared.data;
  const age = ageOf(profile?.date_of_birth ?? null);

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Logo />
        {shared.isLoading ? (
          <div className="glass-panel h-72 animate-pulse rounded-3xl" />
        ) : !profile ? (
          <div className="glass-panel grid place-items-center rounded-3xl p-10 text-center">
            <ShieldAlert className="size-10 text-muted-foreground" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              This profile link is inactive
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The owner revoked this medical QR link or it has expired.
            </p>
          </div>
        ) : (
          <div className="glass-panel overflow-hidden rounded-3xl">
            <div className="flex flex-wrap items-center gap-4 border-b border-border p-5">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`Portrait of ${profile.full_name ?? "the RESQORA user"}`}
                  className="size-16 rounded-2xl object-cover"
                />
              ) : (
                <span className="grid size-16 place-items-center rounded-2xl bg-alert/10 text-alert">
                  <HeartPulse className="size-7" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-alert">
                  Emergency medical profile
                </p>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {profile.full_name || "RESQORA user"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {[age ? `${age} yrs` : null, profile.gender, profile.current_city]
                    .filter(Boolean)
                    .join(" · ") || "Details not provided"}
                </p>
              </div>
              {profile.blood_group && (
                <Badge className="ml-auto rounded-full bg-alert px-3 py-1 text-alert-foreground">
                  Blood group {profile.blood_group}
                </Badge>
              )}
            </div>

            <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2">
              <Field label="Allergies" value={profile.allergies || "None recorded"} />
              <Field
                label="Medical conditions"
                value={profile.medical_conditions || "None recorded"}
              />
              <Field label="Medications" value={profile.medications || "None recorded"} />
              <Field label="Phone" value={profile.phone || "Not provided"} />
              <Field label="Home address" value={profile.home_address || "Not provided"} />
            </div>

            <div className="border-b border-border p-5">
              <h2 className="text-sm font-semibold text-foreground">Emergency contacts</h2>
              <ul className="mt-3 space-y-2">
                {profile.contacts.length === 0 && (
                  <li className="text-sm text-muted-foreground">No contacts recorded.</li>
                )}
                {profile.contacts.map((contact) => (
                  <li
                    key={`${contact.name}-${contact.phone}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card/60 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                    </div>
                    <a
                      href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Phone className="size-4" aria-hidden="true" />
                      {contact.phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Emergency notes</h2>
              <ul className="mt-3 space-y-2">
                {profile.notes.length === 0 && (
                  <li className="text-sm text-muted-foreground">No notes recorded.</li>
                )}
                {profile.notes.map((note) => (
                  <li key={note.title} className="rounded-2xl border border-border bg-card/60 p-3">
                    <p className="text-sm font-medium text-foreground">{note.title}</p>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {note.category}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {note.content}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
