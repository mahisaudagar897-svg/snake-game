/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameId = 'snake' | 'breakout' | 'tetris' | 'mario';

export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export type ControlInput = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'ACTION_A' | 'ACTION_B' | 'PAUSE' | 'RESTART';

export interface GameHighScores {
  snake: number;
  breakout: number;
  tetris: number;
  mario: number;
}

export interface ArcadeStats {
  highScores: GameHighScores;
  gamesPlayed: {
    snake: number;
    breakout: number;
    tetris: number;
    mario: number;
  };
  totalLinesCleared: number;
  totalBricksDestroyed: number;
  maxSnakeLength: number;
  totalCoinsCollected: number;
}

export interface GameMetadata {
  id: GameId;
  title: string;
  shortDesc: string;
  tagline: string;
  themeColor: string;
  badgeColor: string;
  keyboardControls: { key: string; action: string }[];
  mobileControls: { label: string; action: string }[];
}

export interface ClassicGameIdea {
  id: string;
  title: string;
  genre: string;
  inspiration: string;
  coreMechanic: string;
  browserFit: string;
  modernTwist: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
}
