# SnowDash Web — актуальный контекст проекта

> Живой документ. Обновляется после каждой фазы.
> Источник истины по механике — `SPEC.md`. Здесь — что уже сделано, как устроено и какие решения приняты.
>
> **Последнее обновление:** 2026-11-11
> **Текущая фаза:** 12 — Known issues
> **Следующая фаза:** 13 — Deploy

---

## 1. Статус фаз

| #   | Фаза                     | Статус         | Дата       |
| --- | ------------------------ | -------------- | ---------- |
| 1   | Setup & Skeleton         | ✅ Done        | 2026-11-06 |
| 2   | Player on Empty Grid     | ✅ Done        | 2026-11-06 |
| 3   | Level Loading & Walls    | ✅ Done        | 2026-11-06 |
| 4   | Tiles Interactions       | ✅ Done        | 2026-11-09 |
| 5   | Stones                   | ✅ Done        | 2026-11-09 |
| 6   | Monsters                 | ✅ Done        | 2026-11-09 |
| 7   | Game State & Progression | ✅ Done        | 2026-11-10 |
| 8   | UI — HUD, Pause, Modes   | ✅ Done        | 2026-11-10 |
| 9   | Sound                    | ✅ Done        | 2026-11-10 |
| 10  | Real Assets              | ✅ Done        | 2026-11-11 |
| 11  | Tests, Polish, Deploy    | ✅ Done        | 2026-11-11 |
| 12  | Known Issues             | 🔄 in progress |            |
| 13  | Deploy                   | ⏸ not started  |            |

Легенда: ⏸ not started · 🔄 in progress · ✅ done · ⚠️ blocked

---

## 2. Структура src/

> Заполняется по мере появления файлов. Показывает «что уже существует», чтобы AI не создавал дубликаты.

```
src/
├── main.ts        — точка входа: loadLevelFile, ModeMachine, RAF-цикл
├── config.ts      — все игровые константы
├── types.ts       — Direction, GameMode, TileType, Point, CellCoords
├── style.css      — центрирование canvas 1:1, image-rendering: pixelated
├── assets/
│   └── loader.ts  — AssetsManager (синглтон assets): preload BMP + масок в ImageBitmap
├── audio/
│   └── audio.ts   — AudioManager (синглтон audio): preload, unlock, playMusic, stopMusic, playSfx (stub), toggleMute, setPaused
├── input/
│   └── input.ts   — keyboard + mouse: continuous (getDirection, getMousePosition) и edge (consume*)
├── entities/
│   ├── player.ts  — Player
│   ├── player.test.ts
│   ├── stone.ts   — Stone
│   ├── stone.test.ts
│   ├── monster.ts - Monster
│   └── monster.test.ts
├── game/
│   ├── game.ts         — Game: score, lives, levelIndex, сущности, isGameOver
│   ├── game.test.ts
│   ├── game.integration.test.ts
│   ├── modeMachine.ts  — ModeMachine: FSM режимов
│   └── rating.ts       — getRating(levelIndex)
├── level/
│   ├── parser.ts       — parseLevel(text)
│   ├── parser.test.ts
│   ├── level.test.ts
│   └── level.ts        — Level: getCell/setCell/isPassable, reset
├── modes/
│   ├── intro.ts    — createIntro({onDone})
│   ├── menu.ts     — createMenu({onStart, onHelp})
│   ├── help.ts     — createHelp({onBack})
│   └── gameover.ts — createGameOver({getGame, onBack})
└── render/
    ├── renderer.ts  — render(ctx, game): сцена
    ├── hud.ts       — renderHud(ctx, game)
    ├── overlays.ts  — draw{Pause, About, Exit, GameOver}Overlay
    └── button.ts    — ButtonRect, isPointInRect, drawButton
```

## 2a. public/

```
public/
├── levels/
│   ├── level_list.txt  — список путей к уровням
│   ├── 0.lvl
│   ├── ...
│   └── 9.lvl
├── sounds/
│   ├── music/
│   │   ├── 01..04.mp3 - музыка
│   └── sfx/
│       └── 11..38.mp3 - звуковые эффекты
└── sprites/
    ├── manifests/
    │   ├── monsterImages.txt - спрайты монстров (как в оригинале)
    │   └── playerImages.txt - спрайты игрока (как в оригинале)
    └── *.bmp - картинки, спрайты
```

---

## 3. Интерфейсы между модулями

