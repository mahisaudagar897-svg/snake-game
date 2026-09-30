/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Pause, Trophy, Heart, Zap, Sparkles } from 'lucide-react';
import { sound } from '../services/audio';
import { storage } from '../services/storage';

interface BreakoutGameProps {
  onScoreUpdate?: (score: number) => void;
  externalInput?: string | null;
  onClearInput?: () => void;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  points: number;
  hitsLeft: number;
  maxHits: number;
  isAlive: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: 'MULTI' | 'EXPAND' | 'LASER' | 'LIFE';
  width: number;
  height: number;
}

interface Laser {
  x: number;
  y: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export const BreakoutGame: React.FC<BreakoutGameProps> = ({
  onScoreUpdate,
  externalInput,
  onClearInput,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => storage.getHighScores().breakout);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const [level, setLevel] = useState<number>(1);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY'>('IDLE');
  const [hasLaser, setHasLaser] = useState<boolean>(false);

  // Game Engine Mutable Refs
  const paddleRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    baseWidth: number;
    vx: number;
  }>({
    x: 210,
    y: 470,
    width: 90,
    height: 12,
    baseWidth: 90,
    vx: 0,
  });

  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const laserTimerRef = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // Keyboard left/right tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Generate Bricks for a level
  const generateBricks = useCallback((lvl: number): Brick[] => {
    const bricks: Brick[] = [];
    const rows = 5 + Math.min(3, lvl - 1);
    const cols = 8;
    const padding = 6;
    const brickWidth = (520 - (cols + 1) * padding) / cols;
    const brickHeight = 16;
    const topOffset = 50;

    const rowColors = [
      { color: '#06b6d4', pts: 50, hits: 1 }, // Cyan
      { color: '#f59e0b', pts: 40, hits: 1 }, // Amber
      { color: '#10b981', pts: 30, hits: 1 }, // Emerald
      { color: '#a855f7', pts: 20, hits: 1 }, // Purple
      { color: '#94a3b8', pts: 60, hits: 2 }, // Silver Armor
      { color: '#f43f5e', pts: 50, hits: 1 }, // Rose
      { color: '#38bdf8', pts: 40, hits: 1 },
      { color: '#64748b', pts: 70, hits: 2 },
    ];

    for (let r = 0; r < rows; r++) {
      const rowStyle = rowColors[r % rowColors.length];
      for (let c = 0; c < cols; c++) {
        // Pattern variations for higher levels
        if (lvl > 1 && (r + c) % 5 === 0 && r < 2) continue; // Cool checker pattern

        const x = padding + c * (brickWidth + padding);
        const y = topOffset + r * (brickHeight + padding);
        bricks.push({
          x,
          y,
          width: brickWidth,
          height: brickHeight,
          color: rowStyle.color,
          points: rowStyle.pts,
          hitsLeft: rowStyle.hits,
          maxHits: rowStyle.hits,
          isAlive: true,
        });
      }
    }
    return bricks;
  }, []);

