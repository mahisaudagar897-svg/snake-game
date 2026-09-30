/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { VirtualController } from './components/VirtualController';
import { StatsModal } from './components/StatsModal';
import { IdeasLabModal } from './components/IdeasLabModal';
import { SnakeGame } from './games/SnakeGame';
import { BreakoutGame } from './games/BreakoutGame';
import { TetrisGame } from './games/TetrisGame';
import { MarioGame } from './games/MarioGame';
import { ControlInput, GameId } from './types/game';
import { sound } from './services/audio';
import { storage, AppSettings } from './services/storage';
import { Gamepad2, Sparkles, Keyboard, Trophy, Flame, Lightbulb } from 'lucide-react';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameId>('snake');
  const [pendingInput, setPendingInput] = useState<ControlInput | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isIdeasOpen, setIsIdeasOpen] = useState<boolean>(false);
  const [showKeyboardGuide, setShowKeyboardGuide] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [highScores, setHighScores] = useState(() => storage.getHighScores());

  // Initialize sound settings
  useEffect(() => {
    sound.setMuted(settings.soundMuted);
    sound.setVolume(settings.volume);
  }, [settings]);

  const toggleSound = () => {
    const nextMuted = !settings.soundMuted;
    sound.setMuted(nextMuted);
    const updated = { ...settings, soundMuted: nextMuted };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  const toggleCrt = () => {
    const updated = { ...settings, crtFilter: !settings.crtFilter };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  const handleGameSelect = (game: GameId) => {
    if (game === activeGame) return;
    sound.move();
    setActiveGame(game);
    setHighScores(storage.getHighScores());
  };

  const handleScoreUpdate = () => {
    setHighScores(storage.getHighScores());
  };

  const handleControllerInput = (input: ControlInput) => {
    setPendingInput(input);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center relative overflow-x-hidden pb-12">
      {/* Universal Top Bar */}
      <TopBar
        activeGame={activeGame}
        onSelectGame={handleGameSelect}
        crtFilter={settings.crtFilter}
        onToggleCrt={toggleCrt}
        soundMuted={settings.soundMuted}
        onToggleSound={toggleSound}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenIdeas={() => setIsIdeasOpen(true)}
      />

      {/* Main Arcade Frame Container */}
      <main className="w-full max-w-4xl px-3 sm:px-6 pt-5 flex flex-col items-center">
        {/* Game Quick Switcher Cartridge Row */}
        <section className="w-full max-w-xl mb-4 grid grid-cols-4 gap-1.5 p-1.5 bg-[#0b101e] border border-slate-800/80 rounded-xl">
          <button
            onClick={() => handleGameSelect('snake')}
            className={`py-2 px-2 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeGame === 'snake'
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <div className="text-center sm:text-left">
              <span className="block text-xs font-bold leading-tight">Snake</span>
              <span className="block text-[10px] text-slate-400 font-mono">
                {highScores.snake}
              </span>
            </div>
          </button>

          <button
            onClick={() => handleGameSelect('breakout')}
            className={`py-2 px-2 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeGame === 'breakout'
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <div className="text-center sm:text-left">
              <span className="block text-xs font-bold leading-tight">Bounce</span>
              <span className="block text-[10px] text-slate-400 font-mono">
                {highScores.breakout}
              </span>
            </div>
          </button>

          <button
            onClick={() => handleGameSelect('tetris')}
            className={`py-2 px-2 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeGame === 'tetris'
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <div className="text-center sm:text-left">
              <span className="block text-xs font-bold leading-tight">Tetris</span>
              <span className="block text-[10px] text-slate-400 font-mono">
                {highScores.tetris}
              </span>
            </div>
          </button>

          <button
            onClick={() => handleGameSelect('mario')}
            className={`py-2 px-2 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeGame === 'mario'
                ? 'bg-red-500/20 border border-red-500/50 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <div className="text-center sm:text-left">
              <span className="block text-xs font-bold leading-tight">Mario</span>
              <span className="block text-[10px] text-slate-400 font-mono">
                {highScores.mario}
              </span>
            </div>
          </button>
        </section>

        {/* Active Game Screen inside Arcade Bezel */}
        <div
          className={`w-full max-w-xl relative rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-[#11192b] to-[#090e1c] border-2 ${
            activeGame === 'snake'
              ? 'border-emerald-600/40 neon-glow-emerald'
              : activeGame === 'breakout'
              ? 'border-cyan-600/40 neon-glow-cyan'
              : activeGame === 'tetris'
              ? 'border-purple-600/40 neon-glow-purple'
              : 'border-red-600/40 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
          } shadow-2xl transition-all duration-300`}
        >
          {/* Bezel Marquee Badge */}
          <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-[#090d18] border border-slate-800/90 rounded-lg text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300 font-bold uppercase tracking-wider">
                {activeGame === 'snake'
                  ? 'CARTRIDGE #01 // NEON SNAKE'
                  : activeGame === 'breakout'
                  ? 'CARTRIDGE #02 // BOUNCE BREAKOUT'
                  : activeGame === 'tetris'
                  ? 'CARTRIDGE #03 // TETRO STACK'
                  : 'CARTRIDGE #04 // SUPER MINI BROS'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">60 FPS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
          </div>

          {/* Screen with Optional CRT Scanlines Overlay */}
          <div className={`relative rounded-xl overflow-hidden ${settings.crtFilter ? 'crt-overlay' : ''}`}>
            {activeGame === 'snake' && (
              <SnakeGame
                onScoreUpdate={handleScoreUpdate}
                externalInput={pendingInput}
                onClearInput={() => setPendingInput(null)}
              />
            )}
            {activeGame === 'breakout' && (
              <BreakoutGame
                onScoreUpdate={handleScoreUpdate}
                externalInput={pendingInput}
                onClearInput={() => setPendingInput(null)}
              />
            )}
            {activeGame === 'tetris' && (
              <TetrisGame
                onScoreUpdate={handleScoreUpdate}
                externalInput={pendingInput}
                onClearInput={() => setPendingInput(null)}
              />
            )}
            {activeGame === 'mario' && (
              <MarioGame
                onScoreUpdate={handleScoreUpdate}
                externalInput={pendingInput}
                onClearInput={() => setPendingInput(null)}
              />
            )}
          </div>
        </div>

        {/* Dual Input Touch Control Deck */}
        <VirtualController onInput={handleControllerInput} activeGame={activeGame} />

        {/* Action Callout & Ideas Lab Link */}
        <div className="w-full max-w-xl mt-3 flex items-center justify-between gap-2">
          <button
            onClick={() => setIsIdeasOpen(true)}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/40 hover:border-amber-400 rounded-xl text-xs text-amber-300 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">Explore 12+ Classic Mini Game Ideas & Mechanics</span>
          </button>
        </div>

        {/* Keyboard Controls Drawer Toggle & Guide */}
        <div className="w-full max-w-xl mt-2">
          <button
            onClick={() => setShowKeyboardGuide((prev) => !prev)}
            className="w-full py-2 px-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-400 hover:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Keyboard Controls & Shortcuts</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {showKeyboardGuide ? 'Hide ▲' : 'Show ▼'}
            </span>
          </button>

          {showKeyboardGuide && (
            <div className="mt-2 p-3.5 bg-[#090d18] border border-slate-800 rounded-xl text-xs space-y-2 animate-fade-in">
              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">COMMON</span>
                  <p className="text-slate-300">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">
                      Arrow Keys
                    </kbd>{' '}
                    or{' '}
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">
                      WASD
                    </kbd>
                  </p>
                  <p className="text-slate-300 mt-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">
                      SPACE
                    </kbd>{' '}
                    Jump / Action / Launch
                  </p>
                  <p className="text-slate-300 mt-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">
                      P
                    </kbd>{' '}
                    Pause / Resume
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">GAME SPECIFIC</span>
                  <p className="text-slate-300">
                    <span className="text-red-400">Mini Mario:</span> Space or W to jump; Left/Right to run
                  </p>
                  <p className="text-slate-300 mt-1">
                    <span className="text-purple-400">Tetris:</span>{' '}
                    <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-purple-300">
                      C
                    </kbd>{' '}
                    Hold Piece
                  </p>
                  <p className="text-slate-300 mt-1">
                    <span className="text-cyan-400">Breakout:</span> Mouse drag or Arrows to steer paddle
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Feature Badges / Highlights */}
        <section className="w-full max-w-xl mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/30 border border-slate-800/60">
            <Sparkles className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
            <span className="block font-semibold text-slate-200">Zero Latency</span>
            <span className="text-[10px] text-slate-500">Pure Canvas 60 FPS</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/30 border border-slate-800/60">
            <Trophy className="w-4 h-4 mx-auto text-amber-400 mb-1" />
            <span className="block font-semibold text-slate-200">Hall of Fame</span>
            <span className="text-[10px] text-slate-500">Auto-saved records</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/30 border border-slate-800/60">
            <Flame className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
            <span className="block font-semibold text-slate-200">Synthesized Audio</span>
            <span className="text-[10px] text-slate-500">8-bit Web Audio FX</span>
          </div>
        </section>
      </main>

      {/* Hall of Fame Modal */}
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />

      {/* Classic Game Ideas Showcase Modal */}
      <IdeasLabModal isOpen={isIdeasOpen} onClose={() => setIsIdeasOpen(false)} />
    </div>
  );
}