> Самая важная секция. Здесь фиксируются сигнатуры функций/классов, чтобы модули стыковались.
> Обновляется, когда появляется новый публичный интерфейс или меняется существующий.

### Точка входа

// main.ts
loadLevelFile(path: string): Promise<string>
main(): Promise<void>

### ModeMachine

```
// game/modeMachine.ts
interface ModeHooks {
  onEnter?: () => void
  onExit?: () => void
  tick?: () => void
  render?: (ctx: CanvasRenderingContext2D) => void
}

class ModeMachine {
  currentMode: GameMode
  register(mode: GameMode, hooks: ModeHooks): void
  setMode(mode: GameMode): void   // вызывает onExit текущего, переключает, вызывает onEnter нового
  tick(): void
  render(ctx: CanvasRenderingContext2D): void
}
```

### HUD

```
// render/hud.ts
renderHud(ctx: CanvasRenderingContext2D, game: Game): void
```

### Game

// game/game.ts
type LevelFetcher = (path: string) => Promise<string>

class Game {
score: number
lives: number
levelIndex: number
visibleChests: number
level: Level | null
player: Player | null
stones: Stone[]
monsters: Monster[]
isGameOver: boolean

constructor(levelPaths: string[], fetchLevel: LevelFetcher)
start(): Promise<void>
loadLevel(index: number): Promise<void>
tick(input: Direction | null): void
onPlayerHit(): void
}

### Rating

// game/rating.ts
getRating(levelIndex: number): string

### Parser

```
// level/parser.ts
interface MonsterStart { col, row, model: 1|2 }

interface ParsedLevel {
  grid: TileType[][]
  start: CellCoords
  stoneStarts: CellCoords[]
  monsterStarts: MonsterStart[]
  chestsCount: number
}

parseLevel(text: string): ParsedLevel
```

### Level

```
// level/level.ts
class Level {
  readonly cols, rows, tileSize: number
  readonly start: CellCoords
  chestsCount: number

  reset(): void
  getCell(col, row): TileType       // вне границ → 'wall'
  setCell(col, row, type): void
  isPassable(col, row): boolean     // true кроме 'wall'
}
```

### Player

```
// entities/player.ts
class Player {
  x, y: number
  state: 'idle' | 'moving'
  direction: Direction

  getCell(): CellCoords
  resetToStart(): void
  update(inputDir: Direction | null, level: Level, game: Game, stones: Stone[], monsters: Monster[]): void
  getSpriteKey(): string
}
```

### Stone

```
// entities/stone.ts
type StoneState = 'idle' | 'falling' | 'pushed'

class Stone {
  x, y: number
  state: StoneState

  getCell(): CellCoords
  reset(): void
  tryPush(direction: Direction, level: Level, stones: Stone[]): boolean
  update(level: Level, stones: Stone[], player: Player | null): void
}
```

### Monster

```
// entities/monster.ts
type MonsterModel = 1 | 2

class Monster {
  x, y: number
  state: 'idle' | 'moving'
  direction: Direction
  readonly model: MonsterModel
  killed: boolean

  getCell(): CellCoords
  reset(): void
  update(level: Level, stones: Stone[], monsters: Monster[]): void
  getSpriteKey(): string
}
```

### Renderer

```
// render/renderer.ts
render(ctx: CanvasRenderingContext2D, game: Game): void
```

### Overlays

```
// render/overlays.ts
drawPauseOverlay(ctx): void
drawAboutOverlay(ctx): void
drawExitOverlay(ctx): void
drawGameOverOverlay(ctx, game): void
```

### Input

```
// input/input.ts
initInput(canvas: HTMLCanvasElement, w?: number, h?: number): void
getDirection(): Direction | null                       // continuous
getMousePosition(): { x: number; y: number } | null    // continuous
consumeConfirm(): boolean                              // edge: Enter/Space
consumePause(): boolean                                // edge: Esc/P
consumeMute(): boolean                                 // edge: M
consumeAnyKey(): boolean                               // edge: любая клавиша (для Intro)
consumeClick(): { x: number; y: number } | null        // edge: mousedown
```

### Button

```
// render/button.ts
interface ButtonRect { x, y, w, h: number }
isPointInRect(p, r): boolean
drawButton(ctx, rect, label, hover, fontSize?): void
```

### Modes

