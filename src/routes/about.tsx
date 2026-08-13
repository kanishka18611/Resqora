import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  AlarmClock,
  Ambulance,
  BellRing,
  Bot,
  Building2,
  Camera,
  Clock3,
  Compass,
  Droplets,
  Flame,
  Gauge,
  History,
  KeyRound,
  Lock,
  Mail,
  MapPinned,
  Mic,
  Navigation,
  PhoneCall,
  QrCode,
  Radar,
  Rocket,
  ScanLine,
  Share2,
  Shield,
  ShieldCheck,
  Siren,
  Smartphone,
  Sparkles,
  Stethoscope,
  Target,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About RESQORA — AI emergency response platform" },
      {
        name: "description",
        content:
          "What RESQORA is, how it works and every feature explained: SOS, guardian dashboard, live tracking, AI medical assistant, RESQR ID, nearby hospitals, police, fire and blood banks.",
      },
      {
        property: "og:title",
        content: "About RESQORA — Every Second Matters. Every Life Connected.",
      },
      {
        property: "og:description",
        content:
          "A complete product overview of the RESQORA emergency response platform, feature by feature.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const WHY = [
  {
    icon: Clock3,
    title: "Seconds decide outcomes",
    body: "In cardiac arrest, severe bleeding or a road accident, survival is measured in minutes. RESQORA removes every avoidable step between the emergency and real help.",
  },
  {
    icon: Gauge,
    title: "One tap, complete handover",
    body: "Identity, medical history, exact coordinates, live tracking link and severity all travel together — nobody has to ask questions you cannot answer.",
  },
  {
    icon: Shield,
    title: "It works when you cannot",
    body: "Crash detection, voice SOS and missed safety check-ins escalate on your behalf, even if the phone is out of reach.",
  },
] as const;

const WORKFLOW = [
  {
    label: "SOS triggered",
    body: "One tap, a voice command, or an automatic crash-detection countdown.",
  },
  {
    label: "Location captured",
    body: "GPS coordinates, accuracy and a resolved street address attach to the alert.",
  },
  {
    label: "AI assessment",
    body: "Severity is scored, priority set and the right responder categories chosen.",
  },
  {
    label: "People notified",
    body: "Guardian and trusted contacts receive push, email and WhatsApp alerts with a live map link.",
  },
  {
    label: "Emergency active",
    body: "Live tracking refreshes every 10 seconds with telemetry and status updates.",
  },
  { label: "Resolved", body: "A timestamped summary is written to your history and activity log." },
] as const;

type Feature = {
  icon: typeof Siren;
  name: string;
  purpose: string;
  how: string;
  benefit: string;
};

