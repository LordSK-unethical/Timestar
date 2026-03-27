<div align="center">

```
╔════════════════════════════════════════╗
║  ⏱  T I M E S T A R                  ║
║     The Clock That Moves With You     ║
╚════════════════════════════════════════╝
```

**A beautiful, feature-rich desktop clock application**
built with React + Tauri — lightweight, fast, and native.

[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri%202.x-FFC131?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

</div>

---

## ✦ What is TimeStar?

TimeStar is a polished, cross-platform desktop clock application that lives in your taskbar and respects your workflow. Built on **Tauri** for a tiny binary footprint and native OS integration, and powered by **React 19** for a fluid, animated UI — it combines everything you'd want from a time utility into one cohesive app.

No Electron bloat. No subscription. Just time, done beautifully.

---

## ✦ Features

### 🕐 World Clock
Track multiple timezones at a glance. Add or remove any city from a curated list of world destinations. The real-time clock display updates every second and adapts to your system theme.

- Live clock with seconds precision
- Multi-city world clock panel
- Add / remove cities with a single click
- AM/PM or 24-hour format toggle

### ⏰ Alarm
Never miss a moment. Set alarms with granular control over repetition and notification behavior.

- Set alarms to exact minute precision
- Choose repeat days (Mon–Sun, weekdays, weekends, or custom)
- Snooze intervals: **5 min / 10 min / 15 min**
- Multiple ringtone options
- Alarm list with enable/disable toggles

### ⏱ Timer
Whether it's a Pomodoro sprint or a pasta boil — TimeStar's timer is ready.

- One-tap preset timers (5 min, 10 min, 25 min, etc.)
- Run **multiple timers simultaneously**
- Completion notifications with sound
- Pause, resume, and reset controls

### 🏁 Stopwatch
Measure performance with precision. Built for athletes, developers, and anyone counting seconds.

- Start / stop / reset with one click
- Lap recording with split times
- Automatic **fastest lap** and **slowest lap** highlighting
- Scrollable lap history

---

## ✦ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI Framework | React 19 | Component model, reactivity |
| Build Tool | Vite | Dev server, HMR, bundling |
| Desktop Runtime | Tauri 2.x | Native window, OS APIs, tiny binary |
| Styling | Tailwind CSS | Utility-first responsive design |
| Animation | Framer Motion | Page transitions, micro-interactions |
| Icons | Lucide React | Consistent, beautiful icon set |
| Language (backend) | Rust | Native performance, system access |

> **Why Tauri over Electron?**
> Tauri apps are typically **10–20× smaller** in binary size and use a fraction of the RAM, since they leverage the OS's native WebView instead of bundling Chromium.

---

## ✦ Getting Started

### Prerequisites

Make sure you have the following installed:

```
Node.js     v18 or higher   → https://nodejs.org
Rust        stable toolchain → https://rustup.rs
```

> On macOS/Linux, install Rust with:
> ```bash
> curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
> ```
>
> On Windows, download and run `rustup-init.exe` from [rustup.rs](https://rustup.rs).

You'll also need Tauri's system dependencies. See the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/) for your OS.

---

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/timestar.git
cd timestar

# 2. Install Node dependencies
npm install

# 3. Start in development mode (hot-reloads on save)
npm run tauri dev
```

### Production Build

```bash
# Build a native installer for your OS
npm run tauri build
```

Output artifacts (`.dmg`, `.msi`, `.AppImage`, etc.) will be placed in:
```
src-tauri/target/release/bundle/
```

---

## ✦ Project Structure

```
timestar/
│
├── src/                          # React frontend
│   ├── components/
│   │   ├── BottomNav.jsx         # Tab navigation bar
│   │   └── Navbar.jsx            # Top app bar
│   │
│   ├── hooks/
│   │   └── useTheme.jsx          # Light/dark theme hook
│   │
│   ├── pages/
│   │   ├── ClockPage.jsx         # World clock view
│   │   ├── AlarmPage.jsx         # Alarm manager
│   │   ├── TimerPage.jsx         # Countdown timers
│   │   ├── StopwatchPage.jsx     # Stopwatch + laps
│   │   └── SettingsPage.jsx      # App preferences
│   │
│   ├── utils/
│   │   ├── alarmUtils.js         # Alarm scheduling logic
│   │   ├── timeUtils.js          # Formatting, parsing helpers
│   │   └── worldClockUtils.js    # Timezone resolution
│   │
│   ├── App.jsx                   # Root component + routing
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Global styles
│
├── src-tauri/                    # Rust / Tauri backend
│   ├── src/
│   │   ├── main.rs               # App bootstrap
│   │   └── lib.rs                # Tauri commands & handlers
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Window config, permissions, metadata
│
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## ✦ Configuration

TimeStar reads its window and app metadata from `src-tauri/tauri.conf.json`. You can customize:

- **Window size & resizability**
- **App name and identifier**
- **System tray behavior**
- **Update endpoints** (if self-hosting updates)

For theme and UI preferences, edit `tailwind.config.js` to extend the color palette or breakpoints.

---

## ✦ Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a **Pull Request** against `main`

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## ✦ Roadmap

- [ ] System tray mini-clock
- [ ] Custom ringtone upload
- [ ] Pomodoro mode with session tracking
- [ ] Calendar integration
- [ ] Keyboard shortcuts
- [ ] Widget mode (always-on-top compact view)

---

## ✦ License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ☕ and Rust

**TimeStar** — *Because every second counts.*

</div>