```
// modes/intro.ts
createIntro(callbacks: { onDone: () => void }): ModeHooks

// modes/menu.ts
createMenu(callbacks: { onStart: () => void, onHelp: () => void }): ModeHooks

// modes/help.ts
createHelp(callbacks: { onBack: () => void }): ModeHooks

// modes/gameover.ts
createGameOver(callbacks: { getGame: () => Game | null, onBack: () => void }): ModeHooks
```

### Audio

```
// audio/audio.ts
class AudioManager {
  get isMuted(): boolean
  get isPaused(): boolean

  preload(): Promise<void>
  unlock(): Promise<boolean>       // true → слушатели можно снимать
  playMusic(id: number): void
  stopMusic(): void
  playSfx(id: number): void        // one-shot; early return if muted/paused
  playSfxCyclic(from: number, to: number): void  // 12→19→12, 26→29→26, etc.
  stopAllSfx(): void               // останавливает все SFX (для GameOver → Back)
  toggleMute(): void
  setPaused(paused: boolean): void
}

export const audio: AudioManager
```

### Assets

```
// assets/loader.ts
type Sprite = ImageBitmap
class AssetsManager {
  loadAll(): Promise<void>
  get(name: string): Sprite | undefined
}
export const assets: AssetsManager
```

---

## 4. Принятые решения и отклонения от SPEC

> Всё, что SPEC не оговаривает или оговорено двусмысленно — фиксируется здесь. Это защищает от «AI каждый раз решает по-своему».

### Ассеты и Рендер (фаза 10)

- **Загрузка в память.** Скрипт `assets/loader.ts` грузит BMP файлы через `Image`, применяет маску (Win32: белый = opaque, черный = transparent) и сохраняет в `ImageBitmap`. Никаких предварительных конвертаций в PNG — всё делается на лету в браузере.
- **Маски.** BMP файлы грузятся как есть, маска накладывается в `loadMasked`. Если маски нет (фолбэк) — картинка грузится без прозрачности.
- **Разрешение.** Жёстко 800×560 (поле 520 + HUD 40). CSS `width: 800px`, никаких растягиваний и пикселизации.
- **HUD.** Полоса `score_bar` (760×40) центрируется по X=20. Иконки `p_d_1` идут с шагом 20px. Цифры и лейблы — реальные спрайты.
- **Интро.** Заменено на реальные картинки `R, G, B, team, prezents` на фоне `intro.bmp`. Сдвинуто на 20px вверх для красоты.
- **Меню.** Полностью на спрайтах (`back_menu`, кнопки `Lets_go`, `about`, `help`, `exit` + `_2` на hover).
- **Help.** Заменён на картинку `Help_back`, кнопка "Main Menu" осталась текстовой.
- **Pause.** Спрайт `pause.bmp` (320×100), кнопка "Back to Menu" текстовая.
- **Game Over.** Спрайт `gameover.bmp`, кнопка "Back to Menu" текстовая.
- **DEBUG_TILE_LABELS.** Установлен в `false`, буквы B/S/C/K/P/M/U отключены.

### Отклонения от оригинала

- **Hero die счётчик** — 26→27→28→29→26 (фикс бага).
- **Пауза** — `setPaused(true)` останавливает и музыку, и SFX.
- **Player заблокирован `falling`-камнем** — AABB-проверка, блокировка движения.
- **SFX** — один `HTMLAudioElement` на файл, обрывает сам себя при частом вызове.
- **GameOver audio** — музыка останавливается, играет только SFX 38.
- **Парсер** — поддерживает lowercase + дефис (оригинальный формат уровней).

---

## 5. Ассеты

> Статус: что уже есть, что ждёт конвертации.

### Изображения (спрайты)

| Что         | Где                              | Статус                                        |
| ----------- | -------------------------------- | --------------------------------------------- |
| Все спрайты | `public/sprites/*.bmp`           | ✅ BMP скопированы, маски применяются на лету |
| Манифесты   | `public/sprites/manifests/*.txt` | ✅ На месте                                   |

### Звук

| Что          | Где                    | Статус                                             |
| ------------ | ---------------------- | -------------------------------------------------- |
| Музыка 01–04 | `public/sounds/music/` | ✅ 01–04.mp3 на местах                             |
| SFX 11–38    | `public/sounds/sfx/`   | ✅ 25 файлов (кроме 24,25,37 — их нет в оригинале) |

