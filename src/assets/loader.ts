import { DEBUG_HIDE_SPRITES } from '../config';

export type Sprite = ImageBitmap;

const SINGLES = [
  // Tiles
  'block',
  'snow',
  'chest',
  'background',
  'snowball',
  'pause',
  'gameover',
  'hero_die',
  // HUD
  'score_bar',
  'gamescore',
  'Level',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  // Menu (default + hover)
  'back_menu',
  'main_menu',
  'main_menu_2',
  'Lets_go',
  'Lets_go_2',
  'about',
  'about_2',
  'help',
  'help_2',
  'exit',
  'exit_2',
  'Help_back',
  // Intro
  'intro',
  'R',
  'G',
  'B',
  'team',
  'prezents',
  // Player
  'p_u_1',
  'p_d_1',
  'p_l_1',
  'p_r_1',
  'p_u_2',
  'p_d_2',
  'p_l_2',
  'p_r_2',
  'p_u_3',
  'p_d_3',
  'p_l_3',
  'p_r_3',
  // Enemies
  'ameba_u_1',
  'ameba_d_1',
  'ameba_l_1',
  'ameba_r_1',
  'ameba_u_2',
  'ameba_d_2',
  'ameba_l_2',
  'ameba_r_2',
  'spiker_l_1',
  'spiker_l_2',
  'spiker_r_1',
  'spiker_r_2',
];

class AssetsManager {
  private imagesPng = new Map<string, Sprite>();

  get(name: string): Sprite | undefined {
    if (DEBUG_HIDE_SPRITES) return undefined;

    return this.imagesPng.get(name);
  }

  async loadAll(): Promise<void> {
    const tasks: Promise<void>[] = [];
    for (const n of SINGLES) tasks.push(this.loadSingle(n));
    await Promise.all(tasks);
  }

  private async loadSingle(name: string): Promise<void> {
    const base = import.meta.env.BASE_URL;
    const png = await this.tryLoadBitmap(`${base}sprites/${name}.png`);
    if (png) {
      this.imagesPng.set(name, png);
    } else {
      console.warn(`[Assets] Failed to load: ${name}.png`);
    }
  }

  private async tryLoadBitmap(path: string): Promise<Sprite | null> {
    try {
      return await this.loadBitmap(path);
    } catch {
      return null;
    }
  }

  private loadBitmap(path: string): Promise<Sprite> {
    return this.loadImageEl(path).then((img) => createImageBitmap(img));
  }

  private loadImageEl(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed: ${path}`));
      img.src = path;
    });
  }
}

export const assets = new AssetsManager();
