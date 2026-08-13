import { supabase } from "@/integrations/supabase/client";

const BUCKET = "accident-media";
export const MAX_MEDIA_BYTES = 60 * 1024 * 1024;

export type AccidentMediaUpload = {
  status: "uploaded" | "failed" | "skipped";
  path: string | null;
  message?: string;
};

function extensionFor(file: Blob, kind: "photo" | "video") {
  const type = file.type.split(";")[0] ?? "";
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "video/webm": "webm",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
  };
  return map[type] ?? (kind === "video" ? "webm" : "jpg");
}

/**
 * Stores the real captured file in the private accident-media bucket and keeps a
 * row describing the incident, GPS fix, address and upload status.
 */
export async function uploadAccidentMedia(input: {
  userId: string | undefined;
  incidentId: string;
  file: Blob;
  kind: "photo" | "video";
  coords: { lat: number; lng: number } | null;
  address: string | null;
  capturedAt: Date;
}): Promise<AccidentMediaUpload> {
  if (!input.userId)
    return {
      status: "skipped",
      path: null,
      message: "Sign in to save this photo or video to your incident record.",
    };
  if (input.file.size === 0)
    return { status: "failed", path: null, message: "The captured file was empty." };
  if (input.file.size > MAX_MEDIA_BYTES)
    return {
      status: "failed",
      path: null,
      message: "That file is larger than 60 MB — record a shorter clip.",
    };

  const path = `${input.userId}/${input.incidentId}.${extensionFor(input.file, input.kind)}`;
  const row = {
    user_id: input.userId,
    incident_id: input.incidentId,
    media_type: input.kind,
    storage_path: path,
    mime_type: input.file.type || null,
    size_bytes: input.file.size,
    latitude: input.coords?.lat ?? null,
    longitude: input.coords?.lng ?? null,
    address: input.address,
    captured_at: input.capturedAt.toISOString(),
    upload_status: "pending" as const,
  };

  const inserted = await supabase.from("accident_media").insert(row).select("id").maybeSingle();

  const { error } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    contentType: input.file.type || undefined,
    upsert: true,
  });

  if (error) {
    if (inserted.data?.id)
      await supabase
        .from("accident_media")
        .update({ upload_status: "failed" })
        .eq("id", inserted.data.id);
    return { status: "failed", path: null, message: error.message };
  }

  if (inserted.data?.id)
    await supabase
      .from("accident_media")
      .update({ upload_status: "uploaded" })
      .eq("id", inserted.data.id);

  return { status: "uploaded", path };
}

/** Short-lived private URL — accident media is never publicly readable. */
export async function accidentMediaUrl(path: string, seconds = 600) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}
