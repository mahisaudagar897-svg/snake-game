/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Pause, Trophy, Zap, Shield, Heart } from 'lucide-react';
import { sound } from '../services/audio';
import { storage } from '../services/storage';

interface SnakeGameProps {
  onScoreUpdate?: (score: number) => void;
  externalInput?: string | null;
  onClearInput?: () => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point {
  x: number;
  y: number;
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

const GRID_SIZE = 22; // 22x22 cells

export const SnakeGame: React.FC<SnakeGameProps> = ({
  onScoreUpdate,
  externalInput,
  onClearInput,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => storage.getHighScores().snake);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'>('IDLE');
  const [speedLevel, setSpeedLevel] = useState<number>(1);
  const [wrapWalls, setWrapWalls] = useState<boolean>(true);

  // Mutable refs for requestAnimationFrame loop
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const directionRef = useRef<Direction>('UP');
  const nextDirectionRef = useRef<Direction>('UP');
  const foodRef = useRef<Point>({ x: 5, y: 5 });
  const bonusFoodRef = useRef<{ x: number; y: number; timer: number } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastTickRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const animationFrameId = useRef<number | null>(null);

  // Generate safe food position
  const spawnFood = useCallback((currentSnake: Point[]): Point => {
    let valid = false;
    let newPt: Point = { x: 0, y: 0 };
    while (!valid) {
      newPt = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      valid = !currentSnake.some((seg) => seg.x === newPt.x && seg.y === newPt.y);
    }
    return newPt;
  }, []);

  // Add spark particles
  const addSparks = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: Math.random() * 3 + 2,
      });
    }
  };

  // Start new game
  const startGame = useCallback(() => {
    const initialSnake: Point[] = [
      { x: 11, y: 11 },
      { x: 11, y: 12 },
      { x: 11, y: 13 },
    ];
    snakeRef.current = initialSnake;
    directionRef.current = 'UP';
    nextDirectionRef.current = 'UP';
    foodRef.current = spawnFood(initialSnake);
    bonusFoodRef.current = null;
    particlesRef.current = [];
    setScore(0);
    setIsNewRecord(false);
    setSpeedLevel(1);
    setGameState('PLAYING');
    isPlayingRef.current = true;
    lastTickRef.current = performance.now();
    sound.move();
    storage.incrementGamesPlayed('snake');
    if (onScoreUpdate) onScoreUpdate(0);
  }, [spawnFood, onScoreUpdate]);

  // Pause toggle
  const togglePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      isPlayingRef.current = false;
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      isPlayingRef.current = true;
      lastTickRef.current = performance.now();
    }
  }, [gameState]);

  // Direction changer with 180-degree protection
  const changeDirection = useCallback((newDir: Direction) => {
    const current = directionRef.current;
    if (
      (newDir === 'UP' && current !== 'DOWN') ||
      (newDir === 'DOWN' && current !== 'UP') ||
      (newDir === 'LEFT' && current !== 'RIGHT') ||
      (newDir === 'RIGHT' && current !== 'LEFT')
    ) {
      nextDirectionRef.current = newDir;
    }
  }, []);

  // Handle external input from Virtual D-pad
  useEffect(() => {
    if (!externalInput) return;
    if (externalInput === 'UP') changeDirection('UP');
    else if (externalInput === 'DOWN') changeDirection('DOWN');
    else if (externalInput === 'LEFT') changeDirection('LEFT');
    else if (externalInput === 'RIGHT') changeDirection('RIGHT');
    else if (externalInput === 'ACTION_A') {
      if (gameState === 'IDLE' || gameState === 'GAME_OVER') startGame();
      else if (gameState === 'PLAYING' || gameState === 'PAUSED') togglePause();
    } else if (externalInput === 'PAUSE') {
      togglePause();
    } else if (externalInput === 'RESTART') {
      startGame();
    }
    if (onClearInput) onClearInput();
  }, [externalInput, changeDirection, gameState, onClearInput, startGame, togglePause]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scroll on arrow keys / space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          changeDirection('UP');
          break;
        case 'arrowdown':
        case 's':
          changeDirection('DOWN');
          break;
        case 'arrowleft':
        case 'a':
          changeDirection('LEFT');
          break;
        case 'arrowright':
        case 'd':
          changeDirection('RIGHT');
          break;
        case ' ':
        case 'p':
          if (gameState === 'IDLE' || gameState === 'GAME_OVER') startGame();
          else togglePause();
          break;
        case 'r':
          startGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, gameState, startGame, togglePause]);

  // Core Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localIsPlaying = gameState === 'PLAYING';
    isPlayingRef.current = localIsPlaying;

    const gameLoop = (timestamp: number) => {
      // Tick rate increases with score/level
      const currentScore = snakeRef.current.length * 10 - 30;
      const calculatedLevel = Math.min(10, Math.floor(currentScore / 60) + 1);
      setSpeedLevel(calculatedLevel);

      const baseInterval = 135;
      const tickInterval = Math.max(55, baseInterval - calculatedLevel * 8);

      if (localIsPlaying && timestamp - lastTickRef.current > tickInterval) {
        lastTickRef.current = timestamp;

        // Move snake
        directionRef.current = nextDirectionRef.current;
        const head = { ...snakeRef.current[0] };

        switch (directionRef.current) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Wall collisions
        if (wrapWalls) {
          if (head.x < 0) head.x = GRID_SIZE - 1;
          if (head.x >= GRID_SIZE) head.x = 0;
          if (head.y < 0) head.y = GRID_SIZE - 1;
          if (head.y >= GRID_SIZE) head.y = 0;
        } else {
          if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            // Collision with wall
            endGame();
            return;
          }
        }

        // Self collision check
        const selfHit = snakeRef.current.some((seg) => seg.x === head.x && seg.y === head.y);
        if (selfHit) {
          endGame();
          return;
        }

        const newSnake = [head, ...snakeRef.current];

        // Check regular food collision
        const cellSize = canvas.width / GRID_SIZE;
        if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
          sound.eat();
          addSparks(head.x * cellSize + cellSize / 2, head.y * cellSize + cellSize / 2, '#10b981', 14);
          foodRef.current = spawnFood(newSnake);

          const newScoreVal = (newSnake.length - 3) * 15;
          setScore(newScoreVal);
          if (onScoreUpdate) onScoreUpdate(newScoreVal);
          storage.recordSnakeLength(newSnake.length);

          // Chance to spawn special bonus star if none active
          if (!bonusFoodRef.current && Math.random() < 0.28) {
            const bonusPt = spawnFood(newSnake);
            bonusFoodRef.current = { x: bonusPt.x, y: bonusPt.y, timer: 65 };
          }
        } else if (
          bonusFoodRef.current &&
          head.x === bonusFoodRef.current.x &&
          head.y === bonusFoodRef.current.y
        ) {
          // Bonus food collected!
          sound.bonus();
          addSparks(head.x * cellSize + cellSize / 2, head.y * cellSize + cellSize / 2, '#fbbf24', 24);
          const bonusPts = 60;
          const newScoreVal = (newSnake.length - 3) * 15 + bonusPts;
          setScore(newScoreVal);
          if (onScoreUpdate) onScoreUpdate(newScoreVal);
          bonusFoodRef.current = null;
        } else {
          newSnake.pop(); // Remove tail
        }

        // Update bonus food timer
        if (bonusFoodRef.current) {
          bonusFoodRef.current.timer -= 1;
          if (bonusFoodRef.current.timer <= 0) {
            bonusFoodRef.current = null;
          }
        }

        snakeRef.current = newSnake;
      }

      // Render Frame
      render(ctx, canvas.width, canvas.height);

      if (isPlayingRef.current) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
      }
    };

    const endGame = () => {
      localIsPlaying = false;
      isPlayingRef.current = false;
      setGameState('GAME_OVER');
      sound.gameOver();

      const finalScore = (snakeRef.current.length - 3) * 15;
      const isRecord = storage.saveHighScore('snake', finalScore);
      if (isRecord) {
        setIsNewRecord(true);
        setHighScore(finalScore);
        sound.victory();
      }
    };

    if (gameState === 'PLAYING') {
      localIsPlaying = true;
      isPlayingRef.current = true;
      animationFrameId.current = requestAnimationFrame(gameLoop);
    } else {
      // Single render for idle / paused / gameover preview
      render(ctx, canvas.width, canvas.height);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, wrapWalls, spawnFood, onScoreUpdate]);

  // Render function
  const render = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const cellSize = width / GRID_SIZE;

    // Background
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, width, height);

    // Subtle arena grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    // Outer border
    ctx.strokeStyle = wrapWalls ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Draw Particles
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

    // Draw Regular Food (Pulsing emerald orb)
    const fx = foodRef.current.x * cellSize + cellSize / 2;
    const fy = foodRef.current.y * cellSize + cellSize / 2;
    const pulse = Math.sin(Date.now() / 150) * 1.5;

    ctx.save();
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(fx, fy, cellSize / 2.6 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(fx - 2, fy - 2, cellSize / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Bonus Food (Golden Spinning Star / Ring)
    if (bonusFoodRef.current) {
      const bfx = bonusFoodRef.current.x * cellSize + cellSize / 2;
      const bfy = bonusFoodRef.current.y * cellSize + cellSize / 2;
      const starScale = Math.sin(Date.now() / 90) * 2;

      ctx.save();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(bfx, bfy, cellSize / 2.2 + starScale, 0, Math.PI * 2);
      ctx.fill();

      // Bonus inner core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(bfx, bfy, cellSize / 4, 0, Math.PI * 2);
      ctx.fill();

      // Timer ring around bonus
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const progress = bonusFoodRef.current.timer / 65;
      ctx.arc(bfx, bfy, cellSize / 1.7, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Snake
    const snake = snakeRef.current;
    if (snake.length > 0) {
      for (let i = snake.length - 1; i >= 0; i--) {
        const seg = snake[i];
        const segX = seg.x * cellSize;
        const segY = seg.y * cellSize;
        const isHead = i === 0;

        ctx.save();
        if (isHead) {
          // Snake Head
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.roundRect(segX + 1, segY + 1, cellSize - 2, cellSize - 2, 6);
          ctx.fill();

          // Cute Eyes on Snake Head
          ctx.fillStyle = '#0f172a';
          let eye1 = { x: segX + 5, y: segY + 5 };
          let eye2 = { x: segX + cellSize - 8, y: segY + 5 };
          if (directionRef.current === 'DOWN') {
            eye1 = { x: segX + 5, y: segY + cellSize - 8 };
            eye2 = { x: segX + cellSize - 8, y: segY + cellSize - 8 };
          } else if (directionRef.current === 'LEFT') {
            eye1 = { x: segX + 5, y: segY + 5 };
            eye2 = { x: segX + 5, y: segY + cellSize - 8 };
          } else if (directionRef.current === 'RIGHT') {
            eye1 = { x: segX + cellSize - 8, y: segY + 5 };
            eye2 = { x: segX + cellSize - 8, y: segY + cellSize - 8 };
          }
          ctx.beginPath();
          ctx.arc(eye1.x, eye1.y, 2.2, 0, Math.PI * 2);
          ctx.arc(eye2.x, eye2.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Snake Body Segments with gradient fade
          const alpha = 0.5 + (1 - i / snake.length) * 0.5;
          ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.roundRect(segX + 1.5, segY + 1.5, cellSize - 3, cellSize - 3, 4);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto select-none">
      {/* HUD Header */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0f172a]/90 border border-slate-800 rounded-t-xl text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px]">SCORE</span>
            <span className="text-emerald-400 font-bold text-sm tracking-wide font-mono-numbers">
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded border border-slate-700/60">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">SPD {speedLevel}</span>
          </div>

          <button
            onClick={() => setWrapWalls((v) => !v)}
            title={wrapWalls ? 'Walls: Pass-through (Safe)' : 'Walls: Solid (Deadly)'}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors border ${
              wrapWalls
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                : 'bg-rose-950/40 text-rose-400 border-rose-800/50'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>{wrapWalls ? 'WARP' : 'SOLID'}</span>
          </button>

          <button
            onClick={togglePause}
            disabled={gameState === 'IDLE' || gameState === 'GAME_OVER'}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 transition-colors"
          >
            {gameState === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Screen Canvas Area with Overlays */}
      <div className="relative w-full aspect-square bg-[#080d1a] border-x border-b border-slate-800 rounded-b-xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={520}
          height={520}
          className="w-full h-full block object-contain"
        />

        {/* Start / Idle Screen Overlay */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
              <Play className="w-6 h-6 text-emerald-400 ml-0.5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-1">Neon Cyber Snake</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-5">
              Eat glowing cyber orbs to grow. Catch special golden stars for 3x bonus points.
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-105"
            >
              Start Game
            </button>
            <span className="text-[11px] text-slate-400 mt-4">
              Press [SPACE] or Click D-PAD to play
            </span>
          </div>
        )}

        {/* Paused Screen Overlay */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-lg font-bold tracking-tight text-amber-400 mb-2">GAME PAUSED</h3>
            <p className="text-xs text-slate-400 mb-4">Take a breather, neon pilot</p>
            <div className="flex gap-2">
              <button
                onClick={togglePause}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
              >
                Resume
              </button>
              <button
                onClick={startGame}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors"
              >
                Restart
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
              <Heart className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-rose-400 mb-1">SYSTEM OVERHEAT</h3>
            <p className="text-xs text-slate-400 mb-4">Collision detected in cyberspace</p>

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
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
