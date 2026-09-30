/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ControlInput, GameStatus } from '../types/game';
import { sound } from '../services/audio';
import { storage } from '../services/storage';
import { Play, RotateCcw, Pause, Heart, Coins, Trophy, Award } from 'lucide-react';

interface MarioGameProps {
  onScoreUpdate: () => void;
  externalInput: ControlInput | null;
  onClearInput: () => void;
}

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Player extends Entity {
  vx: number;
  vy: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  invulnerableTime: number;
}

interface Enemy extends Entity {
  vx: number;
  alive: boolean;
  squashedTime: number;
}

interface Block extends Entity {
  type: 'ground' | 'brick' | 'question' | 'pipe' | 'pipe_top' | 'empty_question' | 'stone';
  hasCoin?: boolean;
  bumpOffset?: number;
}

interface CoinItem extends Entity {
  collected: boolean;
  animFrame: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 320;
const GRAVITY = 0.42;
const JUMP_FORCE = -8.8;
const MOVE_SPEED = 3.2;

export const MarioGame: React.FC<MarioGameProps> = ({
  onScoreUpdate,
  externalInput,
  onClearInput,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [highScore, setHighScore] = useState<number>(() => storage.getHighScores().mario || 650);

  // Game internal mutable state
  const gameStateRef = useRef<{
    player: Player;
    cameraX: number;
    blocks: Block[];
    enemies: Enemy[];
    coins: CoinItem[];
    particles: Particle[];
    flagX: number;
    flagY: number;
    flagPoleHeight: number;
    levelLength: number;
    keys: { left: boolean; right: boolean; jump: boolean };
    score: number;
    coinCount: number;
    lives: number;
    timeLeft: number;
    levelCleared: boolean;
    gameOverReason: string;
  }>({
    player: { x: 50, y: 200, width: 20, height: 26, vx: 0, vy: 0, isGrounded: false, facing: 'right', invulnerableTime: 0 },
    cameraX: 0,
    blocks: [],
    enemies: [],
    coins: [],
    particles: [],
    flagX: 2100,
    flagY: 60,
    flagPoleHeight: 180,
    levelLength: 2300,
    keys: { left: false, right: false, jump: false },
    score: 0,
    coinCount: 0,
    lives: 3,
    timeLeft: 300,
    levelCleared: false,
    gameOverReason: '',
  });

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Level Geometry
  const initLevel = useCallback(() => {
    const blocks: Block[] = [];
    const enemies: Enemy[] = [];
    const coins: CoinItem[] = [];
    const levelLength = 2300;
    const flagX = 2050;

    // Ground segments with chasms/pits
    const groundSegments = [
      { start: 0, end: 600 },
      { start: 660, end: 1250 },
      { start: 1320, end: 1750 },
      { start: 1810, end: 2300 },
    ];

    groundSegments.forEach((seg) => {
      for (let x = seg.start; x < seg.end; x += 24) {
        blocks.push({ x, y: 240, width: 24, height: 24, type: 'ground' });
        blocks.push({ x, y: 264, width: 24, height: 56, type: 'ground' });
      }
    });

    // Mystery Question Blocks & Bricks
    const blockLayout = [
      { x: 180, y: 160, type: 'question', hasCoin: true },
      { x: 230, y: 160, type: 'brick' },
      { x: 254, y: 160, type: 'question', hasCoin: true },
      { x: 278, y: 160, type: 'brick' },
      { x: 302, y: 160, type: 'question', hasCoin: true },
      { x: 254, y: 95, type: 'question', hasCoin: true },

      // Elevated bricks
      { x: 740, y: 160, type: 'brick' },
      { x: 764, y: 160, type: 'question', hasCoin: true },
      { x: 788, y: 160, type: 'brick' },
      { x: 860, y: 110, type: 'brick' },
      { x: 884, y: 110, type: 'brick' },
      { x: 908, y: 110, type: 'question', hasCoin: true },

      // High pyramid stairs near pit
      { x: 1400, y: 216, width: 24, height: 24, type: 'stone' },
      { x: 1424, y: 216, width: 24, height: 24, type: 'stone' },
      { x: 1424, y: 192, width: 24, height: 24, type: 'stone' },
      { x: 1448, y: 216, width: 24, height: 24, type: 'stone' },
      { x: 1448, y: 192, width: 24, height: 24, type: 'stone' },
      { x: 1448, y: 168, width: 24, height: 24, type: 'stone' },

      // Castle stairs
      { x: 1940, y: 216, width: 24, height: 24, type: 'stone' },
      { x: 1964, y: 192, width: 24, height: 48, type: 'stone' },
      { x: 1988, y: 168, width: 24, height: 72, type: 'stone' },
    ];

    blockLayout.forEach((b) => {
      blocks.push({
        x: b.x,
        y: b.y,
        width: b.width || 24,
        height: b.height || 24,
        type: b.type as Block['type'],
        hasCoin: b.hasCoin,
        bumpOffset: 0,
      });
    });

    // Pipes
    const pipes = [
      { x: 380, y: 192, h: 48 },
      { x: 520, y: 168, h: 72 },
      { x: 1040, y: 192, h: 48 },
      { x: 1180, y: 168, h: 72 },
      { x: 1600, y: 192, h: 48 },
    ];

    pipes.forEach((p) => {
      blocks.push({ x: p.x - 2, y: p.y, width: 36, height: 16, type: 'pipe_top' });
      blocks.push({ x: p.x, y: p.y + 16, width: 32, height: p.h - 16, type: 'pipe' });
    });

    // Enemies (Goombas)
    const enemyPositions = [280, 440, 720, 840, 1100, 1480, 1680];
    enemyPositions.forEach((x) => {
      enemies.push({
        x,
        y: 220,
        width: 20,
        height: 20,
        vx: -1.1,
        alive: true,
        squashedTime: 0,
      });
    });

    // Scattered Floating Coins
    const coinPositions = [
      { x: 395, y: 150 },
      { x: 535, y: 125 },
      { x: 750, y: 125 },
      { x: 774, y: 125 },
      { x: 798, y: 125 },
      { x: 1350, y: 180 },
      { x: 1370, y: 160 },
      { x: 1780, y: 190 },
      { x: 1840, y: 170 },
    ];
    coinPositions.forEach((c) => {
      coins.push({
        x: c.x,
        y: c.y,
        width: 14,
        height: 18,
        collected: false,
        animFrame: 0,
      });
    });

    gameStateRef.current = {
      player: {
        x: 40,
        y: 190,
        width: 18,
        height: 24,
        vx: 0,
        vy: 0,
        isGrounded: false,
        facing: 'right',
        invulnerableTime: 0,
      },
      cameraX: 0,
      blocks,
      enemies,
      coins,
      particles: [],
      flagX,
      flagY: 60,
      flagPoleHeight: 180,
      levelLength,
      keys: { left: false, right: false, jump: false },
      score: 0,
      coinCount: 0,
      lives: 3,
      timeLeft: 300,
      levelCleared: false,
      gameOverReason: '',
    };

    setScore(0);
    setCoins(0);
    setLives(3);
    setTimeLeft(300);
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count: number = 8) => {
    for (let i = 0; i < count; i++) {
      gameStateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4 - 1,
        color,
        size: Math.random() * 3 + 2,
        life: 0,
        maxLife: 20 + Math.random() * 15,
      });
    }
  };

  const handleGameOver = useCallback((reason: string) => {
    setStatus('GAME_OVER');
    sound.gameOver();
    gameStateRef.current.gameOverReason = reason;
    storage.incrementGamesPlayed('mario');
    storage.saveHighScore('mario', gameStateRef.current.score);
    storage.recordCoins(gameStateRef.current.coinCount);
    setHighScore(storage.getHighScores().mario || 650);
    onScoreUpdate();
  }, [onScoreUpdate]);

  const handleVictory = useCallback(() => {
    setStatus('VICTORY');
    sound.victory();
    const timeBonus = gameStateRef.current.timeLeft * 10;
    const finalScore = gameStateRef.current.score + 1000 + timeBonus;
    gameStateRef.current.score = finalScore;
    setScore(finalScore);

    storage.incrementGamesPlayed('mario');
    storage.saveHighScore('mario', finalScore);
    storage.recordCoins(gameStateRef.current.coinCount);
    setHighScore(storage.getHighScores().mario || 650);
    onScoreUpdate();
  }, [onScoreUpdate]);

  const startGame = () => {
    initLevel();
    setStatus('PLAYING');
    sound.bonus();
  };

  const restartGame = () => {
    initLevel();
    setStatus('PLAYING');
    sound.move();
  };

  const togglePause = () => {
    setStatus((prev) => {
      const next = prev === 'PLAYING' ? 'PAUSED' : 'PLAYING';
      if (next === 'PAUSED') sound.paddleBounce();
      else sound.move();
      return next;
    });
  };

  // Timer Tick
  useEffect(() => {
    if (status === 'PLAYING') {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver('Time Expired!');
            return 0;
          }
          gameStateRef.current.timeLeft = prev - 1;
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [status, handleGameOver]);

  // Handle External Touch Controller Inputs
  useEffect(() => {
    if (!externalInput) return;
    const state = gameStateRef.current;

    switch (externalInput) {
      case 'LEFT':
        state.keys.left = true;
        state.keys.right = false;
        break;
      case 'RIGHT':
        state.keys.right = true;
        state.keys.left = false;
        break;
      case 'UP':
      case 'ACTION_A':
      case 'ACTION_B':
        if (state.player.isGrounded && status === 'PLAYING') {
          state.player.vy = JUMP_FORCE;
          state.player.isGrounded = false;
          sound.marioJump();
        }
        break;
      case 'PAUSE':
        togglePause();
        break;
      case 'RESTART':
        restartGame();
        break;
    }

    const timer = setTimeout(() => {
      state.keys.left = false;
      state.keys.right = false;
      onClearInput();
    }, 150);

    return () => clearTimeout(timer);
  }, [externalInput, onClearInput, status]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.keys.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (state.player.isGrounded && status === 'PLAYING') {
          state.player.vy = JUMP_FORCE;
          state.player.isGrounded = false;
          sound.marioJump();
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
      }
      if (e.key === 'r' || e.key === 'R') {
        if (status === 'GAME_OVER' || status === 'VICTORY') {
          restartGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [status]);

  // Core Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = (timestamp: number) => {
      animId = requestAnimationFrame(gameLoop);

      const delta = lastTimeRef.current ? Math.min(32, timestamp - lastTimeRef.current) : 16;
      lastTimeRef.current = timestamp;

      const state = gameStateRef.current;
      const { player, blocks, enemies, coins, particles } = state;

      // 1. UPDATE GAMEPLAY
      if (status === 'PLAYING') {
        // Player Horizontal Movement
        if (state.keys.left) {
          player.vx = -MOVE_SPEED;
          player.facing = 'left';
        } else if (state.keys.right) {
          player.vx = MOVE_SPEED;
          player.facing = 'right';
        } else {
          player.vx *= 0.75;
          if (Math.abs(player.vx) < 0.1) player.vx = 0;
        }

        // Apply Gravity
        player.vy += GRAVITY;
        if (player.vy > 9) player.vy = 9;

        // Move Player X and Check Collisions
        player.x += player.vx;
        if (player.x < 0) player.x = 0;

        for (const block of blocks) {
          if (
            player.x < block.x + block.width &&
            player.x + player.width > block.x &&
            player.y < block.y + block.height &&
            player.y + player.height > block.y
          ) {
            if (player.vx > 0) {
              player.x = block.x - player.width;
            } else if (player.vx < 0) {
              player.x = block.x + block.width;
            }
          }
        }

        // Move Player Y and Check Collisions
        player.y += player.vy;
        player.isGrounded = false;

        for (const block of blocks) {
          if (
            player.x < block.x + block.width &&
            player.x + player.width > block.x &&
            player.y < block.y + block.height &&
            player.y + player.height > block.y
          ) {
            // Landing on top of block
            if (player.vy > 0 && player.y + player.height - player.vy <= block.y + 4) {
              player.y = block.y - player.height;
              player.vy = 0;
              player.isGrounded = true;
            }
            // Hitting block from below (headbutt)
            else if (player.vy < 0 && player.y - player.vy >= block.y + block.height - 6) {
              player.y = block.y + block.height;
              player.vy = 0;

              if (block.type === 'question' && block.hasCoin) {
                block.type = 'empty_question';
                block.hasCoin = false;
                block.bumpOffset = -6;
                state.score += 100;
                state.coinCount += 1;
                setScore(state.score);
                setCoins(state.coinCount);
                sound.marioCoin();
                spawnParticles(block.x + 12, block.y, '#F59E0B', 6);
              } else if (block.type === 'brick') {
                block.bumpOffset = -4;
                state.score += 25;
                setScore(state.score);
                sound.marioBump();
                spawnParticles(block.x + 12, block.y + 12, '#b45309', 4);
              } else {
                sound.marioBump();
              }
            }
          }
        }

        // Recover Block Bump Offsets
        for (const b of blocks) {
          if (b.bumpOffset && b.bumpOffset < 0) {
            b.bumpOffset += 1;
          }
        }

        // Check Fall into Chasm/Pit
        if (player.y > CANVAS_HEIGHT + 40) {
          sound.lifeLost();
          state.lives -= 1;
          setLives(state.lives);
          if (state.lives <= 0) {
            handleGameOver('Fell into chasm');
          } else {
            // Respawn at safe start
            player.x = Math.max(40, state.cameraX + 20);
            player.y = 120;
            player.vy = 0;
            player.invulnerableTime = 60;
          }
        }

        // Invulnerability countdown
        if (player.invulnerableTime > 0) {
          player.invulnerableTime -= 1;
        }

        // Check Floating Coins
        for (const c of coins) {
          if (!c.collected) {
            c.animFrame = (c.animFrame + 0.1) % Math.PI;
            if (
              player.x < c.x + c.width &&
              player.x + player.width > c.x &&
              player.y < c.y + c.height &&
              player.y + player.height > c.y
            ) {
              c.collected = true;
              state.score += 100;
              state.coinCount += 1;
              setScore(state.score);
              setCoins(state.coinCount);
              sound.marioCoin();
              spawnParticles(c.x + 7, c.y + 9, '#FCD34D', 8);
            }
          }
        }

        // Update Enemies
        for (const enemy of enemies) {
          if (!enemy.alive) {
            enemy.squashedTime += 1;
            continue;
          }

          enemy.x += enemy.vx;

          // Enemy collision with blocks / reverse direction
          for (const b of blocks) {
            if (
              enemy.x < b.x + b.width &&
              enemy.x + enemy.width > b.x &&
              enemy.y < b.y + b.height &&
              enemy.y + enemy.height > b.y
            ) {
              enemy.vx = -enemy.vx;
              enemy.x += enemy.vx * 2;
            }
          }

          // Enemy collision with player
          if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
          ) {
            // Player jumps on top of enemy (stomp)
            if (player.vy > 0 && player.y + player.height - player.vy <= enemy.y + 8) {
              enemy.alive = false;
              player.vy = -6; // bounce
              state.score += 200;
              setScore(state.score);
              sound.marioStomp();
              spawnParticles(enemy.x + 10, enemy.y + 10, '#854d0e', 10);
            } else if (player.invulnerableTime <= 0) {
              // Hurt player
              sound.lifeLost();
              state.lives -= 1;
              setLives(state.lives);
              player.invulnerableTime = 60;
              player.vy = -4;
              spawnParticles(player.x + 10, player.y + 12, '#EF4444', 8);

              if (state.lives <= 0) {
                handleGameOver('Caught by critter');
              }
            }
          }
        }

        // Check Victory Flag Pole
        if (player.x + player.width >= state.flagX) {
          handleVictory();
        }

        // Camera Follows Player smoothly
        const targetCamX = player.x - CANVAS_WIDTH * 0.35;
        state.cameraX = Math.max(0, Math.min(state.levelLength - CANVAS_WIDTH, targetCamX));

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15;
          p.life += 1;
          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
          }
        }
      }

      // 2. RENDER SCENE
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.7, '#7dd3fc');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.translate(-Math.floor(state.cameraX), 0);

