import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { GuardianView } from "@/lib/guardian-view";
import { statusLabel, formatDuration } from "@/lib/emergency";

/** Printable/shareable handover card a Guardian gives to hospital staff. */
export function handoverLines(view: GuardianView, dashboardUrl: string) {
  const coords =
    view.latitude != null && view.longitude != null
      ? `${view.latitude.toFixed(6)}, ${view.longitude.toFixed(6)}`
      : "Awaiting GPS";
  return [
    ["Emergency ID", view.reference],
    ["Person", `${view.full_name}${view.age != null ? ` · ${view.age} yrs` : ""}`],
    ["Blood group", view.blood_group || "Not recorded"],
    ["Critical allergies", view.allergies || "None recorded"],
    ["Medical conditions", view.medical_conditions || "None recorded"],
    ["Current medicines", view.medications || "None recorded"],
    ["Guardian", `${view.guardian_name}${view.guardian_phone ? ` · ${view.guardian_phone}` : ""}`],
    ["Current status", statusLabel(view.status)],
    ["Emergency type", `${view.type} · severity ${view.severity}`],
    [
      "Recommended hospital",
      view.preferred_hospital || view.ai_recommendation || "Nearest trauma centre",
    ],
    ["Current address", view.address || "Address unavailable"],
    ["GPS", coords],
    ["Started", new Date(view.started_at).toLocaleString()],
    [
      "Duration",
      formatDuration(
        view.duration_seconds ??
          Math.round((Date.now() - new Date(view.started_at).getTime()) / 1000),
      ),
    ],
    [
      "Last updated",
      view.location_updated_at ? new Date(view.location_updated_at).toLocaleString() : "—",
    ],
    ["Live dashboard", dashboardUrl],
  ];
}

export function handoverText(view: GuardianView, dashboardUrl: string) {
  return [
    `🚨 RESQORA emergency handover — ${view.reference}`,
    ...handoverLines(view, dashboardUrl).map(([label, value]) => `${label}: ${value}`),
    "",
    "Emergency timeline:",
    ...view.timeline
      .slice(-10)
      .map((e) => `• ${new Date(e.created_at).toLocaleTimeString()} — ${e.label}`),
  ].join("\n");
}

export function exportHandoverPdf(view: GuardianView, dashboardUrl: string) {
  const doc = new jsPDF();
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("RESQORA", 14, 12);
  doc.setFontSize(10);
  doc.text(`Emergency handover card — ${view.reference}`, 14, 20);
  doc.setTextColor(90, 90, 90);
  doc.setFontSize(9);
  doc.text(`Prepared by Guardian ${view.guardian_name} · ${new Date().toLocaleString()}`, 14, 34);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 40,
    head: [["Field", "Value"]],
    body: handoverLines(view, dashboardUrl),
    theme: "striped",
    headStyles: { fillColor: [220, 38, 38] },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  autoTable(doc, {
    head: [["Time", "Event", "Detail"]],
    body: view.timeline.length
      ? view.timeline.map((e) => [
          new Date(e.created_at).toLocaleString(),
          e.label,
          e.detail ?? "—",
        ])
      : [["—", "No events recorded", "—"]],
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  if (view.guardian_notes.length) {
    autoTable(doc, {
      head: [["Guardian note", "By", "Time"]],
      body: view.guardian_notes.map((n) => [
        n.note,
        n.guardian_name,
        new Date(n.created_at).toLocaleString(),
      ]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8, cellPadding: 2 },
    });
  }

  doc.save(`resqora-handover-${view.reference}.pdf`);
}
