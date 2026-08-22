# RESQORA – AI-Powered Emergency Response & Coordination Platform

RESQORA is a progressive web application that empowers users to coordinate emergency response with trusted contacts, access AI-assisted medical guidance, and provide emergency responders with critical information—all in moments of crisis.

---

## Problem Statement

During emergencies, critical time is lost coordinating help:
- **Fragmentation**: Emergency contacts, medical info, location, and emergency services operate in silos
- **Information gaps**: First responders lack context about the person's medical needs or preferences
- **Coordination delays**: Guardians can't track the situation or assist in real-time
- **Accessibility**: Voice and multilingual support is limited in existing platforms
- **Connectivity**: Traditional systems fail when connectivity is interrupted

RESQORA addresses these gaps by connecting the person in crisis with their trusted guardian, emergency contacts, medical context, and nearby services—while supporting offline operation.

---

## Solution

RESQORA creates a unified emergency coordination system:

1. **User initiates emergency** → SOS activation, GPS captured, offline-safe
2. **AI processes context** → Emergency type, severity, injury assessment, hospital matching
3. **Guardian activated** → Secure real-time dashboard with location, medical info, action plan
4. **Contacts notified** → Email, WhatsApp alerts with live tracking link
5. **Services coordinated** → Nearby hospitals, police, fire services contacted
6. **Medical info shared** → RESQR QR code exposes critical info to responders
7. **AI assistance** → Multilingual voice/text guidance for first aid and decisions

---

## Key Features

### 🚨 Emergency SOS
- **Global SOS button** with single tap to activate
- **Automatic GPS capture** (with permission)
- **Offline-first**: Queued if network unavailable; syncs when connectivity restored
- **Immediate guardian notification** with live tracking link
- **Alert broadcast**: Email and WhatsApp notifications to emergency contacts

### 🤖 AI Emergency Coordinator
- **AI-assisted assessment** of emergency type and severity (not medical diagnosis)
- **Decision support**: Contextual action planning and next steps
- **Hospital specialty matching**: Recommends hospitals by medical priority (trauma, cardiac, etc.)
- **First-aid guidance integration**: Connected to AI medical assistant for immediate help
- **Best-effort**: AI failures don't affect the emergency itself

### 🎯 Emergency Digital Twin
- **Live emergency representation**: Captures current emergency state, location, medical context, and action plan
- **Guardian-accessible**: Read-only view for trusted contacts to monitor situation
- **Real-time updates**: Location refreshes, status changes, action plan evolution
- **Decision support**: Not a replacement for human judgment—assists guardians and emergency services

### 👥 Guardian Dashboard
- **Secure access**: Token-based link to emergency data (not authentication-based)
- **Real-time status**: Emergency location, type, severity, and AI-generated action plan
- **Map view**: Live location of person in emergency
- **Medical context**: Blood type, allergies, medications, conditions from RESQR
- **Quick actions**: Call emergency contacts, navigate to person, mark "I'm Safe"
- **Notes & tasks**: Add notes, track recommended actions
- **Handover capability**: Transfer guardian role to another trusted contact
- **Grace period**: Dashboard remains accessible for 30 minutes after emergency resolution

### 🏥 RESQR – Emergency Digital Identity
- **QR code identity**: 40-character opaque code (never exposes medical data in QR)
- **First responder access**: Scan QR to access emergency projection
- **Information exposed**:
  - Name, age, blood type
  - Allergies, medications, medical conditions
  - Guardian contact information
  - Preferred hospital and language
  - **If active emergency**: Current location, emergency type, severity, status
- **Minimal PII**: Only medical care information; name/contact only when emergency active
- **Regenerable**: Can issue new code anytime

### 📋 Medical Profile & Emergency Contacts
- **Digital medical record**: Blood type, allergies, medications, medical conditions
- **Guardian designation**: Designate one trusted contact as primary guardian
- **Emergency contacts**: Multiple contacts with phone/email for alerts
- **Preference settings**: Preferred hospital, preferred language
- **Sharing control**: Control what information is visible to emergency services

