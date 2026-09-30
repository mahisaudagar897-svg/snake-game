/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArcadeStats, GameId, GameHighScores } from '../types/game';

const HIGH_SCORES_KEY = 'retro_arcade_high_scores_v2';
const STATS_KEY = 'retro_arcade_stats_v2';
const SETTINGS_KEY = 'retro_arcade_settings_v2';

const DEFAULT_SCORES: GameHighScores = {
  snake: 120,
  breakout: 850,
  tetris: 3400,
  mario: 650,
};

const DEFAULT_STATS: ArcadeStats = {
  highScores: DEFAULT_SCORES,
  gamesPlayed: {
    snake: 0,
    breakout: 0,
    tetris: 0,
    mario: 0,
  },
  totalLinesCleared: 0,
  totalBricksDestroyed: 0,
  maxSnakeLength: 5,
  totalCoinsCollected: 0,
};

export interface AppSettings {
  crtFilter: boolean;
  soundMuted: boolean;
  volume: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  crtFilter: true,
  soundMuted: false,
  volume: 0.4,
};

export const storage = {
  getHighScores(): GameHighScores {
    try {
      const data = localStorage.getItem(HIGH_SCORES_KEY);
      if (data) {
        return { ...DEFAULT_SCORES, ...JSON.parse(data) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SCORES;
  },

  saveHighScore(game: GameId, score: number): boolean {
    const scores = this.getHighScores();
    const currentBest = scores[game] || 0;
    if (score > currentBest) {
      scores[game] = score;
      try {
        localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
      } catch {
        // Fallback
      }
      return true; // New record!
    }
    return false;
  },

  getStats(): ArcadeStats {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (data) {
        return { ...DEFAULT_STATS, ...JSON.parse(data) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_STATS;
  },

  incrementGamesPlayed(game: GameId) {
    const stats = this.getStats();
    stats.gamesPlayed[game] = (stats.gamesPlayed[game] || 0) + 1;
    stats.highScores = this.getHighScores();
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // Fallback
    }
  },

  recordBricks(count: number) {
    const stats = this.getStats();
    stats.totalBricksDestroyed = (stats.totalBricksDestroyed || 0) + count;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  },

  recordLines(count: number) {
    const stats = this.getStats();
    stats.totalLinesCleared = (stats.totalLinesCleared || 0) + count;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  },

  recordSnakeLength(length: number) {
    const stats = this.getStats();
    if (length > (stats.maxSnakeLength || 0)) {
      stats.maxSnakeLength = length;
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      } catch {}
    }
  },

  recordCoins(coins: number) {
    const stats = this.getStats();
    stats.totalCoinsCollected = (stats.totalCoinsCollected || 0) + coins;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  },
};
