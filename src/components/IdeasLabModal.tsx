/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sparkles, Lightbulb, Gamepad, Compass, Zap, Flame, Rocket, Layers } from 'lucide-react';
import { ClassicGameIdea } from '../types/game';

interface IdeasLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CLASSIC_IDEAS: ClassicGameIdea[] = [
  {
    id: 'mario',
    title: 'Super Mini Bros (2D Platformer)',
    genre: 'Platformer',
    inspiration: 'Super Mario Bros (1985)',
    coreMechanic: 'Side-scrolling running, gravity jump arcs, stomping enemies from above, headbutting question mark blocks, reaching the end flagpole.',
    browserFit: 'Lightweight canvas physics loop, zero asset latency, immediate nostalgic satisfaction.',
    modernTwist: 'Procedural level generation, secret warp pipes with mini challenges, speedrun split timer.',
    difficulty: 'Medium',
  },
  {
    id: 'pacman',
    title: 'Cyber Maze Pac',
    genre: 'Maze / Action',
    inspiration: 'Pac-Man (1980)',
    coreMechanic: 'Navigating a 2D maze eating pellets, 4 colored ghost bots with pathfinding AI (Blinky, Pinky, Inky, Clyde), power energizers to turn the tables.',
    browserFit: 'Tile-based array grid coordinates, clean state machine for ghost modes (Chase, Scatter, Frightened).',
    modernTwist: 'Neon vector glow, dynamic maze layout shifts, power-up speed boosts.',
    difficulty: 'Medium',
  },
  {
    id: 'space_invaders',
    title: 'Galactic Invaders / Galaga',
    genre: 'Arcade Shooter',
    inspiration: 'Space Invaders (1978) & Galaga (1981)',
    coreMechanic: 'Horizontal laser cannon defending against marching alien fleets that accelerate as their numbers thin. Destructible shield bunkers and bonus mystery motherships.',
    browserFit: 'Simple bullet-to-bounding-box collisions, snappy keyboard/mouse aiming, retro synthesized zap sounds.',
    modernTwist: 'Dual-ship capture rescue mechanic, alien dive-bombing attack formations, laser upgrades.',
    difficulty: 'Easy',
  },
  {
    id: 'frogger',
    title: 'Road & River Hopper',
    genre: 'Timing & Navigation',
    inspiration: 'Frogger (1981)',
    coreMechanic: 'Grid-based hopping across a multi-lane highway dodging speeding cars, then jumping across moving river logs and turtle shells to fill 5 goal lilypads.',
    browserFit: 'Deterministic row speeds, instant input feedback, high-stakes spatial risk vs reward.',
    modernTwist: 'Endless survival mode with rising water levels, fly multipliers, hazard weather.',
    difficulty: 'Easy',
  },
  {
    id: 'asteroids',
    title: 'Vector Space Drift',
    genre: 'Physics Drift',
    inspiration: 'Asteroids (1979)',
    coreMechanic: 'Zero-gravity Newtonian momentum drift, rotating spaceship heading, blasting space rocks that split into smaller, faster tumbling fragments.',
    browserFit: 'Clean vector line drawing on HTML5 Canvas, screen wrap-around coordinate math, satisfying particle explosions.',
    modernTwist: 'Black hole gravitational wells, shield tractor beams, alien boss encounters.',
    difficulty: 'Medium',
  },
  {
    id: 'flappy',
    title: 'Flappy Impulse / Cave Runner',
    genre: 'One-Button Reflex',
    inspiration: 'Flappy Bird & SF Cave',
    coreMechanic: 'Single-tap upward thrust impulse countering constant downward gravity, navigating randomized gaps in pipe columns.',
    browserFit: 'Extremely easy one-touch mobile friendly controls, viral "one more try" loop, rapid restart.',
    modernTwist: 'Combo rings for multiplier boosts, changing day/night environments, ghost competitor runs.',
    difficulty: 'Easy',
  },
  {
    id: 'pong',
    title: 'Cyber Pong & Air Hockey',
    genre: 'Sports / Duel',
    inspiration: 'Pong (1972)',
    coreMechanic: 'Left/Right paddles volleying a ball with angle deflection based on paddle contact point and spin. Playable vs smart CPU AI or 2-player local split keyboard.',
    browserFit: 'Sub-millisecond input response, simple physics, great for competitive quick duels.',
    modernTwist: 'Curved gravity tables, power paddles (ice, fire, magnet), multiball sudden death.',
    difficulty: 'Easy',
  },
  {
    id: 'sokoban',
    title: 'Sokoban Cargo Warehouse',
    genre: 'Logic Puzzle',
    inspiration: 'Sokoban (1982)',
    coreMechanic: 'Top-down warehouse keeper pushing heavy storage crates onto designated target floor marks. Crate can only be pushed, never pulled.',
    browserFit: 'Turn-based state array, infinite undo/redo stack, pure cognitive puzzle satisfaction.',
    modernTwist: 'Level editor where players design & share custom warehouse puzzles via URL hash.',
    difficulty: 'Medium',
  },
  {
    id: 'minesweeper',
    title: 'Retro Minesweeper',
    genre: 'Deduction Puzzle',
    inspiration: 'Minesweeper (1990)',
    coreMechanic: 'Uncovering grid tiles displaying adjacent mine counts. Flag suspected bomb coordinates, cascade blank cell openings.',
    browserFit: 'Zero CPU overhead, instant board generation with guaranteed first-click safety, timer speedruns.',
    modernTwist: 'Hexagonal mine grids, multi-layer depth mines, puzzle campaign mode with boss maps.',
    difficulty: 'Easy',
  },
  {
    id: 'lunar_lander',
    title: 'Apollo Lunar Lander',
    genre: 'Physics Simulation',
    inspiration: 'Lunar Lander (1979)',
    coreMechanic: 'Managing limited propellant fuel while applying directional thrusters to gently touch down on narrow rocky landing platforms at safe velocity and pitch angle.',
    browserFit: 'Realistic vector thrust calculations, smooth descent curve, thrilling high-stakes precision.',
    modernTwist: 'Planetary winds, rescue astronaut capsules, hazardous meteor showers.',
    difficulty: 'Advanced',
  },
  {
    id: 'doodle_jump',
    title: 'Sky Leaper (Doodle Jumper)',
    genre: 'Endless Jumper',
    inspiration: 'Doodle Jump (2009) / PapiJump',
    coreMechanic: 'Hero character auto-bounces on ascending platforms, tilting left/right with keys or gyro. Breaking platforms, spring shoes, propeller hats, and shooting nose pellets at monsters.',
    browserFit: 'Endless vertical scrolling canvas, tilt / arrow steering, continuous high score dopamine.',
    modernTwist: 'Dynamic weather storms, grappling hook power-up, themed sky dimensions.',
    difficulty: 'Easy',
  },
  {
    id: 'puzzle_bobble',
    title: 'Bubble Cannon Pop',
    genre: 'Match-3 Arcade',
    inspiration: 'Puzzle Bobble / Bust-A-Move (1994)',
    coreMechanic: 'Aiming a rotating bubble cannon at the ceiling, bouncing shots off sidewalls to match 3 or more same-colored bubbles to drop hanging clusters.',
    browserFit: 'Ray-casting trajectory line guide, physics bounce calculations, juicy popping particle effects.',
    modernTwist: 'Bomb bubbles, rainbow wildcards, ceiling dropping pressure timer.',
    difficulty: 'Medium',
  },
];