### 📍 Live Location & Tracking
- **Real-time GPS**: Continuous location updates during emergency
- **Address resolution**: Reverse geocode GPS to street address for responders
- **Live tracking link**: Guardian and emergency contacts receive link to live map
- **Device context**: Battery level and vehicle speed included in emergency data
- **Accuracy metadata**: Recorded with GPS accuracy radius

### 🏥 Nearby Emergency Services
- **Service discovery**: Find hospitals, police, fire stations, blood banks by location
- **Distance ranking**: Sorted by proximity to emergency location
- **Navigation links**: One-tap navigation to services via maps
- **Hospital specialties**: Filter by medical specialty (trauma, cardiac, neuro, etc.)
- **Integration**: Used to match emergency needs to nearest appropriate facility

### 📸 Accident & Scene Analysis
- **Scene capture**: Take photos or video of accident/incident scene
- **AI analysis**: Detect incident type (vehicle crash, fire, person injured, etc.)
- **Severity assessment**: AI estimates severity (minor to critical)
- **Injury detection**: Identifies possible injuries visible in media
- **Hazard identification**: Identifies hazards (fire, electrical, etc.)
- **Hospital matching**: Recommends specialty based on injuries
- **First aid suggestions**: Contextual first-aid guidance based on situation

### 🗣️ RESQ AI – Multilingual Emergency Assistant
- **Voice & text**: Chat interface supporting voice (speech-to-text) and typing
- **Multilingual**: English, Hindi, Telugu with native speech recognition/synthesis
- **Real-time guidance**: First-aid steps, urgency assessment, specialist recommendations
- **Emergency context**: Can view active emergency in chat
- **Chat history**: Persistent conversation history
- **Disclaimer**: Clear that AI provides guidance, not medical diagnosis

### 💊 MedAI – Medical Guidance Assistant
- **First-aid library**: Offline-accessible first-aid information
- **Urgency assessment**: Rates symptoms as low/moderate/high/critical
- **Specialist recommendations**: Suggests medical specialty needed
- **Multilingual interface**: Language selector for English, Hindi, Telugu
- **Conversation history**: Tracks guidance given during emergency
- **Disclaimer**: Emphasizes limitations and need for professional medical care

### 📊 Activity & Emergency History
- **Emergency timeline**: Full history of past emergencies with dates, types, durations
- **Event log**: Detailed timeline of actions during each emergency
- **Activity tracking**: Logs of sign-ins and platform interactions
- **Duration tracking**: Recorded how long each emergency lasted
- **Admin visibility**: Admin users can view anonymized emergency patterns

### 🗺️ Maps & Navigation
- **Live tracking maps**: Real-time emergency location display
- **Direct navigation**: One-tap route guidance to nearby services
- **Coordinates**: GPS coordinates available for emergency services to use
- **Map provider integration**: Maps powered by standard mapping services

### 💻 Admin Dashboard
- **User management**: View and manage user accounts
- **Emergency records**: Browse emergency history and details
- **Analytics charts**: Visualize emergency trends and response patterns
- **Emergency priority visualization**: See active emergencies by priority level

### 📱 Progressive Web App (PWA)
- **Installation**: Install to home screen on supported devices (iOS, Android, desktop)
- **App-like experience**: Standalone display mode, no browser chrome
- **Manifest**: App icon, theme colors, app shortcuts
- **Service worker**: Automatic updates and offline resource caching
- **Static caching**: CSS, images, fonts cached for offline access
- **Smart caching**: Pages use NetworkFirst (online-preferred), assets use CacheFirst
- **Network fallback**: 5-second timeout before using cached page
- **Push notifications**: Integration with Firebase Cloud Messaging
- **Shortcuts**: Quick launch to SOS, Nearby Services, Medical ID from home screen
- **Limitations**: Dynamic content (emergency data, contacts) still requires network

