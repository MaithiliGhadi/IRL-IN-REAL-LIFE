# IRL — In Real Life ✦

> **A real-time, anti-perfectionist social journaling web app built for Gen Z.**  
> *No gallery uploads. No follower counts. No vanity metrics. Just your real life, right now.*

---

## ⚡ The Philosophy

Traditional social networks encourage curated perfectionism, filter saturation, and anxiety-inducing vanity metrics. **IRL (In Real Life)** flips the script:

- **Live Capture Only**: You cannot pick pre-edited photos from your gallery. Every photo is captured in real-time through your camera.
- **Context over Perfection**: Every photo is paired with a *"Today I..."* micro-journaling statement, an ephemeral mood tag, an ambient voice thought, and a location stamp.
- **24-Hour Ephemeral Stream**: Every moment disappears automatically after 24 hours. No permanent timeline anxiety.
- **Low-Pressure Resonance**: No like buttons or public follower tallies. Reactions are subtle resonance signals: `♡ felt this`, `😂 same`, and `✨ love this`.

---

## 🏛️ The Four Core Pillars

### 1. Pillar 1 — Real-Time Camera HUD
- Direct hardware access via WebRTC `navigator.mediaDevices.getUserMedia`.
- Front / back camera flipping with instant stream swapping.
- Screen flash simulator for low-light captures.
- Instant photo capture rendered straight onto an HTML5 canvas without cloud latency.
- Seamless fallback test snapshot generator for desktop environments without a webcam.

### 2. Pillar 2 — Moment + Context Composer (5-Step Wizard)
- **Step 1 (Activity)**: The core *"Today I..."* prompt that turns a photo into a genuine slice of life.
- **Step 2 (Mood Tagging)**: Instant mood selection (`😴 tired`, `☕ calm`, `✨ happy`, `⚡ excited`, `🫠 bored`, `🧠 focused`, `🫧 vibing`, `🌿 grateful`).
- **Step 3 (Voice Thought)**: Real audio recording via HTML5 `MediaRecorder` API with live waveform animation and playback review.
- **Step 4 (Location & Privacy)**: Geolocation detection and campus suggestions with an explicit **Show / Hide** toggle to respect personal privacy.
- **Step 5 (Final Review & 24h Countdown)**: Real-time preview card showing exactly how friends will experience the moment.

### 3. Pillar 3 — Ephemeral 24-Hour Stream
- Clean, vertical, distraction-free feed.
- Live disappearing countdown timer on every post (`⏱ 23h left`).
- In-line audio voice note playback with animated waveform capsules.
- Low-pressure reaction buttons with single-tap toggle:
  - `♡ felt this`
  - `😂 same`
  - `✨ love this`

### 4. Pillar 4 — Identity & Profile
- Clean onboarding: start fresh with **`+ create profile`** or enter with **`enter your profile`**.
- User profile customization:
  - Custom profile picture upload or instant live selfie capture.
  - 1-tap random handle and bio roller.
  - Zero default stranger photos (neutral SVG initials fallback).
- "Today I..." identity drawer with authentic stats (moments captured today, weekly count, recent mood tags, places visited) and profile switcher.

---

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Bundler & Tooling**: [Vite 8](https://vitejs.dev/)
- **Styling**: Modern Vanilla CSS with CSS custom properties, glassmorphism (`backdrop-filter`), tactile pill buttons, and responsive safe areas (`100dvh`).
- **Media APIs**:
  - `MediaDevices.getUserMedia()` for live camera capture
  - `MediaRecorder` for audio voice notes
  - HTML5 `<canvas>` for zero-latency frame extraction
- **Persistence**: Browser `localStorage` for offline session caching and mock streams.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` or `yarn`

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MaithiliGhadi/IRL-IN-REAL-LIFE.git
   cd IRL-IN-REAL-LIFE
   ```

2. **Navigate to the client directory and install dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173` to experience IRL in real time.

### Production Build
To create an optimized production build:
```bash
cd client
npm run build
```
To preview the production build locally:
```bash
npm run preview
```

---

## 📁 Project Structure

```text
IRL - IN REAL LIFE/
├── .gitignore               # Root git ignore
├── README.md                # Project documentation
└── client/
    ├── public/              # Static assets
    ├── src/
    │   ├── components/
    │   │   ├── Camera.jsx          # Live viewfinder HUD & camera controls
    │   │   ├── MomentComposer.jsx  # 5-step micro-journaling wizard
    │   │   ├── Feed.jsx            # 24h ephemeral stream & voice player
    │   │   ├── ProfileModal.jsx    # Pillar 4 identity sheet & switcher
    │   │   └── CreateAccount.jsx   # Profile creation & selfie uploader
    │   ├── styles/
    │   │   └── global.css          # Design system & responsive layout
    │   ├── App.jsx                 # App controller & state orchestration
    │   └── main.jsx                # React root entry point
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 👩‍💻 Author

Created with authentic vibes by **[Maithili Ghadi](https://github.com/MaithiliGhadi)**.
