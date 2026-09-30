/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Tv, BarChart2, Lightbulb } from 'lucide-react';
import { GameId } from '../types/game';

interface TopBarProps {
  activeGame: GameId;
  onSelectGame: (game: GameId) => void;
  crtFilter: boolean;
  onToggleCrt: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  onOpenStats: () => void;
  onOpenIdeas: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeGame,
  onSelectGame,
  crtFilter,
  onToggleCrt,
  soundMuted,
  onToggleSound,
  onOpenStats,
  onOpenIdeas,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-3 sm:px-6 py-3 border-b border-slate-800/80 bg-[#080d19]/90 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Wordmark in characterful arcade style */}
      <div className="flex items-center gap-2 sm:gap-3">
        <a
          href="/"
          className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2 hover:text-cyan-400 transition-colors"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
          <span>Retro Arcade</span>
        </a>
      </div>

      {/* Zone 2: Navigation Links / Game Switcher Tabs */}
      <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
        <button
          onClick={() => onSelectGame('snake')}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeGame === 'snake'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Snake
        </button>

        <button
          onClick={() => onSelectGame('breakout')}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeGame === 'breakout'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Breakout
        </button>

        <button
          onClick={() => onSelectGame('tetris')}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeGame === 'tetris'
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Tetris
        </button>

        <button
          onClick={() => onSelectGame('mario')}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeGame === 'mario'
              ? 'bg-red-500/15 text-red-400 border border-red-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Mini Mario
        </button>

        <button
          onClick={onOpenIdeas}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors whitespace-nowrap border border-amber-500/30"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Game Ideas</span>
        </button>

        <button
          onClick={onOpenStats}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors whitespace-nowrap"
        >
          <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Stats</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action Toggles */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onOpenStats}
          title="View High Scores and Stats"
          className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors"
        >
          <BarChart2 className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={onToggleCrt}
          title={crtFilter ? 'Turn CRT Scanlines OFF' : 'Turn CRT Scanlines ON'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all ${
            crtFilter
              ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CRT {crtFilter ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={onToggleSound}
          title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
          className={`p-2 rounded-lg border transition-colors ${
            soundMuted
              ? 'bg-slate-900 text-slate-500 border-slate-800'
              : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-800'
          }`}
        >
          {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
