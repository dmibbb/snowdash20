import type { GameMode } from '../types';

export interface ModeHooks {
  onEnter?: () => void;
  onExit?: () => void;
  tick?: () => void;
  render?: (ctx: CanvasRenderingContext2D) => void;
}

export class ModeMachine {
  currentMode: GameMode = 'intro';

  private hooks: Partial<Record<GameMode, ModeHooks>> = {};

  register(mode: GameMode, hooks: ModeHooks): void {
    this.hooks[mode] = hooks;
  }

  setMode(mode: GameMode): void {
    if (mode === this.currentMode) return;
    this.hooks[this.currentMode]?.onExit?.();
    this.currentMode = mode;
    this.hooks[mode]?.onEnter?.();
  }

  tick(): void {
    this.hooks[this.currentMode]?.tick?.();
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.hooks[this.currentMode]?.render?.(ctx);
  }
}
