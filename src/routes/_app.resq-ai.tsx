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
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LanguageSelector } from "@/components/medai/language-selector";
import { HospitalRecommendations } from "@/components/medai/hospital-recommendations";
import { ResqAvatar } from "@/components/resqai/resq-avatar";
import { ResqAiMessage, type ResqBubble } from "@/components/resqai/resqai-message";
import { ResqChatHistory } from "@/components/resqai/chat-history";
import { ResqWelcomeScreen } from "@/components/resqai/welcome-screen";
import { TypingDots } from "@/components/resqai/typing-dots";
import { VoiceWave } from "@/components/resqai/voice-wave";
import { mapsHref, viewUrl } from "@/lib/maps";
import { useAuth } from "@/hooks/use-auth";
import { useLivePosition } from "@/hooks/use-live-position";
import { useNearbyServices } from "@/hooks/use-nearby-services";
import { useMedAiVoice } from "@/hooks/use-medai-voice";
import { MicStatus } from "@/components/resqai/mic-status";
import { profileQuery } from "@/lib/api";
import { askMedAi } from "@/lib/medai.functions";
import type { MedAiAssessment } from "@/lib/medai.server";
import {
  appendMessage,
  categoryForSpecialist,
  conversationMessagesQuery,
  conversationsQuery,
  createConversation,
  deleteAllConversations,
  deleteConversation,
  languages,
  rowsToMessages,
  touchConversation,
  type LanguageCode,
} from "@/lib/medai";
import {
  RESQ_AI_DISCLAIMER,
  RESQ_AI_TAGLINE,
  findFirstAidTopic,
  setConversationFavourite,
} from "@/lib/resqai";

