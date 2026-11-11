import type { GameMode } from '../types';

export interface ModeHooks {
  onEnter?: () => void;
  onExit?: () => void;
  tick?: () => void;
  render?: (ctx: CanvasRenderingContext2D) => void;
}

export class ModeMachine {
  currentMode: GameMode | null = null;

  private hooks: Partial<Record<GameMode, ModeHooks>> = {};

  register(mode: GameMode, hooks: ModeHooks): void {
    this.hooks[mode] = hooks;
  }

  setMode(mode: GameMode): void {
    if (mode === this.currentMode) return;
    if (this.currentMode !== null) {
      this.hooks[this.currentMode]?.onExit?.();
    }
    this.currentMode = mode;
    this.hooks[mode]?.onEnter?.();
  }

  tick(): void {
    if (this.currentMode === null) return;
    this.hooks[this.currentMode]?.tick?.();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.currentMode === null) return;
    this.hooks[this.currentMode]?.render?.(ctx);
  }
}
