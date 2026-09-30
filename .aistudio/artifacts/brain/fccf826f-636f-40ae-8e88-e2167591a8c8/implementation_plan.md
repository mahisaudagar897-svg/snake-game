# Retro Arcade Hub: Classic Mini Game Suite

A high-performance, browser-native retro arcade suite featuring three fully playable classic games—**Neon Snake**, **Brick Breaker (Bounce Quest)**, and **Tetro Stack (Block Puzzle)**—complete with synthesized 8-bit sound effects, responsive virtual touch controls, high scores, and CRT arcade aesthetic styling.

### User Review & Critical Decisions

> [!IMPORTANT]
> Because questions were skipped, the recommended defaults have been adopted: a multi-game **Retro Arcade Hub** bringing together the top classic games requested (Snake, Brick Breaker / Bounce Ball, and Block Stacker / Tetris), styled in a refined dark arcade aesthetic with Web Audio chiptune sound effects and dual keyboard / on-screen touch controls.

- **Confirmed Architecture**: Multi-game arcade hub with instantaneous switching between games, persistent local high scores, and zero page-reload resets.
- **Confirmed Aesthetic**: Deep obsidian arcade frame (`#090D16`), sharp neon laser accents (emerald `#10B981`, electric cyan `#06B6D4`, arcade amber `#F59E0B`, magenta `#EC4899`), optional CRT scanline toggle, and crisp arcade typography.
- **Confirmed Controls & Audio**: Dual keyboard bindings (Arrows/WASD, Space, P for pause) and on-screen responsive touch D-pad & action buttons for mobile/tablet gameplay, driven by zero-dependency Web Audio API sound synthesis.

---

### 1. Overview & Core Concept

- **What It Does**: Provides an immediate, zero-latency classic gaming experience directly in the browser. Players can select between three legendary mini games, customize game speeds, toggle sound and visual effects, track personal best scores stored locally, and play with keyboard or responsive touch controls.
  1. **Neon Snake**: Dynamic grid snake with fruit combo multipliers, ghost trail effects, speed progression, and smooth turn buffers.
  2. **Brick Breaker (Bounce Quest)**: Precision paddle bounce physics with angled ball deflection, multi-color durable bricks, power-ups (laser paddle, multi-ball, extended paddle), and particle explosions.
  3. **Tetro Stack (Block Puzzle)**: Classic 7-tetromino falling block mechanics with ghost piece projection, hard/soft drops, rotation wall-kicks, line clear animations, and leveling speeds.
- **Target Audience / Persona**: Casual gamers, retro gaming enthusiasts, and desktop/mobile users looking for quick, responsive, nostalgic entertainment with zero downloads or logins.
- **Key Value**: Instant gratification, smooth 60fps canvas performance, clean retro polish without annoying ads or bloated external game engine dependencies.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Cabinet Attract & Game Selection**:
   - The player lands on the sleek arcade cabinet interface showcasing the three game cartridges with live previews, top records, and a quick-start action.
   - Global header features audio volume/mute toggles, CRT scanline filter switch, and quick game switcher tabs.
2. **Gameplay Screen**:
   - Seamless transition into the active game arena rendered on an optimized HTML5 2D Canvas.
   - Unobtrusive HUD displays current score, high score, level/length, lives, and pause/restart buttons.
   - For touch or mobile viewports, an ergonomic virtual D-pad and action buttons appear below the game viewport.
3. **Pause & Game Over Sequence**:
   - Pause overlay provides instant resume, restart, sound settings, or return to arcade lobby.
   - Game over state celebrates high score breaks with celebratory chiptune fanfares, statistical breakdown (lines cleared, bricks shattered, snake length), and a single-click "Play Again" button.

#### Visual Identity & Theme
- **Dominant Neutral Canvas (60%)**: Deep void obsidian (`#070B14` to `#0B1120`) with subtle radial arcade glow and delicate gridlines.
- **Structural Surfaces (30%)**: Sleek bezel casing (`#111827`), hairline neon borders (`rgba(14, 165, 233, 0.2)`), and high-contrast dark arena mats.
- **Focal Accent Budget (10%)**: Distinct neon identifiers for each game:
  - *Snake*: Vivid Emerald (`#10B981`) & Neon Lime (`#84CC16`)
  - *Brick Breaker*: Electric Cyan (`#06B6D4`) & Solar Gold (`#F59E0B`)
  - *Tetro Stack*: Neon Violet (`#A855F7`) & Cyber Coral (`#F43F5E`)
