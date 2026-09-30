/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Trophy, Flame, Layers, Box, RotateCcw, Coins } from 'lucide-react';
import { storage } from '../services/storage';
import { ArcadeStats } from '../types/game';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<ArcadeStats>(() => storage.getStats());
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStats(storage.getStats());
      setConfirmReset(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    localStorage.removeItem('retro_arcade_high_scores_v2');
    localStorage.removeItem('retro_arcade_stats_v2');
    setStats(storage.getStats());
    setConfirmReset(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0c1220] border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Arcade Hall of Fame</h2>
            <p className="text-xs text-slate-400">Personal career records & game telemetry</p>
          </div>
        </div>

        {/* High Scores Leaderboard Cards */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-emerald-950 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
              <div>
                <p className="text-xs font-semibold text-slate-200">Neon Snake</p>
                <p className="text-[11px] text-slate-500">{stats.gamesPlayed.snake} games played</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-emerald-400 font-mono-numbers">
                {stats.highScores.snake}
              </span>
              <span className="text-[10px] block text-slate-500">PTS</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-cyan-950 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
              <div>
                <p className="text-xs font-semibold text-slate-200">Brick Breaker</p>
                <p className="text-[11px] text-slate-500">{stats.gamesPlayed.breakout} games played</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-cyan-400 font-mono-numbers">
                {stats.highScores.breakout}
              </span>
              <span className="text-[10px] block text-slate-500">PTS</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-purple-950 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]"></span>
              <div>
                <p className="text-xs font-semibold text-slate-200">Tetro Stack</p>
                <p className="text-[11px] text-slate-500">{stats.gamesPlayed.tetris} games played</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-purple-400 font-mono-numbers">
                {stats.highScores.tetris}
              </span>
              <span className="text-[10px] block text-slate-500">PTS</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-red-950 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_#f87171]"></span>
              <div>
                <p className="text-xs font-semibold text-slate-200">Super Mini Bros</p>
                <p className="text-[11px] text-slate-500">{stats.gamesPlayed.mario} runs played</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-red-400 font-mono-numbers">
                {stats.highScores.mario}
              </span>
              <span className="text-[10px] block text-slate-500">PTS</span>
            </div>
          </div>
        </div>

        {/* Aggregate Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-5 text-center">
          <div className="p-2 bg-slate-900/50 border border-slate-800/80 rounded-lg">
            <Layers className="w-3.5 h-3.5 mx-auto text-purple-400 mb-1" />
            <span className="text-xs font-bold text-white font-mono">{stats.totalLinesCleared}</span>
            <span className="block text-[9px] text-slate-400">Lines</span>
          </div>
          <div className="p-2 bg-slate-900/50 border border-slate-800/80 rounded-lg">
            <Box className="w-3.5 h-3.5 mx-auto text-cyan-400 mb-1" />
            <span className="text-xs font-bold text-white font-mono">{stats.totalBricksDestroyed}</span>
            <span className="block text-[9px] text-slate-400">Bricks</span>
          </div>
          <div className="p-2 bg-slate-900/50 border border-slate-800/80 rounded-lg">
            <Flame className="w-3.5 h-3.5 mx-auto text-emerald-400 mb-1" />
            <span className="text-xs font-bold text-white font-mono">{stats.maxSnakeLength}</span>
            <span className="block text-[9px] text-slate-400">Snake</span>
          </div>
          <div className="p-2 bg-slate-900/50 border border-slate-800/80 rounded-lg">
            <Coins className="w-3.5 h-3.5 mx-auto text-amber-400 mb-1" />
            <span className="text-xs font-bold text-white font-mono">{stats.totalCoinsCollected || 0}</span>
            <span className="block text-[9px] text-slate-400">Coins</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-rose-400 text-[11px]">Are you sure?</span>
              <button
                onClick={handleReset}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Records</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors ml-auto cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
