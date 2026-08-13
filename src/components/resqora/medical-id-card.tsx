import { useEffect, useState } from "react";
import { Droplets, HeartPulse, Pill, QrCode, TriangleAlert, UserRound } from "lucide-react";
import type { EmergencyContact, Profile } from "@/lib/api";

export function ageFromDob(dob: string | null | undefined) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** Plain-text payload encoded into the responder QR code. */
export function medicalIdPayload(
  profile: Profile | null | undefined,
  contacts: EmergencyContact[] = [],
) {
  const age = ageFromDob(profile?.date_of_birth);
  const lines = [
    "RESQORA MEDICAL ID",
    `Name: ${profile?.full_name || "Unknown"}`,
    `Age: ${age ?? "Unknown"}`,
    `Blood group: ${profile?.blood_group || "Unknown"}`,
    `Allergies: ${profile?.allergies || "None recorded"}`,
    `Conditions: ${profile?.medical_conditions || "None recorded"}`,
    `Medications: ${profile?.medications || "None recorded"}`,
    `Phone: ${profile?.phone || "Not set"}`,
  ];
  if (contacts.length > 0) {
    lines.push("Emergency contacts:");
    for (const contact of contacts) {
      lines.push(`- ${contact.name} (${contact.relationship}) ${contact.phone}`);
    }
  }
  return lines.join("\n");
}

export function MedicalIdQr({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then(async (qrcode) => {
      const url = await qrcode.toDataURL(value, { margin: 1, width: 220 });
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!dataUrl) {
    return (
      <div className="grid size-[132px] place-items-center rounded-xl bg-muted text-muted-foreground">
        <QrCode className="size-6" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR code containing this medical ID for emergency responders"
      className="size-[132px] rounded-xl bg-white p-1.5"
      width={132}
      height={132}
    />
  );
}

export function MedicalIdCard({
  profile,
  contacts = [],
  showQr = false,
  qrValue,
  qrCaption,
}: {
  profile: Profile | null | undefined;
  contacts?: EmergencyContact[];
  showQr?: boolean;
  /** Overrides the QR payload — pass a secure /m/<token> URL to open the live profile page. */
  qrValue?: string;
  qrCaption?: string;
}) {
  const age = ageFromDob(profile?.date_of_birth);
  const rows = [
    { icon: Droplets, label: "Blood group", value: profile?.blood_group || "Not set" },
    { icon: TriangleAlert, label: "Allergies", value: profile?.allergies || "None recorded" },
    {
      icon: HeartPulse,
      label: "Conditions",
      value: profile?.medical_conditions || "None recorded",
    },
    { icon: Pill, label: "Medications", value: profile?.medications || "None recorded" },
  ];

  return (
    <div className="glass-panel overflow-hidden rounded-2xl">
      <div className="flex items-center gap-4 bg-linear-to-r from-primary/12 to-alert/12 px-5 py-4">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={`${profile.full_name ?? "User"} profile photo`}
            className="size-14 shrink-0 rounded-2xl object-cover"
            width={56}
            height={56}
          />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
            <UserRound className="size-6" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Medical ID
          </p>
          <p className="mt-0.5 truncate font-display text-lg font-semibold text-foreground">
            {profile?.full_name || "Unnamed profile"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {age != null ? `${age} years` : "Age not set"} · {profile?.phone || "No phone"}
          </p>
        </div>
      </div>
      <dl className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3 px-5 py-3.5">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-alert/10 text-alert">
              <row.icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {row.label}
              </dt>
              <dd className="text-sm text-foreground">{row.value}</dd>
            </div>
          </div>
        ))}
        {contacts.length > 0 && (
          <div className="px-5 py-3.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Emergency contacts
            </dt>
            <dd className="mt-1.5 space-y-1">
              {contacts.map((contact) => (
                <p key={contact.id} className="truncate text-sm text-foreground">
                  {contact.name}{" "}
                  <span className="text-muted-foreground">
                    · {contact.relationship} · {contact.phone}
                  </span>
                </p>
              ))}
            </dd>
          </div>
        )}
      </dl>
      {showQr && (
        <div className="flex items-center gap-4 border-t border-border bg-muted/30 p-5">
          <MedicalIdQr value={qrValue || medicalIdPayload(profile, contacts)} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Responder QR code</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {qrCaption ||
                "Any responder can scan this to read your blood group, allergies, conditions, medications and trusted contacts — no app or login required."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
