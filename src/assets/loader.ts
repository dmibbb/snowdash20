export type Sprite = ImageBitmap;

const MANIFESTS = ['/sprites/manifests/playerImages.txt', '/sprites/manifests/monsterImages.txt'];

const SINGLES = [
  // Tiles
  'block',
  'snow',
  'chest',
  'background',
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
];

const MASKED_SINGLES = [
  'snowball',
  'pause',
  'gameover',
  'hero_die',
  'R',
  'G',
  'B',
  'team',
  'prezents',
];

class AssetsManager {
  private images = new Map<string, Sprite>();

  async loadAll(): Promise<void> {
    const tasks: Promise<void>[] = [];
    for (const m of MANIFESTS) tasks.push(this.loadManifest(m));
    for (const n of SINGLES) tasks.push(this.loadSingle(n));
    for (const n of MASKED_SINGLES) tasks.push(this.loadMaskedSingle(n));
    await Promise.all(tasks);
    console.log(`[Assets] loaded ${this.images.size} sprites`);
  }

  get(name: string): Sprite | undefined {
    return this.images.get(name);
  }

  private async loadManifest(path: string): Promise<void> {
    try {
      const res = await fetch(path);
      if (!res.ok) {
        console.warn(`[Assets] manifest missing: ${path}`);
        return;
      }
      const text = await res.text();
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      for (let i = 0; i + 1 < lines.length; i += 2) {
        const imgName = basename(lines[i]);
        const maskName = basename(lines[i + 1]);
        try {
          const bmp = await this.loadMasked(`/sprites/${imgName}.bmp`, `/sprites/${maskName}.bmp`);
          this.images.set(imgName, bmp);
        } catch (err) {
          console.warn(`[Assets] failed: ${imgName}`, err);
        }
      }
    } catch (err) {
      console.warn(`[Assets] manifest error: ${path}`, err);
    }
  }

  private async loadSingle(name: string): Promise<void> {
    try {
      const bmp = await this.loadBitmap(`/sprites/${name}.bmp`);
      this.images.set(name, bmp);
    } catch (err) {
      console.warn(`[Assets] failed: ${name}`, err);
    }
  }

  private async loadMaskedSingle(name: string): Promise<void> {
    try {
      const bmp = await this.loadMasked(`/sprites/${name}.bmp`, `/sprites/${name}_mask.bmp`);
      this.images.set(name, bmp);
    } catch (err) {
      console.warn(`[Assets] no mask for ${name}, loading as single image`);
      await this.loadSingle(name);
    }
  }

  private loadBitmap(path: string): Promise<Sprite> {
    return this.loadImageEl(path).then((img) => createImageBitmap(img));
  }

  private async loadMasked(bmpPath: string, maskPath: string): Promise<Sprite> {
    const [bmp, mask] = await Promise.all([this.loadImageEl(bmpPath), this.loadImageEl(maskPath)]);

    const w = bmp.width;
    const h = bmp.height;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0);
    const imgData = ctx.getImageData(0, 0, w, h);

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCtx.drawImage(mask, 0, 0);
    const maskData = maskCtx.getImageData(0, 0, w, h);

    // Win32 mask: white = opaque sprite, black = transparent background
    for (let i = 0; i < imgData.data.length; i += 4) {
      const maskR = maskData.data[i];
      imgData.data[i + 3] = maskR > 128 ? 255 : 0;
    }

    ctx.putImageData(imgData, 0, 0);
    return createImageBitmap(canvas);
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

function basename(path: string): string {
  return path.replace(/^.*[\\/]/, '').replace(/\.bmp$/i, '');
}

export const assets = new AssetsManager();
