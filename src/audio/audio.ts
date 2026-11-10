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
  async unlock(): Promise<void> {
    if (this.unlocked) return;

    const first = this.music.get(1);
    if (!first) {
      console.warn('[Audio] unlock: track 01 not loaded');
      return;
    }

    try {
      first.volume = 0;
      await first.play();
      first.pause();
      first.currentTime = 0;
      first.volume = this.muted ? 0 : 1;
      this.unlocked = true;
      console.log('[Audio] unlocked');
    } catch (err) {
      console.warn('[Audio] unlock failed', err);
    }
  }

  // === Music ===

  playMusic(id: number): void {
    const target = this.music.get(id);
    if (!target) {
      console.warn(`[Audio] playMusic(${id}): not loaded`);
      return;
    }

    // Already playing this track — do nothing
    if (this.currentMusicId === id) return;

    // Stop current
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
    target.loop = id === 1; // track 01 loops itself; others chain via onended
    target.onended = () => {
      const nextId = MUSIC_NEXT[id];
      if (nextId !== undefined && nextId !== id) {
        this.currentMusicId = null; // force re-entry
        this.playMusic(nextId);
      }
    };

    if (this.paused) return; // will be resumed by setPaused(false)

    target.play().catch((err) => {
      // Autoplay may be blocked before user interaction — that's fine.
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

  // === SFX — implemented in 9.3 ===

  playSfx(_id: number): void {
    // TODO 9.3
  }

  // === Mute / Pause ===

  toggleMute(): void {
    this.muted = !this.muted;
    const volume = this.muted ? 0 : 1;

    if (this.currentMusicId !== null) {
      const current = this.music.get(this.currentMusicId);
      if (current) current.volume = volume;
    }
    // SFX volume — handled in 9.3
    console.log(`[Audio] muted=${this.muted}`);
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;

    if (this.currentMusicId === null) return;
    const current = this.music.get(this.currentMusicId);
    if (!current) return;

    if (paused) {
      current.pause();
    } else {
      current.play().catch((err) => {
        console.warn('[Audio] resume rejected:', err);
      });
    }
  }
}

export const audio = new AudioManager();