### 🔐 Security & Authentication
- **Supabase Auth**: Email/password and OAuth sign-in (Google, Apple, Microsoft)
- **Session management**: Automatic session validation and timeout enforcement
- **Row Level Security (RLS)**: Database-level access control for user data
- **Role-based access**: Admin role for administrative functions
- **Audit logging**: Security events and sign-in attempts logged
- **Rate limiting**: Brute-force protection on authentication endpoints
- **Environment variables**: API keys and secrets never exposed in code

---

## Emergency Digital Twin

The Digital Twin is a **real-time session representation** of an active emergency, containing:
- **Emergency metadata**: Type, severity, status, creation time
- **Live location**: GPS coordinates and reverse-geocoded address
- **Medical context**: Blood type, allergies, medications, conditions (from user's profile)
- **Guardian information**: Primary contact details for emergency coordination
- **Action plan**: AI-generated next steps and recommended services
- **Timeline**: Chronological record of status changes and events

The twin **does not operate independently**. It's a read-only data store for guardians and AI systems to coordinate around, updated by the user's actions and the emergency system's processing.

---

## AI Emergency Coordinator

The AI Emergency Coordinator provides **decision support**, not medical diagnosis or guaranteed assessment. It:

- **Analyzes emergency inputs** (type, location, medical context) to estimate severity and injury patterns
- **Generates action plans**: Recommends next steps (which specialist to see, hospital type, immediate first aid)
- **Matches hospitals**: Ranks nearby hospitals by specialty match and distance
- **Suggests first-aid guidance**: Contextual initial care recommendations
- **Supports human decision-making**: All outputs inform human guardians and responders; humans make final decisions
- **Fails safely**: If AI processing fails, the emergency remains active and alert systems still function

**Important**: The AI provides **assessment support**, not medical diagnosis. Critical medical decisions should involve qualified professionals.

---

## RESQR – Emergency QR Code System

RESQR is a **QR-based emergency digital identity** that bridges information gaps for first responders:

- **Code structure**: 40-character opaque token (the QR contains only this code, never sensitive data)
- **Lookup URL**: Scanning the QR directs to secure lookup: `https://resqora.app/r/{code}`
- **Information exposed** (if authorized):
  - Name, age, blood type, gender
  - Allergies, medications, medical conditions
  - Guardian name and phone
  - Preferred hospital and language
  - **If emergency active**: Real-time location, emergency type, severity, status
- **Access control**: Data only visible if user has activated emergency (via authorization check)
- **First responder benefit**: Critical medical info without requiring authentication
- **Privacy model**: Minimal PII at rest; full emergency context only during active SOS

RESQR is **not globally unique or the first emergency QR system**. It's a practical implementation for RESQORA's emergency coordination workflow.

---

## Guardian Dashboard

The Guardian Dashboard provides **real-time monitoring and coordination** of an active emergency:

- **Secure access**: Guardian receives token-based link via SMS/email; no authentication required
- **Real-time map**: Live GPS location of person in emergency with address
- **Emergency status**: Type, severity, AI-generated action plan, timeline of events
- **Medical context**: Blood type, allergies, medications, conditions (from RESQR projection)
- **Quick actions**:
  - Call emergency contacts with one tap
  - Navigate to person's location via maps
  - Mark emergency as "I'm Safe" (if still active)
- **Coordination notes**: Add notes and track recommended actions
- **Guardian handover**: Transfer to another trusted contact mid-emergency
- **Grace period**: Access remains for 30 minutes after emergency is resolved
- **No medical authorization needed**: Guardian view is read-only; all decisions remain with user and emergency services

The Guardian Dashboard **does not replace professional emergency response**. It supports coordination between the user, trusted contacts, and emergency services.

---

## System Architecture

RESQORA is built as a **React full-stack application** using:

### Frontend
- **React 19** with TypeScript for type-safe UI
- **TanStack Router**: Type-safe client and server routing
- **TanStack React Query**: Server state management and caching
- **Tailwind CSS + Radix UI**: Styling and accessible components

### Backend & Infrastructure
- **TanStack Start + Nitro**: SSR and server functions (API routes)
- **Supabase**: PostgreSQL database with authentication, storage, and realtime
- **Supabase RLS**: Row-level security policies for data isolation
- **Supabase Storage**: Stores accident scene photos and videos
- **Supabase Realtime**: Real-time emergency updates to guardians and contacts

### External Integrations
- **OpenRouter**: Server-side AI inference for triage, coordination, and scene analysis
- **Firebase**: Push notifications via Cloud Messaging
- **EmailJS**: Transactional emergency alerts via email
- **Maps API**: Location visualization and nearby service discovery
- **Reverse geocoding**: Address lookup from GPS coordinates

### Desktop & Mobile
- **Vite + PWA**: Progressive web app with service worker and manifest
- **Workbox**: Intelligent caching strategy (NetworkFirst for pages, CacheFirst for assets)
- **iOS/Android compatibility**: iOS Safari, Android Chrome fully supported
- **Native app features**: Home screen installation, push notifications, offline static resources

### Development & Build
- **TypeScript 5.8**: Full type checking
- **Vite 8**: Fast bundling and HMR
- **ESLint + Prettier**: Code quality and formatting

---

## Technology Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript | Type safety |
| TanStack Start | Full-stack routing (SSR) |
| TanStack Router | Type-safe routing |
| TanStack React Query | Server state & caching |
| Supabase | Database, auth, realtime, storage |
| PostgreSQL | Primary data store |
| OpenRouter | AI inference for emergency assistance and analysis |
| Tailwind CSS | Styling |
| Radix UI | Accessible components |
| Vite | Build tool & dev server |
| PWA (Workbox) | Offline & caching |
| Firebase Cloud Messaging | Push notifications |
| EmailJS | Email alerts |
| Maps API | Location services |
| Nitro | Server functions |

---

## Security & Privacy

### Authentication & Authorization
- **Supabase Auth**: Email/password and OAuth providers (Google, Apple, Microsoft)
- **Session management**: Automatic validation with timeout enforcement
- **Role-based access**: Admin role for platform management
- **Secure tokens**: Guardian and RESQR lookup use opaque, short-lived tokens (not user credentials)

### Data Protection
- **Row Level Security (RLS)**: Database policies enforce user data isolation
- **Encryption**: Data in transit via HTTPS; at-rest encryption via Supabase
- **Sensitive data handling**:
  - Medical info (blood type, allergies, conditions) isolated to user's profile
  - Emergency events accessible only to user and admin
  - Guardian sessions use secure tokens, not user auth
  - RESQR projections require authorization check before exposing data

### Emergency & Medical Data
- **Minimal PII exposure**: RESQR and guardian data only exposes medical care information
- **Realtime access control**: Emergency location only visible during active SOS
- **Grace period**: Guardian link readable for 30 minutes after resolution
- **Audit trail**: Security events logged for compliance

### Environment & Secrets
- **API keys**: Supabase, OpenRouter, Firebase, Maps, EmailJS, and optional SMS credentials stored in `.env`
- **Never committed**: `.env` excluded from version control via `.gitignore`
- **Public/private separation**: VITE_ prefix for client-accessible variables only
- **Developers**: Use `.env.example` template; never commit actual keys

---

## Progressive Web App (PWA)

RESQORA is installed and runs as a native-like app on iOS, Android, and desktop:

### Installation
- **Add to Home Screen (iOS)**: Safari → Share → Add to Home Screen
- **Install (Android)**: Chrome → Menu → Install App
- **Install (Desktop)**: Supported browsers show install prompt

### App Experience
- **Standalone mode**: Runs fullscreen without browser address bar or navigation
- **App icon & shortcuts**: Home screen launcher with RESQORA icon
- **Quick shortcuts**: Tap for Emergency SOS, Nearby Services, Medical ID
- **Theme color**: Red theme (emergency-appropriate) from manifest

### Offline & Caching
- **Static resources**: Service worker caches JS, CSS, fonts, images for offline access
- **Smart strategy**: 
  - **Pages**: NetworkFirst (online-preferred, 5s timeout before cache fallback)
  - **Assets**: CacheFirst (use cache, update in background)
- **Emergency queue**: SOS and location pings queued in localStorage if offline
- **Sync on reconnect**: Queued events automatically sent when network restored
- **Limitations**: Real-time emergency data (location, contacts, medical info) still requires network

### Push Notifications
- **Firebase Cloud Messaging**: Receive alerts even when app is closed
- **Emergency notifications**: Guardian activation triggers push to user
- **Permission**: Browser/OS permission required on first launch

### Platform Support
- **iOS 14+**: Home screen installation via Safari; offline static resources only
- **Android 5+**: Full PWA support with installation and push notifications
- **Desktop**: Chrome, Edge, Firefox support with installation

---

## Limitations

RESQORA's functionality depends on factors beyond the application:

### Connectivity
- **Network required**: Real-time emergency data, contact info, and medical records require internet
- **GPS required**: Location capture requires GPS permission and satellite signal (may be delayed)
- **Maps dependent**: Nearby services and navigation require active mapping service
- **Offline SOS queues**: Activating offline works; delivery occurs on reconnection (with potential delay)

### Device & Browser Permissions
- **GPS access**: Users must grant location permission; accuracy varies by device and conditions
- **Camera/microphone**: Scene capture and voice assistant require explicit permission
- **Notification access**: Push alerts require OS permission on Android/iOS
- **Browser compatibility**: Best on Chrome/Edge (Android), Safari (iOS); some features limited on older browsers

### External Services
- **Firebase availability**: Push notifications depend on Firebase Cloud Messaging uptime
- **Map service availability**: Nearby services and navigation depend on mapping provider
- **Email service**: Alerts delivered via EmailJS; may be delayed if service is down
- **AI/API availability**: Emergency coordinator and MedAI depend on cloud service availability
- **Geocoding service**: Address lookup from GPS depends on reverse geocoding API

### Medical & Emergency Context
- **Not a medical device**: MedAI and scene analysis provide guidance, not diagnosis
- **Guardian availability**: Preset guardian must have network access to see updates
- **Contact responsiveness**: Emergency alerts depend on contacts receiving and reading messages
- **First responder integration**: Data sharing with emergency services manual; not automated

---

## Social Impact & Sustainability

RESQORA addresses critical gaps in emergency response accessibility:

### Emergency Coordination
- **Reduces delay**: Instant guardian notification and live tracking vs. fragmented phone calls
- **Improves information sharing**: Guardians and responders access unified medical context
- **Enables remote coordination**: Guardian can monitor and assist without being physically present
- **Supports hand-off**: Secure guardian transfer enables continuous coordination

### Health & Well-being
- **Multilingual access**: Hindi, Telugu, English support improves accessibility for diverse populations
- **Medical context sharing**: Blood type, allergies, conditions available to responders without delays
- **First-aid guidance**: AI-assisted first aid and urgency assessment empower bystanders
- **Specialist matching**: Directs users to appropriate hospital by medical need, not proximity alone

### Community Resilience
- **Community coordination**: Trusted contacts can assist in crises
- **Voice accessibility**: Speech-to-text for hands-free emergency activation
- **Offline capability**: Emergency queuing ensures SOS works even without current connectivity
- **Activity tracking**: Historical emergency data helps users and clinicians understand patterns

---

## Project Structure

```
RESQORA/
├── public/                          # Static assets
│   ├── manifest.webmanifest         # PWA manifest
│   ├── firebase-messaging-sw.js     # FCM service worker
│   ├── icons/                       # App icons (48px to 512px)
│   └── brand/                       # Branding (splash screens, logos)
├── src/
│   ├── routes/                      # TanStack Router pages
│   │   ├── __root.tsx               # Root layout
│   │   ├── auth.tsx                 # Sign in / Sign up
│   │   ├── _app.*.tsx               # Protected app routes
│   │   ├── _app.emergency.tsx       # SOS / Active emergency
│   │   ├── _app.digital-twin.tsx    # Emergency coordinator & action plan
│   │   ├── guardian.$id.$token.tsx  # Guardian dashboard
│   │   ├── r.$code.tsx              # RESQR lookup
│   │   └── m.$token.tsx             # Public medical ID
│   ├── components/
│   │   ├── accident/                # Scene capture, first aid, analysis
│   │   ├── guardian/                # Guardian dashboard features
│   │   ├── resqora/                 # Core features (SOS, location, contacts)
│   │   ├── medai/                   # Medical AI assistant UI
│   │   ├── resqai/                  # Emergency coordinator chat
│   │   ├── admin/                   # Admin dashboard
│   │   ├── pwa/                     # PWA features (install, splash)
│   │   └── ui/                      # Radix UI components
│   ├── lib/
│   │   ├── api.ts                   # Supabase queries
│   │   ├── emergency.ts             # Emergency activation logic
│   │   ├── guardian.ts              # Guardian session management
│   │   ├── resqr.ts                 # RESQR code and lookup
│   │   ├── medai.ts                 # Medical AI configuration
│   │   ├── accident.*.ts            # Accident analysis and types
│   │   ├── geo.ts / geocode.ts      # Location services
│   │   ├── offline.ts               # Offline queuing
│   │   ├── security.ts              # Rate limiting, validation
│   │   └── [other services]         # Alerts, notifications, etc.
│   ├── services/                    # (Additional service abstractions)
│   ├── types/                       # TypeScript type definitions
│   ├── context/                     # React Context (auth, theme)
│   ├── hooks/                       # Custom React hooks
│   ├── integrations/
│   │   └── supabase/                # Supabase client & types
│   ├── styles.css                   # Global styles
│   ├── server.ts                    # SSR error handler
│   └── start.ts                     # App entry point
├── supabase/
│   ├── config.toml                  # Local dev config
│   └── migrations/                  # Database schema
├── vite.config.ts                   # Build config (PWA, SSR)
├── tsconfig.json                    # TypeScript config
├── package.json                     # Dependencies
├── bunfig.toml                      # Bun package manager config
└── .env.example                     # Template for environment variables
```

---

## Installation

### Prerequisites
- **Node.js 18+** or **Bun 1.0+**
- **Git**
- **Supabase account** (database and auth)
- **Firebase account** (for push notifications)
- **EmailJS account** (for transactional alerts)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kanishka18611/Resqora.git
   cd Resqora
   ```

2. **Install dependencies** (using npm or Bun)
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your keys:
   - `VITE_SUPABASE_URL` – Supabase project URL
  - `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` – Supabase client and server credentials
  - `VITE_FIREBASE_*`, `FIREBASE_*` – Firebase browser configuration, FCM VAPID key, and server service-account JSON
  - `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_PUBLIC_KEY`, `VITE_EMAILJS_TEMPLATE_ID` – EmailJS credentials
  - `GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_API_KEY` – server and browser Maps credentials
  - `GATEWAYAPI_API_KEY` – optional GatewayAPI SMS credential; manual alert channels remain available without it
  - `OPENROUTER_API_KEY` – server-only OpenRouter key for the free AI models
  - `OPENROUTER_MODEL` – optional model override; defaults to `google/gemma-3-27b-it:free`

   **⚠️ CRITICAL**: 
   - Never commit `.env` to version control
   - Never expose private keys (service role keys, Firebase admin keys)
   - Regenerate all keys if accidentally exposed

4. **Start the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```
   Open http://localhost:8080 in your browser.

5. **Configure Supabase locally** (optional)
   ```bash
   # Supabase CLI required for local database
   npx supabase start
   ```

---

## Development

### Running the application
```bash
npm run dev
```
Starts Vite dev server with HMR (hot module reloading) at http://localhost:8080.

### Code quality
```bash
npm run lint       # Run ESLint
npm run format     # Format with Prettier
```

---

## Production Build

### Build the application
```bash
npm run build
```
Creates optimized production build in `dist/`.

### Build for development preview
```bash
npm run build:dev
npm run preview
```
Builds with dev settings and serves for testing.

---

## Deployment

RESQORA is built to deploy on any platform supporting Node.js or Cloudflare Workers:

- **Vercel, Netlify**: Drop-in deployment with environment variables
- **Cloudflare**: Configured as default build target (Nitro + Workers)
- **Self-hosted**: Node.js server via `npm run build && npm start`

See `vite.config.ts` for build target configuration.

---

## Future Development

Potential improvements identified for future work:

- **Offline-first maps**: Embedded offline map tiles for navigation without internet
- **Wearable integration**: Support for smartwatch emergency activation
- **Biometric authentication**: Fingerprint/face recognition for quicker SOS activation
- **Crowdsourced hazard reports**: Community-reported hazards on emergency scene
- **Multi-guardian coordination**: Support for multiple active guardians in parallel emergencies
- **Advanced AI diagnostics**: Enhanced scene analysis with more incident types
- **Integration with emergency services**: Direct API connections to regional 911/emergency dispatch
- **Telemedicine**: Live video call with emergency medical professional
- **Blockchain medical records**: Immutable medical history verification
- **Smart device ecosystem**: Integration with emergency beacons and personal safety devices

---

## Disclaimer

**RESQORA is an emergency coordination and decision-support platform, not an emergency service or medical device.**

- **Not a replacement for professional services**: RESQORA coordinates help but does not replace professional emergency services (911, ambulances, hospitals) or medical professionals
- **AI provides guidance only**: The Emergency Coordinator and MedAI provide assessment and suggestions; they do not diagnose medical conditions or guarantee accuracy
- **No guaranteed delivery**: Emergency alerts depend on network connectivity, service availability, and contact responsiveness
- **User responsibility**: Users are responsible for maintaining current emergency contacts, medical information, and guardian settings
- **Liability**: Use of RESQORA is at user's own risk. Developers and operators are not liable for emergency outcome

**In life-threatening emergencies, always activate professional emergency services (dial 911 or local equivalent) in addition to using RESQORA.**

---

## License & Contributing

This project is private and not open for external contributions at this time. See repository for license information.

---

## Contact & Support

For questions, bug reports, or feature requests, please visit the [GitHub repository](https://github.com/kanishka18611/Resqora).

Create a modern, production-ready web application named **AEGIS**.

Tagline:

"AI-Powered Emergency Intelligence Platform"

The application should have a premium, futuristic design focused on safety, emergency response, and trust.

Design Requirements:

- Modern glassmorphism with subtle gradients

- White background with red and blue accent colors

- Clean, minimal, professional UI

- Rounded corners (12–16px)

- Soft shadows

- Smooth page transitions and micro-animations

- Fully responsive (mobile, tablet, desktop)

- Dark mode support

- Accessibility compliant (WCAG)

- Use Lucide React icons throughout

- Consistent spacing and typography

Tech Stack:

- React

- TypeScript

- Tailwind CSS

- Supabase

- React Router

- React Query

- Framer Motion

- Shadcn UI

Create the complete project architecture including:

/pages

/components

/layouts

/hooks

/services

/lib

/context

/utils

/types

Create a reusable design system with:

- Typography styles

- Button variants

- Form components

- Cards

- Dialogs

- Badges

- Toast notifications

- Loading skeletons

- Empty states

- Status indicators

- Reusable modals

Create the main responsive navigation with:

- Dashboard

- Emergency

- Nearby

- History

- Profile

- Settings

On mobile, use a bottom navigation bar. On desktop, use a modern sidebar with collapsible sections.

Create a professional landing page featuring:

- A premium hero section with the AEGIS branding

- "Emergency Assistance in Seconds" as the main headline

- A short introduction explaining that AEGIS is an AI-powered emergency intelligence platform designed to help users quickly access emergency assistance and keep loved ones informed.

- Feature preview cards (placeholders only)

- Statistics section (placeholder values)

- Testimonials section (UI placeholders)

- Footer with modern styling

Create placeholder pages for all navigation items with consistent layouts.

Do not implement authentication, emergency logic, AI functionality, databases, APIs, or backend features yet.

Focus only on building a polished, scalable frontend foundation with reusable components and excellent user experience.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
