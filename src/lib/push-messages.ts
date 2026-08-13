export type PushMessage = {
  title: string;
  body: string;
  url: string;
  tag: string;
  kind: "sos" | "guardian" | "tracking" | "resolved";
};

/** The RESQORA push copy used by both the server sender and the UI previews. */
export function buildEmergencyPush(input: {
  kind: PushMessage["kind"];
  emergencyId: string;
  personName: string;
  detail: string | null;
  guardianUrl: string | null;
}): PushMessage {
  const name = input.personName || "A RESQORA user";
  const guardian = input.guardianUrl || `/dashboard`;
  const emergency = `/emergency`;
  switch (input.kind) {
    case "sos":
      return {
        title: "🚨 RESQORA Emergency",
        body: `${name} has activated Emergency SOS.${input.detail ? `\n${input.detail}` : ""}\nTap to open the Guardian Dashboard.`,
        url: guardian,
        tag: `sos-${input.emergencyId}`,
        kind: "sos",
      };
    case "guardian":
      return {
        title: "🚨 RESQORA Guardian Alert",
        body: `You are the Guardian for ${name}. Tap to open the Guardian Dashboard and follow their live location.`,
        url: guardian,
        tag: `guardian-${input.emergencyId}`,
        kind: "guardian",
      };
    case "tracking":
      return {
        title: "📍 RESQORA Live Tracking Started",
        body: `${name}'s live location is now being shared with trusted contacts.${input.detail ? `\n${input.detail}` : ""}`,
        url: emergency,
        tag: `tracking-${input.emergencyId}`,
        kind: "tracking",
      };
    case "resolved":
    default:
      return {
        title: "✅ RESQORA Emergency Resolved",
        body: `${name} is marked safe. Live sharing has stopped and contacts were informed.`,
        url: emergency,
        tag: `resolved-${input.emergencyId}`,
        kind: "resolved",
      };
  }
}
