/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pause, RotateCcw } from 'lucide-react';
import { ControlInput, GameId } from '../types/game';

interface VirtualControllerProps {
  onInput: (input: ControlInput) => void;
  activeGame: GameId;
}

export const VirtualController: React.FC<VirtualControllerProps> = ({ onInput, activeGame }) => {
  const handleButtonPress = (input: ControlInput) => (e: React.PointerEvent) => {
    e.preventDefault();
    onInput(input);
  };

  // Game-specific button labels
  let actionALabel = 'ACTION';
  let actionBLabel = 'SPECIAL';

  if (activeGame === 'snake') {
    actionALabel = 'PLAY / PAUSE';
    actionBLabel = 'WARP';
  } else if (activeGame === 'breakout') {
    actionALabel = 'LAUNCH / FIRE';
    actionBLabel = 'RESTART';
  } else if (activeGame === 'tetris') {
    actionALabel = 'HARD DROP';
    actionBLabel = 'ROTATE';
  } else if (activeGame === 'mario') {
    actionALabel = 'JUMP';
    actionBLabel = 'JUMP';
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-4 px-4 py-3 bg-[#0a0f1d] border border-slate-800/80 rounded-2xl shadow-xl flex flex-col gap-3">
      {/* Top Utility Row */}
      <div className="flex items-center justify-between px-2 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>ARCADE CONTROLS</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            onPointerDown={handleButtonPress('PAUSE')}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded border border-slate-700 transition-transform cursor-pointer"
          >
            <Pause className="w-3 h-3 text-amber-400" />
            <span>PAUSE</span>
          </button>
          <button
            onPointerDown={handleButtonPress('RESTART')}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded border border-slate-700 transition-transform cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Main Controls Deck: D-Pad (Left) and Action Buttons (Right) */}
      <div className="flex items-center justify-between sm:justify-around gap-4 pt-1">
        {/* Directional D-Pad Cross */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* D-Pad Center Base */}
          <div className="absolute w-12 h-12 bg-slate-900 border border-slate-700/60 rounded-sm pointer-events-none"></div>

          {/* UP Button */}
          <button
            onPointerDown={handleButtonPress('UP')}
            className="absolute top-0 w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:scale-95 rounded-t-lg border-t border-x border-slate-700/80 shadow-md flex items-center justify-center text-slate-200 transition-all select-none touch-none cursor-pointer"
            aria-label="Up"
          >
            <ArrowUp className="w-5 h-5 text-cyan-400" />
          </button>

          {/* DOWN Button */}
          <button
            onPointerDown={handleButtonPress('DOWN')}
            className="absolute bottom-0 w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:scale-95 rounded-b-lg border-b border-x border-slate-700/80 shadow-md flex items-center justify-center text-slate-200 transition-all select-none touch-none cursor-pointer"
            aria-label="Down"
          >
            <ArrowDown className="w-5 h-5 text-cyan-400" />
          </button>

          {/* LEFT Button */}
          <button
            onPointerDown={handleButtonPress('LEFT')}
            className="absolute left-0 w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:scale-95 rounded-l-lg border-l border-y border-slate-700/80 shadow-md flex items-center justify-center text-slate-200 transition-all select-none touch-none cursor-pointer"
            aria-label="Left"
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
          </button>

          {/* RIGHT Button */}
          <button
            onPointerDown={handleButtonPress('RIGHT')}
            className="absolute right-0 w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:scale-95 rounded-r-lg border-r border-y border-slate-700/80 shadow-md flex items-center justify-center text-slate-200 transition-all select-none touch-none cursor-pointer"
            aria-label="Right"
          >
            <ArrowRight className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        {/* Action Buttons Deck */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            {/* Button B */}
            <div className="flex flex-col items-center gap-1">
              <button
                onPointerDown={handleButtonPress('ACTION_B')}
                className="w-14 h-14 rounded-full bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 active:scale-90 shadow-lg shadow-purple-900/40 border border-purple-400/40 flex items-center justify-center text-white font-bold text-sm tracking-wider transition-transform touch-none cursor-pointer"
              >
                B
              </button>
              <span className="text-[9px] font-mono text-purple-300 font-semibold uppercase tracking-wider">
                {actionBLabel}
              </span>
            </div>

            {/* Button A */}
            <div className="flex flex-col items-center gap-1">
              <button
                onPointerDown={handleButtonPress('ACTION_A')}
                className="w-16 h-16 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 active:scale-90 shadow-lg shadow-cyan-900/50 border border-cyan-300/40 flex items-center justify-center text-slate-950 font-black text-base tracking-wider transition-transform touch-none cursor-pointer"
              >
                A
              </button>
              <span className="text-[9px] font-mono text-cyan-300 font-semibold uppercase tracking-wider">
                {actionALabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
