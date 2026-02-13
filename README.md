<div align="center">

# ✨ ParticleVerse

**Interactive 3D Particle Visualization Experience**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r160-049EF4?style=flat-square&logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

Transform images, text, and 3D models into stunning particle formations.  
Control them with your **bare hands** using real-time hand tracking.

[Demo](#) · [Features](#-features) · [Getting Started](#-getting-started) · [Architecture](#-architecture) · [Contributing](#-contributing)

</div>

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Usage](#-usage)
- [Performance](#-performance)
- [Security](#-security)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🚀 Features

| Category | Description |
|----------|-------------|
| **Multi-source input** | Convert images, cubemaps, text, and 3D models (GLTF/GLB) into particles |
| **GPGPU physics** | GPU-computed particle physics via GPUComputationRenderer — persistent velocity, spring-back, and organic hand scatter |
| **Hand tracking** | Physics-based interaction via MediaPipe — particles scatter like sand |
| **Audio reactivity** | Web Audio API drives particle size, glow, and physics from microphone or audio files |
| **11 particle effects** | Wave, spiral, explosion, vortex, galaxy, DNA, ring, fountain, rotate, custom, and none |
| **6 lighting modes** | None, move, expand, contract, pulse, wave |
| **5 color modes** | Original, gradient, rainbow, monochrome, temperature |
| **Smooth transitions** | Color mode and effect transitions blend seamlessly |
| **Settings sharing** | Copy shareable URL or export/import settings as JSON |
| **Real-time controls** | Tweak particle count, size, speed, turbulence, bloom, and more |
| **Recording** | Capture your particle scene as WebM video |
| **Mobile optimized** | Adaptive DPR, reduced bloom, lower camera resolution on mobile |
| **Internationalization** | English and Korean UI with extensible locale system |
| **Security hardened** | XSS, CSRF, clickjacking, file upload validation, and more |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 14** (App Router) | SSR, routing, code splitting |
| 3D Engine | **Three.js** + **React Three Fiber** | WebGL rendering pipeline |
| Post-processing | **@react-three/postprocessing** | Bloom, vignette effects |
| Hand Tracking | **MediaPipe Hands** | Real-time hand landmark detection |
| State | **Zustand** | Lightweight global state management |
| Styling | **Tailwind CSS** + **Framer Motion** | Utility-first CSS + animations |
| Shaders | **GLSL** (custom vertex/fragment) | GPU-accelerated particle effects |
| GPGPU | **GPUComputationRenderer** (three-stdlib) | Ping-pong FBO particle physics |
| Audio | **Web Audio API** + AnalyserNode | Frequency band extraction for reactivity |
| Language | **TypeScript 5** | Type safety across the entire codebase |
| Deployment | **Vercel** | Edge network, zero-config deploys |

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9 (or yarn / pnpm)
- A modern browser with WebGL 2 support
- Webcam (optional, for hand tracking)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/particle-verse.git
cd particle-verse

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
particle-verse/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── globals.css             # Global styles & utility classes
│   │   ├── layout.tsx              # Root layout with metadata
│   │   └── page.tsx                # Main page (dynamic imports)
│   ├── components/
│   │   ├── audio/
│   │   │   └── AudioAnalyzer.tsx    # Web Audio API frequency analysis
│   │   ├── hand/
│   │   │   └── HandTracker.tsx     # MediaPipe hand tracking + mobile camera
│   │   ├── providers/
│   │   │   └── ThemeProvider.tsx    # Dark/light theme provider
│   │   ├── three/
│   │   │   ├── ParticleSystem.tsx   # Shader material + uniform management
│   │   │   └── Scene.tsx           # Canvas, camera, post-processing
│   │   └── ui/
│   │       ├── LoadingScreen.tsx    # Initial loading animation
│   │       ├── UIOverlay.tsx        # Side panel + tabs + status bar
│   │       └── panels/             # Individual settings panels (8 tabs)
│   ├── gpgpu/
│   │   └── computeShaders.ts       # GLSL compute shaders for GPGPU physics
│   ├── locales/                    # i18n translations (en, ko)
│   ├── shaders/
│   │   └── particleShaders.ts      # GLSL vertex & fragment shaders
│   ├── store/
│   │   └── useAppStore.ts          # Zustand store (persisted)
│   └── utils/
│       ├── particleGenerator.ts    # Particle data from various sources
│       ├── security.ts             # Input sanitization & validation
│       └── stateSharing.ts         # URL/JSON settings export & import
├── public/                         # Static assets
├── next.config.js                  # Next.js configuration
├── tailwind.config.js              # Tailwind theme & plugins
├── tsconfig.json                   # TypeScript configuration
├── vercel.json                     # Vercel deployment config
└── package.json
```

---

## 🏗 Architecture

### Rendering Pipeline

```
Source Data (image/text/model)
    │
    ▼
particleGenerator.ts ─── generates Float32Array (positions + colors)
    │
    ▼
ParticleSystem.tsx ─── creates BufferGeometry + ShaderMaterial
    │                    manages uniforms (time, effects, hand, lighting, audio)
    │
    ├──► GPUComputationRenderer (GPGPU physics)
    │    ├── velocityShader ─── spring-back, hand repulsion, audio bass pulse
    │    └── positionShader ─── displacement integration
    │    (writes texturePhysics → read by vertex shader)
    │
    ├──► AudioAnalyzer (Web Audio API)
    │    └── AnalyserNode ─── bass/mid/treble/energy → shader uniforms
    │
    ▼
particleShaders.ts
    ├── Vertex Shader ─── effect transforms, GPGPU displacement, turbulence
    └── Fragment Shader ── color modes, lighting glow, audio glow, opacity
    │
    ▼
Scene.tsx ─── Canvas + Camera + OrbitControls + EffectComposer (Bloom)
```

### Hand Interaction Model

The hand interaction uses a **physics-based sand/granular** model:

1. MediaPipe detects hand landmarks in video frames
2. Palm center position is projected into 3D scene coordinates
3. The vertex shader computes displacement for each particle:
   - **Cubic falloff**: `force = (1 - dist/radius)³`
   - **Organic scatter**: Simplex noise offsets give natural granular behavior
   - **Gradual return**: Displaced particles naturally rejoin the formation as the hand moves away

### State Management

Zustand store with `persist` middleware (localStorage). All settings — particle, visual, hand, rotation, float, lighting, recording — are centralized in a single store with typed actions.

---

## 🎮 Usage

### Source Selection

| Source | Description |
|--------|-------------|
| Default | Spherical particle distribution with gradient colors |
| Image | Upload an image → pixels become particles preserving color |
| Cubemap | 6 images arranged as a cube surface |
| Text | Type text → rendered to canvas → sampled as particles |
| 3D Model | Load GLTF/GLB → mesh vertices become particles |

### Effects

Select from 11 effects in the Effects tab. Adjust intensity, rotation axis/speed, and float amplitude/frequency.

### Hand Control

1. Enable hand tracking in the **Hand Control** tab
2. Allow webcam access
3. Move your hand near the particle formation — particles scatter like sand
4. Adjust sensitivity, interaction radius, and repulsion force

### Camera Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Rotate | Left-click drag | One-finger drag |
| Zoom | Scroll wheel | Pinch gesture |
| Pan | Right-click drag | Two-finger drag |

---

## ⚡ Performance

| Optimization | Description |
|-------------|-------------|
| GPU shaders | All particle transforms computed on the GPU |
| GPGPU physics | Ping-pong FBO via GPUComputationRenderer for persistent particle state |
| Adaptive DPR | `[1, 1]` on mobile, `[1, 2]` on desktop |
| Reduced bloom | Lower intensity, higher threshold on mobile |
| Lower camera res | 320×240 on mobile vs 640×480 on desktop |
| MediaPipe lite | `modelComplexity: 0` on mobile devices |
| Code splitting | Dynamic imports for Scene, HandTracker, UIOverlay |
| Memoization | `useMemo` / `useCallback` to minimize re-renders |
| AdaptiveDpr | drei's `<AdaptiveDpr>` auto-downgrades resolution under load |

---

## 🔒 Security

| Threat | Mitigation |
|--------|-----------|
| XSS | HTML escaping, keyword filtering, CSP headers |
| CSRF | SameSite cookies, CSRF token generation |
| Clickjacking | `X-Frame-Options: DENY` |
| File Upload | MIME type + magic number validation, size limits |
| Open Redirect | URL allowlist validation |
| SQL / Command Injection | Input pattern sanitization |
| Path Traversal | `..` removal, special char filtering |
| Brute Force | Client-side rate limiting |

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### GitHub Auto-Deploy

1. Push to a GitHub repository
2. Connect the repo at [vercel.com](https://vercel.com) → **Add New Project**
3. Framework is auto-detected as Next.js
4. Every push to `main` triggers a production deploy; PRs get preview URLs

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m "feat: add amazing feature"`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `perf:` — Performance improvement
- `refactor:` — Code restructuring
- `docs:` — Documentation update
- `style:` — Code style (formatting, no logic change)

---

## 🗺 Roadmap

- [x] GPGPU particle physics (GPUComputationRenderer)
- [x] Audio-reactive particles (microphone & file input)
- [x] Preset sharing via URL & JSON export/import
- [ ] Multi-user sessions via WebRTC
- [ ] VR/AR mode with WebXR
- [ ] Additional 3D model formats (OBJ, FBX)
- [ ] WebGPU compute shader upgrade

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

## 🙏 Acknowledgements

- [Three.js](https://threejs.org/) — WebGL 3D library
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) — React renderer for Three.js
- [drei](https://github.com/pmndrs/drei) — Useful helpers for R3F
- [MediaPipe](https://mediapipe.dev/) — Cross-platform ML solutions
- [Zustand](https://github.com/pmndrs/zustand) — Lightweight state management
- [Framer Motion](https://www.framer.com/motion/) — Animation library
- [Vercel](https://vercel.com/) — Deployment platform