const FEATURES: Feature[] = [
  {
    icon: Siren,
    name: "Emergency SOS",
    purpose: "Raise a full emergency in a single tap.",
    how: "A countdown creates the emergency record, captures GPS, resolves the address and fires every alert channel at once.",
    benefit: "Help is requested even if you can only manage one movement.",
  },
  {
    icon: ShieldCheck,
    name: "Guardian Dashboard",
    purpose: "Give one trusted person a real command centre.",
    how: "Your guardian receives a secure session link opening a live dashboard with your position, telemetry, medical basics and timeline.",
    benefit: "Someone who loves you can coordinate while you focus on surviving.",
  },
  {
    icon: Radar,
    name: "Live Tracking",
    purpose: "Let responders follow you in real time.",
    how: "Location pings every 10 seconds feed a public token link that needs no app or account to open.",
    benefit: "Nobody searches the wrong street while you wait.",
  },
  {
    icon: Users,
    name: "Emergency Contacts",
    purpose: "Notify the people who will act immediately.",
    how: "Up to three ranked contacts, one flagged as guardian, each stored with name, relationship and phone.",
    benefit: "Your alert reaches humans, not just services.",
  },
  {
    icon: Mail,
    name: "Email Alerts",
    purpose: "Deliver a complete written alert.",
    how: "Every contact receives an email with your identity, medical summary, coordinates, address and tracking link, with retry on failure.",
    benefit: "A permanent, forwardable record of the emergency.",
  },
  {
    icon: Share2,
    name: "WhatsApp & Native Share",
    purpose: "Reach anyone on the channel they actually read.",
    how: "Pre-filled WhatsApp messages and the Web Share API carry your live link to any chat or app.",
    benefit: "Faster than typing an address while in pain.",
  },
  {
    icon: Building2,
    name: "Nearby Hospitals",
    purpose: "Reach the right hospital, not just the closest.",
    how: "Live place data is filtered towards trauma and emergency-capable facilities, ranked by distance and driving ETA.",
    benefit: "You arrive somewhere that can actually treat the injury.",
  },
  {
    icon: Shield,
    name: "Nearby Police Stations",
    purpose: "Escalate crime, harassment or unsafe situations.",
    how: "The nearest stations are listed with distance, ETA, one-tap calling and navigation.",
    benefit: "Authority is one tap away in a threatening moment.",
  },
  {
    icon: Flame,
    name: "Nearby Fire Stations",
    purpose: "Handle fire, gas leaks and rescue situations.",
    how: "Fire services near your live position are surfaced automatically alongside call and route actions.",
    benefit: "No searching for numbers while smoke spreads.",
  },
  {
    icon: Droplets,
    name: "Blood Banks & Donor Network",
    purpose: "Find blood fast during trauma or surgery.",
    how: "Nearby blood banks plus a searchable donor directory by blood group and city, with an availability switch you control.",
    benefit: "Critical transfusions start hours sooner.",
  },
  {
    icon: Ambulance,
    name: "Ambulance Services",
    purpose: "Get transport moving immediately.",
    how: "Ambulance providers appear as their own responder category with direct dialling.",
    benefit: "Movement towards care begins before anyone arrives on scene.",
  },
  {
    icon: Stethoscope,
    name: "AI Medical Assistant (MedAI)",
    purpose: "Ask a medical question and get safe, structured guidance.",
    how: "Conversational triage in English, Hindi and Telugu returns possible cause, immediate steps, first aid, when to seek emergency care and a recommended specialist.",
    benefit: "Confident action instead of panicked guessing.",
  },
  {
    icon: Mic,
    name: "Voice SOS & Voice Input",
    purpose: "Use the platform hands-free.",
    how: "Speech recognition captures your description and spoken answers; replies can be read aloud in your language.",
    benefit: "Works with injured hands, poor light or low literacy.",
  },
  {
    icon: Bot,
    name: "AI Emergency Assessment",
    purpose: "Turn a description into a triage decision.",
    how: "Guided questions and free text produce an emergency type, severity, confidence score and recommended response.",
    benefit: "Responders receive a structured briefing, not a vague call.",
  },
  {
    icon: Camera,
    name: "Report Accident",
    purpose: "Let the camera do the explaining.",
    how: "A photo or short clip is analysed for situation type and severity, returning a medical report, first aid and specialist hospitals.",
    benefit: "Bystanders can help competently within seconds.",
  },
  {
    icon: Sparkles,
    name: "Emergency Severity Detection",
    purpose: "Prioritise the worst cases correctly.",
    how: "Scene analysis, symptoms and answers combine into a graded urgency level that drives which responders are coordinated.",
    benefit: "Critical emergencies never look routine.",
  },
  {
    icon: Stethoscope,
    name: "Medical Profile",
    purpose: "Keep the facts treatment depends on ready.",
    how: "Blood group, allergies, conditions, medications, date of birth, preferred hospital and language, stored privately to your account.",
    benefit: "Clinicians avoid dangerous assumptions.",
  },
  {
    icon: KeyRound,
    name: "RESQR ID",
    purpose: "Identify you when you cannot speak.",
    how: "Every account gets a unique code with a printable wallet card; the QR holds only that code, never your personal data.",
    benefit: "Anyone can help you correctly, with no privacy leak.",
  },
  {
    icon: QrCode,
    name: "QR Emergency Summary",
    purpose: "Deliver essentials to a responder in seconds.",
    how: "Scanning the RESQR code opens a summary with blood group, age, allergies, medicines, conditions, guardian and preferred hospital, plus quick emergency actions.",
    benefit: "Immediate context at the roadside.",
  },
  {
    icon: ScanLine,
    name: "Built-in Scanner",
    purpose: "Read someone else's RESQR ID on the spot.",
    how: "The in-app camera scanner decodes a code and opens their emergency summary instantly.",
    benefit: "You can help a stranger like a trained first responder.",
  },
  {
    icon: AlarmClock,
    name: "Safety Check-in",
    purpose: "Protect yourself during risky journeys.",
    how: "Start a timer before a walk home; miss the confirmation and RESQORA escalates to the full SOS workflow.",
    benefit: "Silence itself becomes a call for help.",
  },
  {
    icon: History,
    name: "Emergency Timeline & History",
    purpose: "Know exactly what happened, when.",
    how: "Every trigger, alert, status change and resolution is timestamped in the response timeline and stored in history.",
    benefit: "Clear records for hospitals, insurers and family.",
  },
  {
    icon: Navigation,
    name: "One-Tap Navigation & Maps",
    purpose: "Get moving without typing an address.",
    how: "Official Google Maps links open turn-by-turn driving directions to the exact coordinates on Android, iPhone and desktop.",
    benefit: "No blocked maps, no wrong destination.",
  },
  {
    icon: PhoneCall,
    name: "Emergency Calls",
    purpose: "Dial the right number instantly.",
    how: "One-tap calling for 108, 112 and each listed facility, with a safe fallback when a number is unverified.",
    benefit: "Zero fumbling in the worst moment.",
  },
  {
    icon: Smartphone,
    name: "PWA Installation",
    purpose: "Keep RESQORA on your home screen.",
    how: "Install prompt, splash screen and offline caching make it launch like a native app.",
    benefit: "Instant access without an app store.",
  },
  {
    icon: BellRing,
    name: "Push Notifications",
    purpose: "Never miss an emergency update.",
    how: "Device push delivers SOS events, guardian alerts, check-in reminders and status changes even when the app is closed.",
    benefit: "Your circle reacts within seconds.",
  },
  {
    icon: MapPinned,
    name: "Real-Time Location Intelligence",
    purpose: "Always know where help is needed.",
    how: "A single GPS watcher powers the live location card, nearby services and tracking, refreshing when you move over 100 metres.",
    benefit: "Accurate positioning without draining the battery.",
  },
  {
    icon: Compass,
    name: "Smart Emergency Coordination",
    purpose: "Alert the responders that match the incident.",
    how: "Incident type maps to responder categories, so fire, trauma, crime or medical cases pull the right services automatically.",
    benefit: "The correct help is contacted the first time.",
  },
  {
    icon: Lock,
    name: "Secure Authentication",
    purpose: "Protect a highly sensitive account.",
    how: "Email and Google sign-in with server-verified sessions and audited security events.",
    benefit: "Only you can reach your medical data.",
  },
  {
    icon: ShieldCheck,
    name: "Privacy & Security",
    purpose: "Share only what an emergency requires.",
    how: "Row-level database protection, revocable public tokens, location captured only during an emergency, and a full activity log.",
    benefit: "Life-saving access without surrendering your privacy.",
  },
];

