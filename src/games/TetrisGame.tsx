/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Pause, Trophy, ArrowDown, ArrowUp } from 'lucide-react';
import { sound } from '../services/audio';
import { storage } from '../services/storage';

interface TetrisGameProps {
  onScoreUpdate?: (score: number) => void;
  externalInput?: string | null;
  onClearInput?: () => void;
}

const COLS = 10;
const ROWS = 20;

// Tetromino definitions
type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

interface TetrominoDef {
  shape: number[][];
  color: string;
}

const TETROMINOES: Record<TetrominoType, TetrominoDef> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#06b6d4', // Cyan
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#3b82f6', // Blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f97316', // Orange
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#eab308', // Yellow
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#10b981', // Emerald
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a855f7', // Purple
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#ef4444', // Red
  },
};

const TETRO_TYPES: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

interface ActivePiece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

export const TetrisGame: React.FC<TetrisGameProps> = ({
  onScoreUpdate,
  externalInput,
  onClearInput,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // React State
  const [score, setScore] = useState<number>(0);
  const [lines, setLines] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(() => storage.getHighScores().tetris);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'>('IDLE');

  // Game Engine Refs
  const gridRef = useRef<(string | null)[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const currentPieceRef = useRef<ActivePiece | null>(null);
  const nextPiecesRef = useRef<TetrominoType[]>([]);
  const holdPieceRef = useRef<TetrominoType | null>(null);
  const canHoldRef = useRef<boolean>(true);
  const lastDropTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const animationFrameId = useRef<number | null>(null);

  // Helper: Get random tetromino
  const getRandomPieceType = (): TetrominoType => {
    return TETRO_TYPES[Math.floor(Math.random() * TETRO_TYPES.length)];
  };

  // Helper: Rotate matrix clockwise
  const rotateMatrix = (matrix: number[][]): number[][] => {
    const N = matrix.length;
    const result: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[c][N - 1 - r] = matrix[r][c];
      }
    }
    return result;
  };

  // Check collision
  const checkCollision = useCallback(
    (piece: ActivePiece, offsetX = 0, offsetY = 0, customShape?: number[][]): boolean => {
      const shape = customShape || piece.shape;
      const grid = gridRef.current;

      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] !== 0) {
            const newX = piece.x + c + offsetX;
            const newY = piece.y + r + offsetY;

            // Boundaries
            if (newX < 0 || newX >= COLS || newY >= ROWS) {
              return true;
            }
            // Grid collision (ignore if above board)
            if (newY >= 0 && grid[newY][newX] !== null) {
              return true;
            }
          }
        }
      }
      return false;
    },
    []
  );

  // Spawn new piece
  const spawnPiece = useCallback((): boolean => {
    if (nextPiecesRef.current.length < 3) {
      nextPiecesRef.current.push(getRandomPieceType(), getRandomPieceType(), getRandomPieceType());
    }

    const type = nextPiecesRef.current.shift()!;
    const def = TETROMINOES[type];
    const newPiece: ActivePiece = {
      type,
      shape: def.shape.map((row) => [...row]),
      x: Math.floor((COLS - def.shape[0].length) / 2),
      y: type === 'I' ? -1 : 0,
      color: def.color,
    };

    // Check if new piece immediately collides (Game Over)
    if (checkCollision(newPiece)) {
      return false;
    }

    currentPieceRef.current = newPiece;
    canHoldRef.current = true;
    return true;
  }, [checkCollision]);

  // Start new game
  const startGame = useCallback(() => {
    gridRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    nextPiecesRef.current = [getRandomPieceType(), getRandomPieceType(), getRandomPieceType()];
    holdPieceRef.current = null;
    canHoldRef.current = true;
    setScore(0);
    setLines(0);
    setLevel(1);
    setIsNewRecord(false);
    setGameState('PLAYING');
    isPlayingRef.current = true;
    lastDropTimeRef.current = performance.now();

    spawnPiece();
    storage.incrementGamesPlayed('tetris');
    sound.move();
    if (onScoreUpdate) onScoreUpdate(0);
  }, [onScoreUpdate, spawnPiece]);

  // Pause toggle
  const togglePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      isPlayingRef.current = false;
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      isPlayingRef.current = true;
      lastDropTimeRef.current = performance.now();
    }
  }, [gameState]);

  // Hold piece
  const handleHold = useCallback(() => {
    if (!canHoldRef.current || !currentPieceRef.current) return;
    const current = currentPieceRef.current;
    sound.rotate();

    if (holdPieceRef.current === null) {
      holdPieceRef.current = current.type;
      spawnPiece();
    } else {
      const temp = holdPieceRef.current;
      holdPieceRef.current = current.type;
      const def = TETROMINOES[temp];
      currentPieceRef.current = {
        type: temp,
        shape: def.shape.map((r) => [...r]),
        x: Math.floor((COLS - def.shape[0].length) / 2),
        y: temp === 'I' ? -1 : 0,
        color: def.color,
      };
    }
    canHoldRef.current = false;
  }, [spawnPiece]);

  // Move piece
  const movePiece = useCallback(
    (dx: number, dy: number): boolean => {
      const piece = currentPieceRef.current;
      if (!piece || !isPlayingRef.current) return false;

      if (!checkCollision(piece, dx, dy)) {
        piece.x += dx;
        piece.y += dy;
        sound.move();
        return true;
      }
      return false;
    },
    [checkCollision]
  );

  // Rotate piece with wall kicks
  const rotatePiece = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece || !isPlayingRef.current) return;
    const rotated = rotateMatrix(piece.shape);

    // Standard kick tests: [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0]
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!checkCollision(piece, kick, 0, rotated)) {
        piece.shape = rotated;
        piece.x += kick;
        sound.rotate();
        return;
      }
    }
  }, [checkCollision]);

  // Lock piece and clear completed lines
  const lockPiece = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece) return;
    const grid = gridRef.current;

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] !== 0) {
          const y = piece.y + r;
          const x = piece.x + c;
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            grid[y][x] = piece.color;
          }
        }
      }
    }

    sound.drop();

    // Line clears
    let clearedLines = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      const isComplete = grid[r].every((cell) => cell !== null);
      if (isComplete) {
        clearedLines++;
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(null));
        r++; // check same row index again after splice
      }
    }

    if (clearedLines > 0) {
      sound.lineClear(clearedLines);
      storage.recordLines(clearedLines);

      // Scoring formula
      const linePoints = [0, 100, 300, 500, 800];
      const addedScore = (linePoints[clearedLines] || 100) * level;

      setScore((s) => {
        const nextScore = s + addedScore;
        if (onScoreUpdate) onScoreUpdate(nextScore);
        return nextScore;
      });

      setLines((l) => {
        const nextLines = l + clearedLines;
        setLevel(Math.floor(nextLines / 10) + 1);
        return nextLines;
      });
    }

    // Spawn next piece or Game Over
    const success = spawnPiece();
    if (!success) {
      isPlayingRef.current = false;
      setGameState('GAME_OVER');
      sound.gameOver();

      setScore((finalScore) => {
        const isRecord = storage.saveHighScore('tetris', finalScore);
        if (isRecord) {
          setIsNewRecord(true);
          setHighScore(finalScore);
          sound.victory();
        }
        return finalScore;
      });
    }
  }, [level, onScoreUpdate, spawnPiece]);

  // Hard drop piece directly to the bottom
  const hardDrop = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece || !isPlayingRef.current) return;

    let dropDist = 0;
    while (!checkCollision(piece, 0, dropDist + 1)) {
      dropDist++;
    }
    piece.y += dropDist;
    setScore((s) => s + dropDist * 2);
    lockPiece();
  }, [checkCollision, lockPiece]);

  // Handle external D-pad controls
  useEffect(() => {
    if (!externalInput) return;
    if (externalInput === 'LEFT') movePiece(-1, 0);
    else if (externalInput === 'RIGHT') movePiece(1, 0);
    else if (externalInput === 'DOWN') movePiece(0, 1);
    else if (externalInput === 'UP' || externalInput === 'ACTION_B') rotatePiece();
    else if (externalInput === 'ACTION_A') {
      if (gameState === 'IDLE' || gameState === 'GAME_OVER') startGame();
      else hardDrop();
    } else if (externalInput === 'PAUSE') togglePause();
    else if (externalInput === 'RESTART') startGame();

    if (onClearInput) onClearInput();
  }, [
    externalInput,
    gameState,
    hardDrop,
    movePiece,
    onClearInput,
    rotatePiece,
    startGame,
    togglePause,
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowdown', 'arrowup', ' ', 'c', 'p', 'r'].includes(k)) {
        e.preventDefault();
      }

      if (k === 'arrowleft' || k === 'a') movePiece(-1, 0);
      else if (k === 'arrowright' || k === 'd') movePiece(1, 0);
      else if (k === 'arrowdown' || k === 's') movePiece(0, 1);
      else if (k === 'arrowup' || k === 'w') rotatePiece();
      else if (k === ' ') {
        if (gameState === 'IDLE' || gameState === 'GAME_OVER') startGame();
        else hardDrop();
      } else if (k === 'c') handleHold();
      else if (k === 'p') togglePause();
      else if (k === 'r') startGame();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleHold, hardDrop, movePiece, rotatePiece, startGame, togglePause]);

  // Calculate Ghost Piece position
  const getGhostY = (): number => {
    const piece = currentPieceRef.current;
    if (!piece) return 0;
    let ghostY = piece.y;
    while (!checkCollision(piece, 0, ghostY - piece.y + 1)) {
      ghostY++;
    }
    return ghostY;
  };

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localIsPlaying = gameState === 'PLAYING';
    isPlayingRef.current = localIsPlaying;

    const gameLoop = (timestamp: number) => {
      // Speed scales with level
      const dropSpeed = Math.max(100, 750 - (level - 1) * 65);

      if (localIsPlaying && timestamp - lastDropTimeRef.current > dropSpeed) {
        lastDropTimeRef.current = timestamp;
        const moved = movePiece(0, 1);
        if (!moved) {
          lockPiece();
        }
      }

      render(ctx, canvas.width, canvas.height);
      renderSubCanvases();

      if (isPlayingRef.current) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
      }
    };

    if (gameState === 'PLAYING') {
      localIsPlaying = true;
      isPlayingRef.current = true;
      animationFrameId.current = requestAnimationFrame(gameLoop);
    } else {
      render(ctx, canvas.width, canvas.height);
      renderSubCanvases();
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, level, lockPiece, movePiece]);

  // Render Preview Sub-Canvases (Next and Hold)
  const renderSubCanvases = () => {
    // Next Piece
    if (nextCanvasRef.current && nextPiecesRef.current.length > 0) {
      const nextCtx = nextCanvasRef.current.getContext('2d');
      if (nextCtx) {
        const nextType = nextPiecesRef.current[0];
        const def = TETROMINOES[nextType];
        drawMiniTetromino(nextCtx, def.shape, def.color, 80, 80);
      }
    }

    // Hold Piece
    if (holdCanvasRef.current) {
      const holdCtx = holdCanvasRef.current.getContext('2d');
      if (holdCtx) {
        if (holdPieceRef.current) {
          const def = TETROMINOES[holdPieceRef.current];
          drawMiniTetromino(holdCtx, def.shape, def.color, 80, 80);
        } else {
          holdCtx.clearRect(0, 0, 80, 80);
        }
      }
    }
  };

  const drawMiniTetromino = (
    ctx: CanvasRenderingContext2D,
    shape: number[][],
    color: string,
    w: number,
    h: number
  ) => {
    ctx.clearRect(0, 0, w, h);
    const size = 15;
    const offsetX = (w - shape[0].length * size) / 2;
    const offsetY = (h - shape.length * size) / 2;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(offsetX + c * size, offsetY + r * size, size - 1.5, size - 1.5, 3);
          ctx.fill();
        }
      }
    }
  };

  // Render Game Board
  const render = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const cellSize = width / COLS;

    // Background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // Matrix Grid Lines
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.05)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, height);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(width, r * cellSize);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Draw Locked Grid
    const grid = gridRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = grid[r][c];
        if (color) {
          drawBlock(ctx, c * cellSize, r * cellSize, cellSize, color);
        }
      }
    }

    // Draw Ghost Piece
    const piece = currentPieceRef.current;
    if (piece && isPlayingRef.current) {
      const ghostY = getGhostY();
      ctx.save();
      ctx.strokeStyle = piece.color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.35;
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c] !== 0) {
            const bx = (piece.x + c) * cellSize;
            const by = (ghostY + r) * cellSize;
            if (by >= 0) {
              ctx.strokeRect(bx + 1.5, by + 1.5, cellSize - 3, cellSize - 3);
            }
          }
        }
      }
      ctx.restore();

      // Draw Active Piece
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c] !== 0) {
            const bx = (piece.x + c) * cellSize;
            const by = (piece.y + r) * cellSize;
            if (by >= 0) {
              drawBlock(ctx, bx, by, cellSize, piece.color);
            }
          }
        }
      }
    }
  };

  const drawBlock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ) => {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, size - 2, size - 2, 4);
    ctx.fill();

    // High gloss inner reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.fillRect(x + 2, y + 2, size - 4, 3);
    ctx.restore();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto select-none">
      {/* HUD Header */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0f172a]/90 border border-slate-800 rounded-t-xl text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px]">SCORE</span>
            <span className="text-purple-400 font-bold text-sm tracking-wide font-mono-numbers">
              {score.toString().padStart(6, '0')}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> BEST
            </span>
            <span className="text-amber-400 font-bold text-sm tracking-wide font-mono-numbers">
              {highScore.toString().padStart(6, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 rounded border border-slate-700/60">
            <span>LINES {lines}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 rounded text-slate-300">
            <span>LVL {level}</span>
          </div>

          <button
            onClick={togglePause}
            disabled={gameState === 'IDLE' || gameState === 'GAME_OVER'}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 transition-colors"
          >
            {gameState === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Play Area with Side Panels */}
      <div className="relative w-full flex bg-[#060a14] border-x border-b border-slate-800 rounded-b-xl overflow-hidden shadow-2xl justify-center">
        {/* Left Side Panel: Hold Piece */}
        <div className="hidden sm:flex flex-col items-center justify-start p-3 w-24 bg-[#090d19] border-r border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-400 mb-2 font-bold tracking-wider">HOLD [C]</span>
          <div className="w-18 h-18 bg-[#040711] rounded-lg border border-slate-800/70 flex items-center justify-center">
            <canvas ref={holdCanvasRef} width={80} height={80} className="w-full h-full block" />
          </div>
        </div>

        {/* Center Canvas */}
        <div className="relative aspect-[10/20] h-[480px] max-h-[65vh]">
          <canvas
            ref={canvasRef}
            width={260}
            height={520}
            className="w-full h-full block object-contain"
          />

          {/* Start Screen Overlay */}
          {gameState === 'IDLE' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-3">
                <Play className="w-5 h-5 text-purple-400 ml-0.5" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white mb-1">Tetro Stack</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mb-4">
                Classic falling block puzzle. Clear horizontal lines to level up and score combos!
              </p>
              <button
                onClick={startGame}
                className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-purple-500/25 transition-all transform hover:scale-105"
              >
                Play Stack
              </button>
              <span className="text-[10px] text-slate-400 mt-3">
                [SPACE] Hard Drop · [UP] Rotate
              </span>
            </div>
          )}

          {/* Paused Screen Overlay */}
          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
              <h3 className="text-base font-bold tracking-tight text-purple-400 mb-2">GAME PAUSED</h3>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={togglePause}
                  className="px-3.5 py-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
                >
                  Resume
                </button>
                <button
                  onClick={startGame}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors"
                >
                  Restart
                </button>
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
              <h3 className="text-lg font-bold tracking-tight text-rose-400 mb-1">BLOCK OUT</h3>
              <p className="text-[11px] text-slate-400 mb-3">Stack topped out</p>

              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 w-40 mb-4 text-xs font-mono">
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span className="text-slate-400">Score</span>
                  <span className="text-white font-bold">{score}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Lines</span>
                  <span className="text-purple-300 font-bold">{lines}</span>
                </div>
              </div>

              {isNewRecord && (
                <span className="inline-block px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold rounded-md mb-3 animate-pulse">
                  ★ NEW HIGH SCORE! ★
                </span>
              )}

              <button
                onClick={startGame}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-purple-500/25 transition-transform hover:scale-105"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Play Again
              </button>
            </div>
          )}
        </div>

        {/* Right Side Panel: Next Piece & Quick Actions */}
        <div className="hidden sm:flex flex-col items-center justify-between p-3 w-24 bg-[#090d19] border-l border-slate-800/80">
          <div className="flex flex-col items-center w-full">
            <span className="text-[10px] font-mono text-slate-400 mb-2 font-bold tracking-wider">NEXT</span>
            <div className="w-18 h-18 bg-[#040711] rounded-lg border border-slate-800/70 flex items-center justify-center">
              <canvas ref={nextCanvasRef} width={80} height={80} className="w-full h-full block" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <button
              onClick={rotatePiece}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono rounded flex items-center justify-center gap-1"
            >
              <ArrowUp className="w-3 h-3 text-purple-400" /> ROT
            </button>
            <button
              onClick={hardDrop}
              className="w-full py-1.5 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 text-purple-300 text-[10px] font-mono rounded flex items-center justify-center gap-1"
            >
              <ArrowDown className="w-3 h-3" /> DROP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