export const Route = createFileRoute("/_app/resq-ai")({
  head: () => ({
    meta: [
      { title: "RESQ AI — Your AI Emergency Medical Assistant" },
      {
        name: "description",
        content:
          "RESQ AI is RESQORA's voice-enabled emergency medical assistant: symptom triage, first-aid step cards, specialist advice and nearby hospitals in English, Hindi and Telugu.",
      },
      { property: "og:title", content: "RESQ AI — Your AI Emergency Medical Assistant" },
      {
        property: "og:description",
        content:
          "Talk or type to RESQ AI for triage, guided first aid, emergency actions and hospital recommendations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResqAiPage,
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const now = () => new Date().toISOString();

function ResqAiPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useQuery(profileQuery(user?.id));
  const { position } = useLivePosition();
  const nearby = useNearbyServices(position);

  const [language, setLanguage] = useState<LanguageCode>("en");
  const [shareProfile, setShareProfile] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<ResqBubble[]>([]);
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

  // Rehydrate a stored chat the user re-opened from Recent chats.
  useEffect(() => {
    if (!conversationId || !storedMessages.data) return;
    setBubbles(
      rowsToMessages(storedMessages.data).map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt ?? now(),
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
    if (!shareProfile || !profile.data) return null;
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
  }, [shareProfile, profile.data]);

  const hospitals = nearby.data[categoryForSpecialist(latest?.specialist ?? null)] ?? [];
  const hospitalNavigateUrl = hospitals[0] ? mapsHref(hospitals[0], "navigate") : null;

  function startNewChat() {
    voice.stopSpeaking();
    setConversationId(null);
    setBubbles([]);
    setLatest(null);
    setInput("");
    setImage(null);
  }

  async function shareLiveLocation() {
    if (!position) {
      toast.error("Location is not available yet — enable location access first.");
      return;
    }
    const link = viewUrl(position.lat, position.lng);
    const text = `RESQORA emergency — my live location: ${link}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "RESQORA live location", text, url: link });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Location link copied — paste it to your contact.");
    } catch {
      toast.error("Could not share your location link.");
    }
  }

  function openFirstAid(topicId: string) {
    const topic = findFirstAidTopic(topicId);
    if (!topic) return;
    setBubbles((prev) => [
      ...prev,
      {
        id: `first-aid-${topicId}-${Date.now()}`,
        role: "assistant",
        content: `**${topic.title} — first aid**\n\nFollow these steps in order. Ask me anything about this situation and I'll adapt the guidance to the patient.`,
        createdAt: now(),
        assessment: {
          reply: "",
          possibleCause: null,
          immediateSteps: [],
          whenToSeekCare: null,
          followUpQuestion: `Tell me what you can see right now — is the person conscious and breathing?`,
          urgency: topic.urgency,
          urgencyReason: "Offline first-aid guidance from the RESQORA library.",
          specialist: topic.specialist,
          specialistReason: null,
          firstAid: topic.steps,
          redFlags: [],
          emergency: topic.urgency === "critical",
          imageObservation: null,
          title: topic.title,
        },
      },
    ]);
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
      toast.error("Please sign in to use RESQ AI.");
      return;
    }
    if (voice.listening) voice.stopListening();

    const prompt = text || "Please look at this photo and tell me what to do.";
    const userBubble: ResqBubble = {
      id: `local-${Date.now()}`,
      role: "user",
      content: prompt,
      createdAt: now(),
      hasImage: Boolean(image),
      imagePreview: image?.dataUrl ?? null,
    };
    const history = bubbles
      .filter((bubble) => bubble.content.trim().length > 0)
      .map((bubble) => ({ role: bubble.role, content: bubble.content }));

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
          history: history.slice(-12),
          imageDataUrl: attached?.dataUrl ?? null,
          medicalContext,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "RESQ AI could not answer right now.";
      toast.error(message);
      setBubbles((prev) => prev.filter((bubble) => bubble.id !== userBubble.id));
      setInput(prompt);
      setSending(false);
      return;
    }

    setBubbles((prev) => [
      ...prev.map((bubble) => ({ ...bubble, stream: false })),
      {
        id: `local-${Date.now()}-a`,
        role: "assistant",
        content: assessment.reply,
        createdAt: now(),
        assessment,
        stream: true,
      },
    ]);
    setLatest(assessment);
    setSending(false);
    if (autoSpeak && voice.ttsSupported) voice.speak(assessment.reply);

    // Persist the exchange. A storage failure must never discard guidance
    // already on screen.
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
      console.error("RESQ AI history save failed", error);
      toast.error("This answer could not be saved to your chat history.");
    }
  }

  async function removeConversation(id: string) {
    try {
      await deleteConversation(id);
      if (id === conversationId) startNewChat();
      await queryClient.invalidateQueries({ queryKey: ["medai-conversations"] });
      toast.success("Chat deleted.");
    } catch {
      toast.error("Could not delete that chat.");
    }
  }

  async function toggleFavourite(id: string, next: boolean) {
    try {
      await setConversationFavourite(id, next);
      await queryClient.invalidateQueries({ queryKey: ["medai-conversations"] });
    } catch {
      toast.error("Could not update favourites.");
    }
  }

  async function clearHistory() {
    if (!user) return;
    try {
      await deleteAllConversations(user.id);
      startNewChat();
      await queryClient.invalidateQueries({ queryKey: ["medai-conversations"] });
      toast.success("All chats deleted.");
    } catch {
      toast.error("Could not delete your chats.");
    }
  }

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="RESQ AI"
        description={`${RESQ_AI_TAGLINE} — voice or text triage, guided first aid and emergency actions in English, Hindi and Telugu.`}
      />

      <p className="mb-4 flex items-start gap-2 rounded-2xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {RESQ_AI_DISCLAIMER}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <ResqAvatar size={44} pulse={sending} />
            <div className="min-w-0 flex-1">
              <LanguageSelector value={language} onChange={setLanguage} />
            </div>
          </div>

          <div className="glass-panel flex min-h-[560px] flex-col rounded-2xl p-4">
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {bubbles.length === 0 ? (
                <ResqWelcomeScreen
                  language={language}
                  disabled={sending}
                  onAsk={(prompt) => void send(prompt)}
                  onFirstAid={openFirstAid}
                />
              ) : null}

              <AnimatePresence initial={false}>
                {bubbles.map((bubble) => (
                  <motion.div
                    key={bubble.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ResqAiMessage
                      message={bubble}
                      onSpeak={voice.ttsSupported ? voice.speak : undefined}
                      onActivateSos={() => navigate({ to: "/emergency", search: { auto: true } })}
                      onShareLocation={() => void shareLiveLocation()}
                      hospitalNavigateUrl={hospitalNavigateUrl}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {sending && <TypingDots />}
              <div ref={endRef} />
            </div>

            <div className="mt-4 space-y-2 border-t border-border pt-3">
              {voice.listening && <VoiceWave label="Listening — speak now" />}

              {voice.supported ? (
                <MicStatus
                  state={voice.micState}
                  error={voice.micError}
                  onEnable={() => void voice.requestMic()}
                />
              ) : null}

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
                  aria-label={voice.listening ? "Stop listening" : "Start listening"}
                >
                  {voice.listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
                <Button
                  size="icon"
                  variant={autoSpeak ? "default" : "outline"}
                  className="size-11 shrink-0"
                  disabled={!voice.ttsSupported}
                  onClick={() => {
                    if (autoSpeak) voice.stopSpeaking();
                    setAutoSpeak((prev) => !prev);
                  }}
                  aria-pressed={autoSpeak}
                  aria-label={autoSpeak ? "Mute spoken replies" : "Speak replies aloud"}
                >
                  {autoSpeak ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                </Button>
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
                  Ask RESQ AI
                </Button>
              </div>

              {!voice.supported && (
                <p className="text-xs text-muted-foreground">
                  Voice input isn’t supported in this browser — type your question instead.
                </p>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <Label htmlFor="resqai-share" className="text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5" aria-hidden="true" /> Share my medical profile
                  with RESQ AI
                </Label>
                <Switch
                  id="resqai-share"
                  checked={shareProfile}
                  onCheckedChange={setShareProfile}
                  aria-label="Share medical profile with RESQ AI"
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

          <ResqChatHistory
            conversations={conversations.data ?? []}
            activeId={conversationId}
            onSelect={setConversationId}
            onDelete={(id) => void removeConversation(id)}
            onToggleFavourite={(id, next) => void toggleFavourite(id, next)}
            onNew={startNewChat}
            onClearAll={() => void clearHistory()}
          />
        </div>
      </div>
    </>
  );
}