- **Typography & Formatting**: Clean sans-serif headings with high-character arcade styling (`Plus Jakarta Sans`), paired with strict tabular monospace numerals (`font-mono tabular-nums`) for scores and timers.
- **Anti-Slop Restraint**: No cluttered fake version banners, no floating pill badge sandwiches, no line-by-line emoji scatter; pure, intentional arcade cabinet layout.

#### Interactive Audio & Motion
- **Synthesized 8-Bit Web Audio Engine**: Zero external audio asset dependencies. Generates retro square, triangle, and noise waveforms for:
  - Eat fruit / Brick collision / Block rotate beeps
  - Line clear / Powerup arpeggios
  - Game over melodic slide down
  - High score fanfare
- **Visual Feedback**: Screen shake micro-bursts on impacts, canvas particle sparks on line clears and brick destructions, and smooth HUD transitions.

---

### 3. Key Product Decisions & Trade-Offs

- **Pure Canvas 2D Engine vs Heavy External Frameworks**:
  - *Chosen Approach*: Lightweight, custom requestAnimationFrame game loops for all three games using native HTML5 Canvas.
  - *Why*: Guarantees rock-solid 60 FPS, microsecond input responsiveness, zero bundle overhead, and hermetic reliability inside AI Studio's preview environment.
  - *Alternatives Considered*: Phaser or PixiJS were ruled out to avoid large dependency trees and fragile asset loading states.
- **Procedural Web Audio API vs Static Audio Files**:
  - *Chosen Approach*: Procedural audio synthesis via the browser's built-in `AudioContext` (oscillators, gain nodes, frequency sweeps).
  - *Why*: Eliminates broken audio URLs, works instantly offline, zero latency, and provides authentic 8-bit chiptune sound design.
- **Dual Input Architecture**:
  - *Chosen Approach*: Unified input dispatch system mapping both physical keyboard events (Arrows, WASD, Space) and virtual on-screen touch buttons to identical state actions with touch-action isolation to prevent browser scrolling.
  - *Why*: Flawless playability on both desktop keyboards and mobile/tablet touchscreens.
- **Persistence Strategy**:
  - *Chosen Approach*: Browser `localStorage` for high scores, game statistics (total games played, best records), and audio/visual preferences.
  - *Why*: Instant save/restore across sessions without requiring logins or cloud infrastructure.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          RETRO ARCADE HUB                              │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar: [ Arcade Brand ] ─── [ Game Selector Tabs ] ─── [ Audio/CRT ]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                 Active Game Canvas Viewport                   │    │
│   │  ┌─────────────────────────────────────────────────────────┐  │    │
│   │  │ HUD: Score · High Score · Level · Lives · Speed Level   │  │    │
│   │  ├─────────────────────────────────────────────────────────┤  │    │
│   │  │                                                         │  │    │
│   │  │            [ Native 60 FPS Canvas Game Loop ]           │  │    │
│   │  │        • Snake       • Breakout       • TetroStack      │  │    │
│   │  │                                                         │  │    │
│   │  └─────────────────────────────────────────────────────────┘  │    │
│   │  Overlays: Title / Instructions / Pause / Game Over Modals    │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  Dual Control Deck: Keyboard Bindings & Virtual Touch D-Pad   │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  Cabinet Statistics & Hall of Fame: LocalStorage High Scores  │    │
│   └───────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌───────────────────┐           ┌───────────────────┐
       │ Web Audio Engine  │           │ Storage Manager   │
       │ (Oscillators/FX)  │           │ (Scores/Settings) │
       └───────────────────┘           └───────────────────┘
```

#### Core State Model
- **App Machine**: `activeGame: 'snake' | 'breakout' | 'tetris'`
- **Game State**: `status: 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'`
- **Audio State**: `muted: boolean, volume: number`
- **Preferences**: `crtFilter: boolean, touchControlsVisible: boolean`
- **Score Store**: Records per game `{ snake: number, breakout: number, tetris: number }`
