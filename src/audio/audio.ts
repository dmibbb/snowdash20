const MUSIC_IDS = [1, 2, 3, 4];
const SFX_IDS = [
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
  38,
];

// Playlist map from SPEC 13.1. Track 01 is looped (no transition);
// 02 → 03 → 04 → 02 cycle.
const MUSIC_NEXT: Record<number, number> = {
  1: 1,
  2: 3,
  3: 4,
  4: 2,
};

class AudioManager {
  private music = new Map<number, HTMLAudioElement>();
  private sfx = new Map<number, HTMLAudioElement>();
  private muted = false;
  private paused = false;
  private unlocked = false;
  private currentMusicId: number | null = null;
  private pendingMusicId: number | null = null;
  private cyclicIndices = new Map<string, number>();
  private sfxTimers = new Map<number, number>();

  get isMuted(): boolean {
    return this.muted;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  async preload(): Promise<void> {
    const tasks: Promise<void>[] = [];

    for (const id of MUSIC_IDS) {
      const src = `/sounds/music/${String(id).padStart(2, '0')}.mp3`;
      tasks.push(this.loadAudio(src, this.music, id));
    }
    for (const id of SFX_IDS) {
      const src = `/sounds/sfx/${id}.mp3`;
      tasks.push(this.loadAudio(src, this.sfx, id));
    }

    await Promise.all(tasks);
    console.log(`[Audio] preloaded: music=${this.music.size}, sfx=${this.sfx.size}`);
  }

  private loadAudio(src: string, map: Map<number, HTMLAudioElement>, id: number): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(src);
      audio.preload = 'auto';

      const onReady = (): void => {
        audio.removeEventListener('canplaythrough', onReady);
        audio.removeEventListener('error', onError);
        resolve();
      };
      const onError = (): void => {
        console.warn(`[Audio] failed to load ${src}`);
        audio.removeEventListener('canplaythrough', onReady);
        audio.removeEventListener('error', onError);
        resolve();
      };

      audio.addEventListener('canplaythrough', onReady);
      audio.addEventListener('error', onError);

      map.set(id, audio);
      audio.load();
    });
  }

  // Try to "warm up" the audio pipeline from a user gesture so that
  // subsequent .play() calls (outside the gesture) are allowed by the browser.
  async unlock(): Promise<boolean> {
    if (this.unlocked) return true;

    const first = this.music.get(1);
    if (!first) {
      console.warn('[Audio] unlock: track 01 not loaded');
      return false;
    }

    try {
      first.volume = 0;
      await first.play();
      first.pause();
      first.currentTime = 0;
      first.volume = this.muted ? 0 : 1;
      this.unlocked = true;
      console.log('[Audio] unlocked');
      if (this.pendingMusicId !== null) {
        const id = this.pendingMusicId;
        this.pendingMusicId = null;
        this.playMusic(id);
      }
      return true;
    } catch (err) {
      console.warn('[Audio] unlock failed', err);
      return false;
    }
  }

  // === Music ===

  playMusic(id: number): void {
    const target = this.music.get(id);
    if (!target) {
      console.warn(`[Audio] playMusic(${id}): not loaded`);
      return;
    }

    if (this.currentMusicId === id) return;

    if (this.currentMusicId !== null) {
      const current = this.music.get(this.currentMusicId);
      if (current) {
        current.onended = null;
        current.pause();
        current.currentTime = 0;
      }
    }

    this.currentMusicId = id;
    target.volume = this.muted ? 0 : 1;
    target.loop = id === 1;
    target.onended = () => {
      const nextId = MUSIC_NEXT[id];
      if (nextId !== undefined && nextId !== id) {
        this.currentMusicId = null;
        this.playMusic(nextId);
      }
    };

    if (this.paused) return;

    target.play().catch((err) => {
      if (!this.unlocked) {
        this.pendingMusicId = id;
      }
      console.warn(`[Audio] playMusic(${id}) rejected:`, err);
    });
  }

  stopMusic(): void {
    if (this.currentMusicId === null) return;
    const current = this.music.get(this.currentMusicId);
    if (current) {
      current.onended = null;
      current.pause();
      current.currentTime = 0;
    }
    this.currentMusicId = null;
  }

  // Cycles through in-game music tracks 2 → 3 → 4 → 2.
  nextGameTrack(): void {
    const order = [2, 3, 4];
    let next: number;
    if (this.currentMusicId === null || !order.includes(this.currentMusicId)) {
      next = order[0];
    } else {
      const idx = order.indexOf(this.currentMusicId);
      next = order[(idx + 1) % order.length];
    }
    this.playMusic(next);
  }

  // === SFX ===

  playSfx(id: number): void {
    if (this.muted) return;
    if (this.paused) return;

    this.clearSfxTimer(id);

    const sound = this.sfx.get(id);
    if (!sound) {
      console.warn(`[Audio] playSfx(${id}): not loaded`);
      return;
    }

    // Restart from beginning (simple overlap handling — one instance per SFX)
    sound.currentTime = 0;
    sound.play().catch((err) => {
      console.warn(`[Audio] playSfx(${id}) rejected:`, err);
    });
  }

  // Plays an SFX but stops it after `durationMs` (clipped playback).
  // If the same SFX is triggered again before the timer fires, the old timer is cancelled.
  playSfxForDuration(id: number, durationMs: number): void {
    if (this.muted) return;
    if (this.paused) return;

    this.clearSfxTimer(id);

    const sound = this.sfx.get(id);
    if (!sound) {
      console.warn(`[Audio] playSfxForDuration(${id}): not loaded`);
      return;
    }

    sound.currentTime = 0;
    sound.play().catch((err) => {
      console.warn(`[Audio] playSfxForDuration(${id}) rejected:`, err);
    });

    const timerId = window.setTimeout(() => {
      sound.pause();
      sound.currentTime = 0;
      this.sfxTimers.delete(id);
    }, durationMs);

    this.sfxTimers.set(id, timerId);
  }

  private clearSfxTimer(id: number): void {
    const existing = this.sfxTimers.get(id);
    if (existing !== undefined) {
      window.clearTimeout(existing);
      this.sfxTimers.delete(id);
    }
  }

  // Cycles through [from, to] inclusive. Counter is per-range, persists across calls.
  // Examples: playSfxCyclic(12, 19) → 12,13,...,19,12,13,...
  //           playSfxCyclic(26, 29) → 26,27,28,29,26,... (fixes original bug where
  //           counter stuck at 30 and hero die went silent)
  playSfxCyclic(from: number, to: number): void {
    const key = `${from}-${to}`;
    const current = this.cyclicIndices.get(key) ?? from;
    this.playSfx(current);
    const next = current >= to ? from : current + 1;
    this.cyclicIndices.set(key, next);
  }

  stopAllSfx(): void {
    for (const id of Array.from(this.sfxTimers.keys())) {
      this.clearSfxTimer(id);
    }
    for (const s of this.sfx.values()) {
      s.pause();
      s.currentTime = 0;
    }
  }

  // === Mute / Pause ===

  toggleMute(): void {
    this.muted = !this.muted;
    const volume = this.muted ? 0 : 1;

    if (this.currentMusicId !== null) {
      const current = this.music.get(this.currentMusicId);
      if (current) current.volume = volume;
    }

    if (this.muted) {
      // Stop any playing SFX immediately
      for (const s of this.sfx.values()) {
        s.pause();
        s.currentTime = 0;
      }
    }

    console.log(`[Audio] muted=${this.muted}`);
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;

    // Music: pause / resume
    if (this.currentMusicId !== null) {
      const current = this.music.get(this.currentMusicId);
      if (current) {
        if (paused) {
          current.pause();
        } else {
          current.play().catch((err) => {
            console.warn('[Audio] resume rejected:', err);
          });
        }
      }
    }

    // SFX: stop on pause. Don't resume on unpause — they're short, will replay
    // fresh on the next event.
    if (paused) {
      for (const s of this.sfx.values()) {
        if (!s.paused) {
          s.pause();
          s.currentTime = 0;
        }
      }
    }
  }
}

export const audio = new AudioManager();
