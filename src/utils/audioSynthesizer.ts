/**
 * Utilitário Web Audio API para simulação de metrônomo e playbacks de estudo
 * Sem dependências externas, compatível com todos os navegadores modernos.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private metronomeTimer: number | null = null;
  private isMetronomePlaying = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Toca um bip de metrônomo (click seco)
   */
  playClick(freq: number = 880, duration: number = 0.04) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext pode ser bloqueado sem gesto do usuário prévio
    }
  }

  /**
   * Inicia loop de metrônomo no BPM especificado
   */
  startMetronome(bpm: number, onTick?: (beat: number) => void) {
    this.stopMetronome();
    this.isMetronomePlaying = true;
    const intervalMs = (60 / bpm) * 1000;
    let beat = 1;

    // Primeiro toque
    this.playClick(1000, 0.05);
    onTick?.(beat);

    this.metronomeTimer = window.setInterval(() => {
      beat = beat === 4 ? 1 : beat + 1;
      const freq = beat === 1 ? 1200 : 800; // Tom mais agudo no primeiro tempo
      this.playClick(freq, 0.04);
      onTick?.(beat);
    }, intervalMs);
  }

  stopMetronome() {
    if (this.metronomeTimer) {
      clearInterval(this.metronomeTimer);
      this.metronomeTimer = null;
    }
    this.isMetronomePlaying = false;
  }

  getMetronomeStatus() {
    return this.isMetronomePlaying;
  }

  /**
   * Toca acorde suave de playback de acompanhamento para estudo (I - IV - V - I)
   */
  playChordProgression() {
    try {
      const ctx = this.getContext();
      const notes = [
        [261.63, 329.63, 392.0], // Dó Maior (C)
        [349.23, 440.0, 523.25], // Fá Maior (F)
        [392.0, 493.88, 587.33], // Sol Maior (G)
        [261.63, 329.63, 523.25], // Dó Maior (C final)
      ];

      notes.forEach((chord, chordIdx) => {
        const startTime = ctx.currentTime + chordIdx * 1.2;
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.12, startTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.15);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 1.2);
        });
      });
    } catch {
      // Ignora falhas de reprodução em ambiente headless
    }
  }
}

export const audioSynth = new AudioSynthesizer();
