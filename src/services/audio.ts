/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.4;

  constructor() {
    // Lazy initialization on user gesture
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  // Play a simple synthesized tone
  private playTone(freq: number, type: OscillatorType, duration: number, endFreq?: number) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), now + duration);
      }

      gain.gain.setValueAtTime(this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // AudioContext policy suppression fallback
    }
  }

  // Noise generator for hits and explosions
  private playNoise(duration: number, lowpassFreq: number = 1000) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(lowpassFreq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(this.volume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // Audio suppression fallback
    }
  }

  // Game-specific sound effects:
  public move() {
    this.playTone(280, 'square', 0.04);
  }

  public rotate() {
    this.playTone(420, 'square', 0.05, 520);
  }

  public drop() {
    this.playTone(180, 'triangle', 0.08, 60);
  }

  public eat() {
    this.playTone(330, 'square', 0.12, 660);
  }

  public bonus() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 'sine', 0.1), idx * 60);
    });
  }

  public brickHit(durability = 1) {
    if (durability > 1) {
      this.playTone(480, 'square', 0.06, 320);
    } else {
      this.playNoise(0.08, 1400);
    }
  }

  public paddleBounce() {
    this.playTone(220, 'triangle', 0.09, 140);
  }

  public wallBounce() {
    this.playTone(380, 'square', 0.03);
  }

  public powerup() {
    if (this.isMuted) return;
    const pitches = [261.63, 329.63, 392.0, 523.25];
    pitches.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.08), i * 50);
    });
  }

  public laserShoot() {
    this.playTone(880, 'sawtooth', 0.1, 150);
  }

  public lineClear(linesCount: number = 1) {
    if (this.isMuted) return;
    if (linesCount >= 4) {
      const tetrisFanfare = [440, 554, 659, 880];
      tetrisFanfare.forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'square', 0.16), i * 70);
      });
    } else {
      const notes = [392, 493.88, 587.33];
      notes.forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'square', 0.1), i * 60);
      });
    }
  }

  // Mario-specific classic sound synthesis
  public marioJump() {
    this.playTone(150, 'square', 0.15, 600);
  }

  public marioCoin() {
    if (this.isMuted) return;
    this.playTone(987.77, 'sine', 0.08);
    setTimeout(() => {
      this.playTone(1318.51, 'sine', 0.28);
    }, 80);
  }

  public marioStomp() {
    this.playTone(380, 'triangle', 0.1, 80);
  }

  public marioBump() {
    this.playTone(200, 'square', 0.06, 80);
  }

  public lifeLost() {
    this.playTone(240, 'sawtooth', 0.35, 60);
  }

  public gameOver() {
    if (this.isMuted) return;
    const sadNotes = [330, 311, 293, 277];
    sadNotes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.22, f * 0.8), i * 140);
    });
  }

  public victory() {
    if (this.isMuted) return;
    const victoryNotes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
    victoryNotes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.15), i * 100);
    });
  }
}

export const sound = new SoundEngine();
