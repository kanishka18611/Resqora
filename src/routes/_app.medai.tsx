import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  ImagePlus,
  Info,
  Loader2,
  Mic,
  MicOff,
  Send,
  ShieldCheck,
  Square,
  Stethoscope,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LanguageSelector } from "@/components/medai/language-selector";
import { MedAiHistoryPanel } from "@/components/medai/history-panel";
import { MedAiMessage, type MedAiBubble } from "@/components/medai/medai-message";
import { mapsHref } from "@/lib/maps";
import { HospitalRecommendations } from "@/components/medai/hospital-recommendations";
import { FirstAidChecklist } from "@/components/medai/first-aid-checklist";
import { useAuth } from "@/hooks/use-auth";
import { useLivePosition } from "@/hooks/use-live-position";
import { useNearbyServices } from "@/hooks/use-nearby-services";
import { useMedAiVoice } from "@/hooks/use-medai-voice";
import { profileQuery } from "@/lib/api";
import { askMedAi } from "@/lib/medai.functions";
import type { MedAiAssessment } from "@/lib/medai.server";
import {
  MEDAI_DISCLAIMER,
  appendMessage,
  categoryForSpecialist,
  conversationMessagesQuery,
  conversationsQuery,
  createConversation,
  deleteAllConversations,
  deleteConversation,
  firstAidLibrary,
  languages,
  quickSymptoms,
  rowsToMessages,
  touchConversation,
  type LanguageCode,
} from "@/lib/medai";