      // Distant clouds & hills
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let cx = 40; cx < state.levelLength; cx += 260) {
        ctx.beginPath();
        ctx.arc(cx, 60, 20, 0, Math.PI * 2);
        ctx.arc(cx + 25, 52, 28, 0, Math.PI * 2);
        ctx.arc(cx + 50, 60, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#4ade80';
      for (let hx = 100; hx < state.levelLength; hx += 420) {
        ctx.beginPath();
        ctx.ellipse(hx, 240, 70, 45, 0, Math.PI, 0);
        ctx.fill();
      }

      // Render Blocks
      for (const block of blocks) {
        const drawY = block.y + (block.bumpOffset || 0);

        if (block.type === 'ground') {
          // Top grass layer
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(block.x, drawY, block.width, 6);
          // Dirt body
          ctx.fillStyle = '#92400e';
          ctx.fillRect(block.x, drawY + 6, block.width, block.height - 6);
          ctx.strokeStyle = '#78350f';
          ctx.strokeRect(block.x, drawY, block.width, block.height);
        } else if (block.type === 'brick') {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(block.x, drawY, block.width, block.height);
          ctx.strokeStyle = '#78350f';
          ctx.strokeRect(block.x, drawY, block.width, block.height);
          // Brick seam lines
          ctx.beginPath();
          ctx.moveTo(block.x, drawY + 12);
          ctx.lineTo(block.x + block.width, drawY + 12);
          ctx.moveTo(block.x + 12, drawY);
          ctx.lineTo(block.x + 12, drawY + 12);
          ctx.stroke();
        } else if (block.type === 'question') {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(block.x, drawY, block.width, block.height);
          ctx.strokeStyle = '#b45309';
          ctx.strokeRect(block.x, drawY, block.width, block.height);
          // '?' symbol
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', block.x + block.width / 2, drawY + block.height / 2 + 1);
        } else if (block.type === 'empty_question') {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(block.x, drawY, block.width, block.height);
          ctx.strokeStyle = '#451a03';
          ctx.strokeRect(block.x, drawY, block.width, block.height);
        } else if (block.type === 'stone') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(block.x, drawY, block.width, block.height);
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(block.x, drawY, block.width, block.height);
        } else if (block.type === 'pipe_top') {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(block.x, drawY, block.width, block.height);
          ctx.strokeStyle = '#15803d';
          ctx.strokeRect(block.x, drawY, block.width, block.height);
          // Light highlight
          ctx.fillStyle = '#86efac';
          ctx.fillRect(block.x + 4, drawY + 2, 4, block.height - 4);
        } else if (block.type === 'pipe') {
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(block.x, drawY, block.width, block.height);
          ctx.strokeStyle = '#14532d';
          ctx.strokeRect(block.x, drawY, block.width, block.height);
          ctx.fillStyle = '#86efac';
          ctx.fillRect(block.x + 4, drawY, 4, block.height);
        }
      }

      // Render Floating Coins
      for (const c of coins) {
        if (!c.collected) {
          ctx.save();
          ctx.translate(c.x + c.width / 2, c.y + c.height / 2);
          const scaleX = Math.abs(Math.cos(c.animFrame));
          ctx.scale(Math.max(0.2, scaleX), 1);
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#b45309';
          ctx.stroke();
          ctx.restore();
        }
      }

      // Render Enemies (Goombas)
      for (const enemy of enemies) {
        if (!enemy.alive) {
          if (enemy.squashedTime < 25) {
            // Squashed Goomba
            ctx.fillStyle = '#78350f';
            ctx.fillRect(enemy.x, enemy.y + 12, enemy.width, 8);
          }
        } else {
          // Head / Body
          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.arc(enemy.x + enemy.width / 2, enemy.y + 8, 10, Math.PI, 0);
          ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
          ctx.lineTo(enemy.x, enemy.y + enemy.height);
          ctx.closePath();
          ctx.fill();

          // Angry eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(enemy.x + 4, enemy.y + 7, 3, 5);
          ctx.fillRect(enemy.x + 13, enemy.y + 7, 3, 5);
          ctx.fillStyle = '#000000';
          ctx.fillRect(enemy.x + 5, enemy.y + 9, 2, 3);
          ctx.fillRect(enemy.x + 13, enemy.y + 9, 2, 3);

          // Feet
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(enemy.x - 1, enemy.y + enemy.height - 3, 6, 4);
          ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + enemy.height - 3, 6, 4);
        }
      }

      // Render Goal Flagpole & Castle
      const { flagX, flagY, flagPoleHeight } = state;
      // Pole
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(flagX, flagY, 4, flagPoleHeight);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(flagX + 2, flagY - 4, 6, 0, Math.PI * 2);
      ctx.fill();

      // Flag
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(flagX + 4, flagY + 10);
      ctx.lineTo(flagX + 32, flagY + 22);
      ctx.lineTo(flagX + 4, flagY + 34);
      ctx.closePath();
      ctx.fill();

      // Small Castle at end
      const castleX = flagX + 60;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(castleX, 160, 80, 80);
      ctx.fillStyle = '#475569';
      // Battlements
      ctx.fillRect(castleX, 144, 20, 16);
      ctx.fillRect(castleX + 30, 144, 20, 16);
      ctx.fillRect(castleX + 60, 144, 20, 16);
      // Doorway
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(castleX + 40, 205, 15, Math.PI, 0);
      ctx.rect(castleX + 25, 205, 30, 35);
      ctx.fill();

      // Render Player (Mini Mario)
      if (player.invulnerableTime % 4 < 2) {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        if (player.facing === 'left') {
          ctx.scale(-1, 1);
        }

        // Red Cap
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-8, -12, 16, 5);
        ctx.fillRect(-4, -14, 10, 3);
        // Face skin
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(-7, -7, 13, 8);
        // Eye & Mustache
        ctx.fillStyle = '#451a03';
        ctx.fillRect(2, -6, 2, 3);
        ctx.fillRect(-1, -2, 7, 3);
        // Overalls (Blue)
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(-7, 1, 14, 8);
        // Red sleeves
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-9, 1, 3, 5);
        ctx.fillRect(6, 1, 3, 5);
        // Boots
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-7, 9, 6, 3);
        ctx.fillRect(1, 9, 6, 3);

        ctx.restore();
      }

      // Render Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [status]);

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Top HUD */}
      <div className="w-full max-w-[480px] bg-[#0c1322] border-b border-slate-800 px-3 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400 text-[10px] block">MARIO</span>
            <span className="text-amber-400 font-bold tabular-nums">{score.toString().padStart(6, '0')}</span>
          </div>

          <div className="flex items-center gap-1.5 text-yellow-400">
            <Coins className="w-3.5 h-3.5" />
            <span className="tabular-nums font-bold">x{coins.toString().padStart(2, '0')}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">WORLD</span>
            <span className="text-white font-bold">1-1</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400 text-[10px] block">TIME</span>
            <span className={`font-bold tabular-nums ${timeLeft < 50 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {timeLeft}
            </span>
          </div>

          <div className="flex items-center gap-1 text-red-500">
            <Heart className="w-3.5 h-3.5 fill-red-500" />
            <span className="text-white font-bold">x{lives}</span>
          </div>

          <div className="flex items-center gap-1">
            {status === 'PLAYING' && (
              <button
                onClick={togglePause}
                title="Pause (P)"
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={restartGame}
              title="Restart"
              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full max-w-[480px] aspect-[3/2] bg-sky-300 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block image-rendering-pixelated"
        />

        {/* Title Screen Overlay */}
        {status === 'IDLE' && (
          <div className="absolute inset-0 bg-[#070b14]/90 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
              Super Mini Bros
            </h2>
            <p className="text-xs text-amber-400 font-mono mb-4">WORLD 1-1 PLATFORM QUEST</p>

            <div className="max-w-xs text-xs text-slate-300 space-y-1 mb-6 text-left bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <p>• Jump on enemies from above to squash them.</p>
              <p>• Headbutt [ ? ] blocks to reveal gold coins.</p>
              <p>• Watch out for bottomless chasms.</p>
              <p>• Reach the red flagpole to clear the world!</p>
            </div>

            <button
              onClick={startGame}
              className="py-2.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg hover:brightness-110 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Run</span>
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {status === 'PAUSED' && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2">Game Paused</h3>
            <p className="text-xs text-slate-400 mb-5">Press P or click Resume to continue</p>
            <div className="flex gap-3">
              <button
                onClick={togglePause}
                className="py-2 px-4 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors"
              >
                Resume
              </button>
              <button
                onClick={restartGame}
                className="py-2 px-4 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Restart
              </button>
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {status === 'VICTORY' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <Award className="w-12 h-12 text-yellow-400 mb-2 animate-bounce" />
            <h3 className="text-2xl font-bold text-white mb-1">Course Clear!</h3>
            <p className="text-xs text-emerald-400 font-mono mb-4">YOU REACHED THE CASTLE</p>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl mb-5 text-xs space-y-1.5 w-60">
              <div className="flex justify-between">
                <span className="text-slate-400">Final Score:</span>
                <span className="font-bold text-amber-400 tabular-nums">{score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Coins Collected:</span>
                <span className="font-bold text-white tabular-nums">{coins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">High Score:</span>
                <span className="font-bold text-cyan-400 tabular-nums">{highScore}</span>
              </div>
            </div>

            <button
              onClick={restartGame}
              className="py-2.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg hover:brightness-110 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {status === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <h3 className="text-2xl font-bold text-white mb-1">Game Over</h3>
            <p className="text-xs text-red-300 font-mono mb-4">{gameStateRef.current.gameOverReason}</p>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl mb-5 text-xs space-y-1.5 w-56">
              <div className="flex justify-between">
                <span className="text-slate-400">Score:</span>
                <span className="font-bold text-amber-400 tabular-nums">{score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Coins:</span>
                <span className="font-bold text-white tabular-nums">{coins}</span>
              </div>
            </div>

            <button
              onClick={restartGame}
              className="py-2.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg hover:brightness-110 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>

      {/* Mario Tips */}
      <div className="w-full max-w-[480px] mt-2 px-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>Controls: Arrow Keys / WASD + Space to Jump</span>
        <span className="text-slate-500 font-mono">Best: {highScore}</span>
      </div>
    </div>
  );
};