  // Add spark explosion
  const addSparks = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: Math.random() * 3 + 2,
      });
    }
  };

  // Start / Reset Ball
  const resetBall = () => {
    paddleRef.current.x = (520 - paddleRef.current.width) / 2;
    const initialSpeed = 4.8 + level * 0.4;
    const angle = -Math.PI / 4 - (Math.random() * Math.PI) / 2; // Upwards spread
    ballsRef.current = [
      {
        x: 260,
        y: 450,
        vx: Math.cos(angle) * initialSpeed,
        vy: Math.sin(angle) * initialSpeed,
        radius: 6,
        speed: initialSpeed,
      },
    ];
  };

  // Start new game
  const startGame = useCallback(
    (nextLevel = 1) => {
      setLevel(nextLevel);
      setScore(nextLevel === 1 ? 0 : score);
      setIsNewRecord(false);
      setLives(3);
      setHasLaser(false);
      laserTimerRef.current = 0;

      paddleRef.current.width = paddleRef.current.baseWidth;
      bricksRef.current = generateBricks(nextLevel);
      powerUpsRef.current = [];
      lasersRef.current = [];
      particlesRef.current = [];

      resetBall();
      setGameState('PLAYING');
      isPlayingRef.current = true;
      storage.incrementGamesPlayed('breakout');
      sound.move();
      if (onScoreUpdate && nextLevel === 1) onScoreUpdate(0);
    },
    [generateBricks, score, onScoreUpdate]
  );

  // Shoot lasers if powerup is active
  const shootLasers = useCallback(() => {
    if (laserTimerRef.current <= 0) return;
    const paddle = paddleRef.current;
    lasersRef.current.push(
      { x: paddle.x + 8, y: paddle.y - 4, vy: -7 },
      { x: paddle.x + paddle.width - 8, y: paddle.y - 4, vy: -7 }
    );
    sound.laserShoot();
  }, []);

  // Pause / Resume
  const togglePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      isPlayingRef.current = false;
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      isPlayingRef.current = true;
    }
  }, [gameState]);

  // Handle virtual D-pad external inputs
  useEffect(() => {
    if (!externalInput) return;
    if (externalInput === 'LEFT') {
      paddleRef.current.x = Math.max(10, paddleRef.current.x - 30);
    } else if (externalInput === 'RIGHT') {
      paddleRef.current.x = Math.min(520 - paddleRef.current.width - 10, paddleRef.current.x + 30);
    } else if (externalInput === 'ACTION_A') {
      if (gameState === 'IDLE' || gameState === 'GAME_OVER' || gameState === 'VICTORY') {
        startGame();
      } else if (laserTimerRef.current > 0) {
        shootLasers();
      } else {
        togglePause();
      }
    } else if (externalInput === 'PAUSE') {
      togglePause();
    } else if (externalInput === 'RESTART') {
      startGame();
    }
    if (onClearInput) onClearInput();
  }, [externalInput, gameState, onClearInput, shootLasers, startGame, togglePause]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'a', 'd', ' '].includes(k)) {
        e.preventDefault();
      }
      keysPressed.current[k] = true;

      if (k === ' ' && laserTimerRef.current > 0) {
        shootLasers();
      }
      if (k === 'p') {
        togglePause();
      }
      if (k === 'r') {
        startGame();
      }
      if (k === ' ' && (gameState === 'IDLE' || gameState === 'GAME_OVER' || gameState === 'VICTORY')) {
        startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, shootLasers, startGame, togglePause]);

  // Touch and Mouse direct drag on canvas for ultra-smooth paddle movement
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const canvasX = (e.clientX - rect.left) * scaleX;
    paddleRef.current.x = Math.max(
      4,
      Math.min(canvas.width - paddleRef.current.width - 4, canvasX - paddleRef.current.width / 2)
    );
  };

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localIsPlaying = gameState === 'PLAYING';
    isPlayingRef.current = localIsPlaying;

    const gameLoop = () => {
      if (localIsPlaying) {
        // Move paddle from keyboard
        const paddle = paddleRef.current;
        const paddleSpeed = 8;
        if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
          paddle.x = Math.max(4, paddle.x - paddleSpeed);
        }
        if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
          paddle.x = Math.min(canvas.width - paddle.width - 4, paddle.x + paddleSpeed);
        }

        // Update Laser timer
        if (laserTimerRef.current > 0) {
          laserTimerRef.current -= 1;
          if (laserTimerRef.current <= 0) {
            setHasLaser(false);
          }
        }

        // Update Lasers
        for (let i = lasersRef.current.length - 1; i >= 0; i--) {
          const l = lasersRef.current[i];
          l.y += l.vy;
          if (l.y < 0) {
            lasersRef.current.splice(i, 1);
            continue;
          }

          // Check laser brick hits
          for (let b = 0; b < bricksRef.current.length; b++) {
            const brick = bricksRef.current[b];
            if (!brick.isAlive) continue;
            if (
              l.x >= brick.x &&
              l.x <= brick.x + brick.width &&
              l.y >= brick.y &&
              l.y <= brick.y + brick.height
            ) {
              lasersRef.current.splice(i, 1);
              hitBrick(brick);
              break;
            }
          }
        }

        // Update Powerups
        for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
          const pu = powerUpsRef.current[i];
          pu.y += pu.vy;

          // Catch powerup with paddle
          if (
            pu.y + pu.height >= paddle.y &&
            pu.y <= paddle.y + paddle.height &&
            pu.x + pu.width >= paddle.x &&
            pu.x <= paddle.x + paddle.width
          ) {
            sound.powerup();
            applyPowerUp(pu.type);
            powerUpsRef.current.splice(i, 1);
            continue;
          }

          // Off bottom of screen
          if (pu.y > canvas.height) {
            powerUpsRef.current.splice(i, 1);
          }
        }

        // Update Balls
        for (let i = ballsRef.current.length - 1; i >= 0; i--) {
          const ball = ballsRef.current[i];
          ball.x += ball.vx;
          ball.y += ball.vy;

          // Side wall collision
          if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx);
            sound.wallBounce();
          } else if (ball.x + ball.radius >= canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            sound.wallBounce();
          }

          // Top wall collision
          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            sound.wallBounce();
          }

          // Paddle collision
          if (
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.height &&
            ball.x >= paddle.x - ball.radius &&
            ball.x <= paddle.x + paddle.width + ball.radius &&
            ball.vy > 0
          ) {
            sound.paddleBounce();
            // Calculate deflection angle based on hit position
            const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
            const maxAngle = (Math.PI / 180) * 60; // 60 degrees max
            const angle = hitPoint * maxAngle;

            const currentSpeed = Math.hypot(ball.vx, ball.vy);
            ball.vx = currentSpeed * Math.sin(angle);
            ball.vy = -currentSpeed * Math.cos(angle);
            ball.y = paddle.y - ball.radius - 1;

            addSparks(ball.x, paddle.y, '#38bdf8', 6);
          }

          // Brick collisions
          for (let b = 0; b < bricksRef.current.length; b++) {
            const brick = bricksRef.current[b];
            if (!brick.isAlive) continue;

            if (
              ball.x + ball.radius >= brick.x &&
              ball.x - ball.radius <= brick.x + brick.width &&
              ball.y + ball.radius >= brick.y &&
              ball.y - ball.radius <= brick.y + brick.height
            ) {
              // Determine collision side
              const overlapLeft = ball.x + ball.radius - brick.x;
              const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
              const overlapTop = ball.y + ball.radius - brick.y;
              const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

              const minOverlapX = Math.min(overlapLeft, overlapRight);
              const minOverlapY = Math.min(overlapTop, overlapBottom);

              if (minOverlapX < minOverlapY) {
                ball.vx = -ball.vx;
              } else {
                ball.vy = -ball.vy;
              }

              hitBrick(brick);
              break;
            }
          }

          // Ball fell through bottom
          if (ball.y - ball.radius > canvas.height) {
            ballsRef.current.splice(i, 1);
          }
        }

        // If no balls remaining, lose a life
        if (ballsRef.current.length === 0) {
          sound.lifeLost();
          setLives((prevLives) => {
            const nextLives = prevLives - 1;
            if (nextLives <= 0) {
              // Game Over
              endGame();
            } else {
              // Reset Ball
              resetBall();
              paddleRef.current.width = paddleRef.current.baseWidth;
            }
            return nextLives;
          });
        }

        // Check Victory (all bricks broken)
        const aliveBricks = bricksRef.current.filter((b) => b.isAlive);
        if (aliveBricks.length === 0 && bricksRef.current.length > 0) {
          sound.victory();
          if (level < 3) {
            // Next level!
            startGame(level + 1);
          } else {
            // Completed all levels!
            localIsPlaying = false;
            isPlayingRef.current = false;
            setGameState('VICTORY');
          }
        }
      }

      // Render Canvas
      render(ctx, canvas.width, canvas.height);

      if (isPlayingRef.current) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
      }
    };

    // Brick Hit Handler
    const hitBrick = (brick: Brick) => {
      brick.hitsLeft -= 1;
      sound.brickHit(brick.hitsLeft);

      if (brick.hitsLeft <= 0) {
        brick.isAlive = false;
        addSparks(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 16);
        storage.recordBricks(1);

        setScore((prev) => {
          const newScore = prev + brick.points;
          if (onScoreUpdate) onScoreUpdate(newScore);
          return newScore;
        });

        // Chance to spawn power-up
        if (Math.random() < 0.24) {
          const types: PowerUp['type'][] = ['MULTI', 'EXPAND', 'LASER', 'LIFE'];
          const chosen = types[Math.floor(Math.random() * types.length)];
          powerUpsRef.current.push({
            x: brick.x + brick.width / 2 - 10,
            y: brick.y + brick.height / 2,
            vy: 2.2,
            type: chosen,
            width: 22,
            height: 12,
          });
        }
      } else {
        // Armored brick got cracked
        addSparks(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 6);
      }
    };

    // PowerUp Applier
    const applyPowerUp = (type: PowerUp['type']) => {
      if (type === 'MULTI') {
        // Split each current ball into 2 additional balls
        const newBalls: Ball[] = [];
        ballsRef.current.forEach((b) => {
          newBalls.push({
            ...b,
            vx: b.vx * 0.9 + 1.5,
            vy: b.vy,
          });
          newBalls.push({
            ...b,
            vx: b.vx * 0.9 - 1.5,
            vy: b.vy,
          });
        });
        ballsRef.current = [...ballsRef.current, ...newBalls];
      } else if (type === 'EXPAND') {
        paddleRef.current.width = Math.min(150, paddleRef.current.width + 30);
      } else if (type === 'LASER') {
        setHasLaser(true);
        laserTimerRef.current = 400; // ~6.5 seconds of laser
      } else if (type === 'LIFE') {
        setLives((l) => Math.min(5, l + 1));
      }
    };

    const endGame = () => {
      localIsPlaying = false;
      isPlayingRef.current = false;
      setGameState('GAME_OVER');
      sound.gameOver();

      setScore((finalScore) => {
        const isRecord = storage.saveHighScore('breakout', finalScore);
        if (isRecord) {
          setIsNewRecord(true);
          setHighScore(finalScore);
          sound.victory();
        }
        return finalScore;
      });
    };

    if (gameState === 'PLAYING') {
      localIsPlaying = true;
      isPlayingRef.current = true;
      animationFrameId.current = requestAnimationFrame(gameLoop);
    } else {
      render(ctx, canvas.width, canvas.height);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, level, onScoreUpdate, resetBall, startGame]);

  // Render function
  const render = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // Subtle starfield/grid lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Outer border
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Render Bricks
    bricksRef.current.forEach((brick) => {
      if (!brick.isAlive) return;

      ctx.save();
      ctx.shadowColor = brick.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = brick.color;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
      ctx.fill();

      // Armored crack indicator
      if (brick.maxHits > 1 && brick.hitsLeft === 1) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(brick.x + 4, brick.y + 4);
        ctx.lineTo(brick.x + brick.width / 2, brick.y + brick.height - 4);
        ctx.lineTo(brick.x + brick.width - 4, brick.y + 4);
        ctx.stroke();
      }

      // Brick gloss highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, 3);
      ctx.restore();
    });

    // Render PowerUps
    powerUpsRef.current.forEach((pu) => {
      ctx.save();
      let color = '#38bdf8';
      let symbol = 'M';
      if (pu.type === 'EXPAND') {
        color = '#10b981';
        symbol = '↔';
      } else if (pu.type === 'LASER') {
        color = '#f43f5e';
        symbol = '⚡';
      } else if (pu.type === 'LIFE') {
        color = '#ec4899';
        symbol = '♥';
      }

      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(pu.x, pu.y, pu.width, pu.height, 4);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, pu.x + pu.width / 2, pu.y + pu.height / 2 + 1);
      ctx.restore();
    });

    // Render Lasers
    lasersRef.current.forEach((l) => {
      ctx.save();
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(l.x - 2, l.y, 4, 10);
      ctx.restore();
    });

    // Render Paddle
    const paddle = paddleRef.current;
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 16;
    // Paddle body
    const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
    ctx.fill();

    // Laser cannons indicator
    if (laserTimerRef.current > 0) {
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(paddle.x + 2, paddle.y - 4, 6, 6);
      ctx.fillRect(paddle.x + paddle.width - 8, paddle.y - 4, 6, 6);
    }
    ctx.restore();

    // Render Balls
    ballsRef.current.forEach((ball) => {
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Particles
    particlesRef.current.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      if (p.alpha <= 0) {
        particlesRef.current.splice(idx, 1);
      }
    });
    ctx.globalAlpha = 1;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto select-none">
      {/* HUD Header */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0f172a]/90 border border-slate-800 rounded-t-xl text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px]">SCORE</span>
            <span className="text-cyan-400 font-bold text-sm tracking-wide font-mono-numbers">
              {score.toString().padStart(5, '0')}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> BEST
            </span>
            <span className="text-amber-400 font-bold text-sm tracking-wide font-mono-numbers">
              {highScore.toString().padStart(5, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Lives hearts */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 rounded border border-slate-700/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Level indicator */}
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 rounded text-slate-300">
            <span>LVL {level}</span>
          </div>

          {/* Laser power status */}
          {hasLaser && (
            <div className="flex items-center gap-1 px-2 py-1 bg-rose-950/60 text-rose-400 border border-rose-800/50 rounded animate-pulse">
              <Zap className="w-3 h-3" />
              <span>LASER</span>
            </div>
          )}

          <button
            onClick={togglePause}
            disabled={gameState === 'IDLE' || gameState === 'GAME_OVER' || gameState === 'VICTORY'}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 transition-colors"
          >
            {gameState === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Screen Canvas Area */}
      <div className="relative w-full aspect-square bg-[#060a14] border-x border-b border-slate-800 rounded-b-xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={520}
          height={520}
          onPointerMove={handlePointerMove}
          className="w-full h-full block cursor-ew-resize object-contain touch-none"
        />

        {/* Start / Idle Screen Overlay */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
              <Play className="w-6 h-6 text-cyan-400 ml-0.5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-1">Brick Breaker Quest</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-5">
              Smash colored cyber bricks with angled ball bounces. Catch falling multi-ball and laser powerups!
            </p>
            <button
              onClick={() => startGame(1)}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-105"
            >
              Launch Ball
            </button>
            <span className="text-[11px] text-slate-400 mt-4">
              Mouse Drag, Arrow Keys, or Touch D-Pad to move paddle
            </span>
          </div>
        )}

        {/* Paused Screen Overlay */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-lg font-bold tracking-tight text-cyan-400 mb-2">GAME PAUSED</h3>
            <div className="flex gap-2 mt-2">
              <button
                onClick={togglePause}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
              >
                Resume
              </button>
              <button
                onClick={() => startGame(1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors"
              >
                Restart
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-xl font-bold tracking-tight text-rose-400 mb-1">BALL DEPLETED</h3>
            <p className="text-xs text-slate-400 mb-4">No remaining reserve balls</p>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 w-48 mb-5">
              <div className="flex justify-between text-xs py-1 border-b border-slate-800">
                <span className="text-slate-400">Final Score</span>
                <span className="text-white font-bold font-mono">{score}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-400">High Score</span>
                <span className="text-amber-400 font-bold font-mono">{highScore}</span>
              </div>
            </div>

            {isNewRecord && (
              <span className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-md mb-4 animate-pulse">
                ★ NEW HIGH SCORE RECORD! ★
              </span>
            )}

            <button
              onClick={() => startGame(1)}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/25 transition-transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
        )}

        {/* Victory Screen (Completed all levels!) */}
        {gameState === 'VICTORY' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-amber-400 mb-1">ALL LEVELS CLEARED!</h3>
            <p className="text-xs text-slate-400 mb-4">Master of the Cyber Breaker</p>
            <p className="text-sm font-bold text-white mb-5 font-mono">Final Score: {score}</p>
            <button
              onClick={() => startGame(1)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-amber-500/25 transition-transform hover:scale-105"
            >
              Play Victory Loop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