export const Route = createFileRoute("/_app/medai")({
  head: () => ({
    meta: [
      { title: "RESQORA MedAI — Emergency Medical Assistant" },
      {
        name: "description",
        content:
          "RESQORA MedAI assesses emergency symptoms in English, Hindi and Telugu, gives step-by-step first aid, recommends the right specialist and finds hospitals near you.",
      },
      { property: "og:title", content: "RESQORA MedAI — Emergency Medical Assistant" },
      {
        property: "og:description",
        content:
          "Voice or text emergency triage with first-aid checklists, specialist recommendations and nearby hospitals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MedAiPage,
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function MedAiPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useQuery(profileQuery(user?.id));
  const { position } = useLivePosition();
  const nearby = useNearbyServices(position);

  const [language, setLanguage] = useState<LanguageCode>("en");
  const [shareHistory, setShareHistory] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<MedAiBubble[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [latest, setLatest] = useState<MedAiAssessment | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const meta = languages[language];
  const voice = useMedAiVoice(meta.locale);
  const conversations = useQuery(conversationsQuery(user?.id));
  const storedMessages = useQuery(conversationMessagesQuery(conversationId));

  useEffect(() => {
    if (voice.transcript) setInput(voice.transcript);
  }, [voice.transcript]);

  useEffect(() => {
    if (voice.error) toast.error(voice.error);
  }, [voice.error]);

  // Rehydrate a stored conversation the user re-opened from history.
  useEffect(() => {
    if (!conversationId || !storedMessages.data) return;
    setBubbles(
      rowsToMessages(storedMessages.data).map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        hasImage: message.hasImage,
        assessment:
          message.role === "assistant" && message.urgency
            ? ({
                reply: message.content,
                possibleCause: null,
                immediateSteps: [],
                whenToSeekCare: null,
                followUpQuestion: null,
                urgency: message.urgency,
                urgencyReason: "",
                specialist: message.specialist ?? null,
                specialistReason: null,
                firstAid: [],
                redFlags: [],
                emergency: message.urgency === "critical",
                imageObservation: null,
                title: "",
              } satisfies MedAiAssessment)
            : null,
      })),
    );
  }, [conversationId, storedMessages.data]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [bubbles, sending]);

  const medicalContext = useMemo(() => {
    if (!shareHistory || !profile.data) return null;
    const p = profile.data;
    const parts = [
      p.blood_group ? `Blood group: ${p.blood_group}` : null,
      p.allergies ? `Allergies: ${p.allergies}` : null,
      p.medical_conditions ? `Conditions: ${p.medical_conditions}` : null,
      p.medications ? `Medications: ${p.medications}` : null,
      p.date_of_birth ? `Date of birth: ${p.date_of_birth}` : null,
      p.gender ? `Gender: ${p.gender}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join("\n").slice(0, 2000) : null;
  }, [shareHistory, profile.data]);

  const hospitalCategory = categoryForSpecialist(latest?.specialist ?? null);
  const hospitals = nearby.data[hospitalCategory] ?? [];

  function startNewConversation() {
    voice.stopSpeaking();
    setConversationId(null);
    setBubbles([]);
    setLatest(null);
    setInput("");
    setImage(null);
  }

  async function pickImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("That image is larger than 5 MB — please pick a smaller photo.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read-failed"));
      reader.readAsDataURL(file);
    }).catch(() => null);
    if (!dataUrl) {
      toast.error("We couldn't read that image. Try another one.");
      return;
    }
    setImage({ dataUrl, name: file.name });
  }

  async function send(rawText?: string) {
    const text = (rawText ?? input).trim();
    if (!text && !image) return;
    if (!user) {
      toast.error("Please sign in to use MedAI.");
      return;
    }
    if (voice.listening) voice.stopListening();

    const prompt = text || "Please look at this photo and tell me what to do.";
    const userBubble: MedAiBubble = {
      id: `local-${Date.now()}`,
      role: "user",
      content: prompt,
      hasImage: Boolean(image),
      imagePreview: image?.dataUrl ?? null,
    };
    const history = bubbles.map((bubble) => ({ role: bubble.role, content: bubble.content }));

    setBubbles((prev) => [...prev, userBubble]);
    setInput("");
    voice.clearTranscript();
    const attached = image;
    setImage(null);
    setSending(true);

    let assessment: MedAiAssessment;
    try {
      assessment = await askMedAi({
        data: {
          language,
          message: prompt,
          history,
          imageDataUrl: attached?.dataUrl ?? null,
          medicalContext,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "MedAI could not answer right now.";
      toast.error(message);
      setBubbles((prev) => prev.filter((bubble) => bubble.id !== userBubble.id));
      setInput(prompt);
      setSending(false);
      return;
    }

    setBubbles((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}-a`,
        role: "assistant",
        content: assessment.reply,
        assessment,
      },
    ]);
    setLatest(assessment);
    setSending(false);

    // Persist the exchange so the user can review or continue it later. A
    // storage failure must never discard guidance already on screen.
    try {
      let id = conversationId;
      if (!id) {
        const conversation = await createConversation({
          userId: user.id,
          language,
          title: assessment.title || prompt.slice(0, 60),
          sharedMedicalHistory: Boolean(medicalContext),
        });
        id = conversation.id;
        setConversationId(id);
      }
      await appendMessage({
        conversationId: id,
        userId: user.id,
        role: "user",
        content: prompt,
        hasImage: Boolean(attached),
      });
      await appendMessage({
        conversationId: id,
        userId: user.id,
        role: "assistant",
        content: assessment.reply,
        urgency: assessment.urgency,
        specialist: assessment.specialist,
      });
      await touchConversation({
        conversationId: id,
        urgency: assessment.urgency,
        specialist: assessment.specialist,
        language,
        title: assessment.title || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["medai-conversations"] });
    } catch (error) {
      console.error("MedAI history save failed", error);
      toast.error("This answer could not be saved to your history.");
    }
  }

  async function removeConversation(id: string) {
    try {
      await deleteConversation(id);
      if (id === conversationId) startNewConversation();
      await queryClient.invalidateQueries({ queryKey: ["medai-conversations"] });
      toast.success("Consultation deleted.");
    } catch {
      toast.error("Could not delete that consultation.");
    }
  }

  async function clearHistory() {
    if (!user) return;
    try {
      await deleteAllConversations(user.id);
      startNewConversation();
      await queryClient.invalidateQueries({ queryKey: ["medai-conversations"] });
      toast.success("All consultation history deleted.");
    } catch {
      toast.error("Could not delete your history.");
    }
  }

  return (
    <>
      <PageHeader
        icon={Stethoscope}
        title="RESQORA MedAI"
        description="Emergency symptom assessment, first aid and specialist guidance — in English, Hindi or Telugu."
      />

      <p className="mb-4 flex items-start gap-2 rounded-2xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {MEDAI_DISCLAIMER}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <LanguageSelector value={language} onChange={setLanguage} />

          <div className="glass-panel flex min-h-[520px] flex-col rounded-2xl p-4">
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {bubbles.length === 0 && (
                <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Stethoscope className="size-4 text-primary" aria-hidden="true" /> RESQORA MedAI
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{meta.greeting}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickSymptoms.map((symptom) => (
                      <Button
                        key={symptom.id}
                        size="sm"
                        variant="outline"
                        className="h-10 rounded-xl"
                        disabled={sending}
                        onClick={() => send(symptom.prompt)}
                      >
                        <span aria-hidden="true">{symptom.emoji}</span> {symptom.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {bubbles.map((bubble) => (
                  <motion.div
                    key={bubble.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <MedAiMessage
                      message={bubble}
                      onSpeak={voice.ttsSupported ? voice.speak : undefined}
                      onActivateSos={() => navigate({ to: "/emergency", search: { auto: true } })}
                      hospitalNavigateUrl={hospitals[0] ? mapsHref(hospitals[0], "navigate") : null}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {sending && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> MedAI is assessing…
                </p>
              )}
              <div ref={endRef} />
            </div>

            <div className="mt-4 space-y-2 border-t border-border pt-3">
              {image && (
                <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2">
                  <img
                    src={image.dataUrl}
                    alt="Selected photo preview"
                    className="size-12 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {image.name}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => setImage(null)}
                    aria-label="Remove photo"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}

              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={meta.placeholder}
                rows={2}
                className="rounded-xl"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
              />

              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    void pickImage(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="size-11 shrink-0"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Attach a photo of the injury"
                >
                  <ImagePlus className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant={voice.listening ? "destructive" : "outline"}
                  className="size-11 shrink-0"
                  disabled={!voice.supported || voice.micState === "denied"}
                  onClick={() =>
                    voice.listening ? voice.stopListening() : void voice.startListening()
                  }
                  aria-label={voice.listening ? "Stop voice input" : "Speak your symptoms"}
                >
                  {voice.listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
                {voice.speaking && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-11 shrink-0"
                    onClick={voice.stopSpeaking}
                    aria-label="Stop reading aloud"
                  >
                    <Square className="size-4" />
                  </Button>
                )}
                <Button
                  className="h-11 flex-1"
                  disabled={sending || (!input.trim() && !image)}
                  onClick={() => void send()}
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Ask MedAI
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <Label htmlFor="medai-share" className="text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5" aria-hidden="true" /> Share my medical profile
                  with MedAI
                </Label>
                <Switch
                  id="medai-share"
                  checked={shareHistory}
                  onCheckedChange={setShareHistory}
                  aria-label="Share medical history with MedAI"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <HospitalRecommendations
            hospitals={hospitals}
            specialist={latest?.specialist ?? null}
            loading={nearby.isLoading}
          />

          <MedAiHistoryPanel
            conversations={conversations.data ?? []}
            activeId={conversationId}
            onSelect={setConversationId}
            onDelete={(id) => void removeConversation(id)}
            onNew={startNewConversation}
            onClearAll={() => void clearHistory()}
          />

          <div className="glass-panel rounded-2xl p-4">
            <h2 className="text-sm font-semibold">First-aid library</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap a situation for an offline checklist you can follow immediately.
            </p>
            <div className="mt-3 space-y-2">
              {firstAidLibrary.map((topic) => (
                <details key={topic.id} className="rounded-xl border border-border/60 bg-card/50">
                  <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium">
                    <span aria-hidden="true">{topic.emoji}</span> {topic.title}
                  </summary>
                  <div className="px-2 pb-2">
                    <FirstAidChecklist steps={topic.steps} title={topic.title} />
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