```
public/
└── sounds/
    ├── music/
    │   ├── 01.mp3   ← Midnight Dreams.mp3 (переименован)
    │   ├── 02.mp3   ← Eastern Thriller.mp3
    │   ├── 03.mp3   ← Escapist.mp3
    │   └── 04.mp3   ← Last Runaway.mp3
    └── sfx/
        ├── 11.mp3   ← 250 Points.mp3
        ├── 12.mp3 ... 19.mp3   ← Eating Hero 1..8
        ├── 20.mp3 ... 23.mp3   ← Enemy Die 1..4
        ├── 26.mp3 ... 29.mp3   ← Hero Die 1..4
        ├── 30.mp3   ← Level Done.mp3
        ├── 31.mp3   ← Mouse Click.mp3
        ├── 32.mp3   ← Move Snow Ball.mp3
        ├── 33.mp3, 34.mp3      ← Snow 1, Snow 2
        ├── 35.mp3   ← Stone Falled.mp3
        ├── 36.mp3   ← Stone Falling.mp3
        └── 38.mp3   ← Your Score.mp3
```

⚠️ Музыка — с ведущим нулём (01.mp3, не 1.mp3). SFX — без (11.mp3, 12.mp3, …). Файлов 24, 25, 37 нет — это нормально, в оригинале их не было.

### Уровни

| Что            | Где                                          | Статус            |
| -------------- | -------------------------------------------- | ----------------- |
| level_list.txt | `public/levels/level_list.txt`               | ✅                |
| 0..9.lvl       | `public/levels/0.lvl`..`public/levels/9.lvl` | ✅ (из оригинала) |

---

## 6. Как запустить

```
npm install
npm run dev — dev-сервер на http://localhost:5173
npm run build — прод-сборка в dist/
npm run preview — локальный просмотр прод-сборки
npm test — юнит-тесты (Vitest)
```

---

## 7. Известные проблемы / TODO

> Все баги и улучшения для следующей итерации перенесены в `Tasks.md` → «Фаза 12: Известные проблемы и улучшения». Там же splash screen, горизонтальный спайкер, RIP-снежок, пауза с итогами уровня и т.д.

- **Тесты (11.6).** 62 юнит + интеграционных теста (Vitest). Покрытие: parser, Level, Player, Stone, Monster, Game (включая milestone 250, коллизии, переходы). Тесты колокированы рядом с исходниками (`*.test.ts`).
- **Debug-сетка убрана (11.7).** под флаг.
- **`npm run build` + `npm run preview` — зелёные.**

---

## 8. Соглашения по коду

> Уточнения по стилю, чтобы AI не «изобретал» на каждом шаге.

- **Строгий TS** (`strict: true`).
- **`import type` для типов.** `verbatimModuleSyntax: true` — интерфейсы/типы (`Direction`, `TileType`, `CellCoords`, `ParsedLevel`) импортируются через `import type`. Классы, функции, константы — обычным `import`.
- **Классы**, не фабрики и не функциональный стиль. Объекты мутабельны.
- **Никаких сторонних библиотек** для игры. Только Vite, TS, Vitest, ESLint, Prettier.
- **Именование:** `camelCase` для переменных/функций, `PascalCase` для классов/типов, `UPPER_SNAKE` для констант в `config.ts`.
- **Единицы:** пиксели — целые числа, клетки — `col`/`row` (не `x`/`y`).
- **Никаких `any`.** Если нужно — `unknown` + type guard.
- **Импорты:** относительные, без алиасов.
- **Комментарии в коде — на английском.** Русский — только в документации (`SPEC.md`, `PROJECT_CONTEXT.md`, коммиты).
- **Процесс:** в конце каждой фазы сначала `npm run build` (зелёный), потом `npm test` (зелёный), потом `npm run dev` + чек-лист.
- **`erasableSyntaxOnly: true`.** Нельзя использовать parameter properties (`constructor(private x: T)`), `enum`, `namespace`. Поля объявлять явно, присваивать в теле конструктора. `enum` заменять union-типами.

---

## 9. Чек-лист обновления этого файла

После завершения каждой фазы:

- [ ] Раздел 1: отметить фазу как ✅, обновить «Текущая/Следующая».
- [ ] Раздел 2: добавить новые файлы с описанием.
- [ ] Раздел 3: добавить/обновить интерфейсы.
- [ ] Раздел 4: зафиксировать новые решения и отклонения.
- [ ] Раздел 5: обновить статусы ассетов.
- [ ] Раздел 7: убрать решённое, добавить новое.
- [ ] Обновить «Последнее обновление» в шапке.