function AboutPage() {
  return (
    <main className="aurora min-h-screen scroll-smooth">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <Link to="/" className="min-w-0">
            <Logo />
          </Link>
          <Button asChild variant="hero" size="sm">
            <Link to="/dashboard">Open RESQORA</Link>
          </Button>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-10 sm:mt-14"
        >
          <Badge variant="secondary" className="rounded-full">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Every Second Matters. Every Life Connected.
          </Badge>
          <h1 className="mt-4 max-w-3xl font-display text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-5xl">
            RESQORA is an AI-powered emergency response platform
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            It keeps everything a responder or a loved one needs — who you are, where you are, what
            care you need — one tap away, and it acts for you when you cannot act for yourself.
            Emergency SOS, AI medical guidance, live tracking, nearby services and a scannable
            medical identity in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="emergency">
              <Link to="/dashboard">
                <Siren className="size-4" />
                Open the console
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/medai">
                <Stethoscope className="size-4" />
                Ask MedAI
              </Link>
            </Button>
          </div>
        </motion.section>

        <hr className="mt-14 border-border/60" />

        <section className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2">
          <article className="glass-panel rounded-3xl p-6 sm:p-7">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Target className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">Our mission</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Make the fastest possible path to help the default for everyone — no training, no
              paperwork and no second thoughts required. Every screen exists to shorten the distance
              between an emergency and competent care.
            </p>
          </article>
          <article className="glass-panel rounded-3xl p-6 sm:p-7">
            <span className="grid size-11 place-items-center rounded-2xl bg-info/10 text-info">
              <Rocket className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">Our vision</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A connected emergency grid where every person carries their medical identity, every
              bystander can act like a first responder, and every alert reaches the right hospital,
              ambulance and family member at the same moment.
            </p>
          </article>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Why RESQORA?
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {WHY.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-panel rounded-3xl p-6"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-alert/10 text-alert">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <hr className="mt-14 border-border/60" />

        <section className="mt-12 sm:mt-14">
          <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            How RESQORA works
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Six stages run automatically from the moment an emergency starts until it is resolved.
          </p>
          <ol className="mt-8 space-y-5 border-l border-border pl-6">
            {WORKFLOW.map((step, index) => (
              <motion.li
                key={step.label}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-[31px] top-1 grid size-4 place-items-center rounded-full border-2 border-background bg-primary"
                />
                <p className="text-sm font-semibold text-foreground">
                  {index + 1}. {step.label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </motion.li>
            ))}
          </ol>
        </section>

        <hr className="mt-14 border-border/60" />

        <section className="mt-12 sm:mt-14">
          <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Feature overview
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Every major capability, what it is for, how it works and what it means when it matters.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <motion.article
                key={feature.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, delay: (index % 3) * 0.04 }}
                className="glass-panel flex h-full flex-col rounded-3xl p-5 sm:p-6"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-base font-semibold text-foreground">{feature.name}</h3>
                <dl className="mt-3 space-y-2.5 text-sm">
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Purpose
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-foreground/90">{feature.purpose}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      How it works
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-muted-foreground">{feature.how}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Real-life benefit
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-muted-foreground">
                      {feature.benefit}
                    </dd>
                  </div>
                </dl>
              </motion.article>
            ))}
          </div>
        </section>

        <hr className="mt-14 border-border/60" />

        <section className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2">
          <article className="glass-panel rounded-3xl p-6 sm:p-7">
            <span className="grid size-11 place-items-center rounded-2xl bg-success/10 text-success">
              <Lock className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
              Privacy & security
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li>
                Your records are row-level protected — only your account can read or write them.
              </li>
              <li>
                Public tracking, guardian and RESQR links use random tokens you can revoke anytime.
              </li>
              <li>Location is captured only while an emergency or check-in is running.</li>
              <li>Sign-ins, SOS events and profile changes are recorded in your activity log.</li>
            </ul>
          </article>
          <article className="glass-panel rounded-3xl p-6 sm:p-7">
            <span className="grid size-11 place-items-center rounded-2xl bg-info/10 text-info">
              <Rocket className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">What's next</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li>Carrier SMS delivery alongside email, push and WhatsApp alerts.</li>
              <li>Direct dispatch handoff to local ambulance and police control rooms.</li>
              <li>Wearable crash and fall sensors feeding the detection engine.</li>
              <li>Hospital bed, blood stock and ambulance ETA availability feeds.</li>
            </ul>
          </article>
        </section>

        <section className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-alert/40 bg-alert/5 p-6 sm:p-8">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground sm:text-2xl">
              <ShieldCheck className="size-5 text-alert" aria-hidden="true" />
              Ready when you are
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything above is one or two taps from your home screen.
            </p>
          </div>
          <Button asChild variant="emergency">
            <Link to="/dashboard">
              <Siren className="size-4" />
              Go to home
            </Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