export const IdeasLabModal: React.FC<IdeasLabModalProps> = ({ isOpen, onClose }) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  if (!isOpen) return null;

  const genres = ['All', 'Platformer', 'Maze / Action', 'Arcade Shooter', 'Physics Drift', 'One-Button Reflex', 'Sports / Duel', 'Logic Puzzle', 'Deduction Puzzle'];

  const filteredIdeas = selectedGenre === 'All'
    ? CLASSIC_IDEAS
    : CLASSIC_IDEAS.filter((i) => i.genre.includes(selectedGenre) || i.genre === selectedGenre);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#090e1a] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d1424]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Classic Mini Game Ideas Lab</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                  Google AI Studio Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Iconic retro game formulas that run seamlessly in modern browser canvas with high replayability
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Genre Filter Tabs */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-[#070b14] flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-500 text-[11px] font-mono mr-2 uppercase">Filter:</span>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                selectedGenre === g
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Ideas Grid Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIdeas.map((idea) => (
              <div
                key={idea.id}
                className="p-4 rounded-xl bg-[#0d1424]/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                        {idea.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <span>Inspired by {idea.inspiration}</span>
                        <span>·</span>
                        <span className="text-cyan-400">{idea.genre}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        idea.difficulty === 'Easy'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                          : idea.difficulty === 'Medium'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                          : 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                      }`}
                    >
                      {idea.difficulty}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                    {idea.coreMechanic}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-[11px]">
                    <div className="text-slate-400">
                      <span className="text-cyan-400 font-semibold">Why It Works: </span>
                      {idea.browserFit}
                    </div>
                    <div className="text-slate-400">
                      <span className="text-amber-400 font-semibold">Modern AI Studio Twist: </span>
                      {idea.modernTwist}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0d1424] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mini Mario, Snake, Breakout, and Tetris are already playable above!</span>
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Back to Arcade
          </button>
        </div>
      </div>
    </div>
  );
};
