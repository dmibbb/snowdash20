# SnowDash Web — актуальный контекст проекта

> Живой документ. Обновляется после каждой фазы.
> Источник истины по механике — `SPEC.md`. Здесь — что уже сделано, как устроено и какие решения приняты.
>
> **Последнее обновление:** 2026-11-10
> **Текущая фаза:** 9 — Sound
> **Следующая фаза:** 10 — Real Assets

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
| 9   | Sound                    | 🔄 in progress |            |
| 10  | Real Assets              | ⏸ not started  |            |
| 11  | Tests, Polish, Deploy    | ⏸ not started  |            |

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
├── audio/
│   └── audio.ts   — AudioManager (синглтон audio): preload, unlock, playMusic, stopMusic, playSfx (stub), toggleMute, setPaused
├── input/
│   └── input.ts   — keyboard + mouse: continuous (getDirection, getMousePosition) и edge (consume*)
├── entities/
│   ├── player.ts  — Player
│   ├── stone.ts   — Stone
│   └── monster.ts — Monster
├── game/
│   ├── game.ts         — Game: score, lives, levelIndex, сущности, isGameOver
│   ├── modeMachine.ts  — ModeMachine: FSM режимов
│   └── rating.ts       — getRating(levelIndex)
├── level/
│   ├── parser.ts       — parseLevel(text)
│   ├── parser.test.ts  — 9 юнит-тестов (Vitest)
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
└── levels/
    ├── level_list.txt  — список путей к уровням (level01/02/03)
    ├── level01.txt     — тестовый уровень: стены, снег, сундуки, 4 камня, 1 амеба, 1 спайкер
    ├── level02.txt     — простой тест перехода: 2 сундука + 1 амеба
    └── level03.txt     — простой тест перехода: 2 сундука + камень + спайкер
```

Ассеты (спрайты, звук) — появятся в фазах 9–10. Пока используются плейсхолдеры.

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
  unlock(): Promise<void>
  playMusic(id: number): void
  stopMusic(): void
  playSfx(id: number): void       // TODO 9.3
  toggleMute(): void
  setPaused(paused: boolean): void
}

export const audio: AudioManager
```

---

## 4. Принятые решения и отклонения от SPEC

> Всё, что SPEC не оговаривает или оговорено двусмысленно — фиксируется здесь. Это защищает от «AI каждый раз решает по-своему».

### Placeholder-и (пока нет реальных PNG)

- **Игрок:** `#3498db` (синий)
- **Стена:** `#7f8c8d` (серый)
- **Снег:** `#ecf0f1` (почти белый)
- **Сундук:** `#f1c40f` (жёлтый)
- **Камень:** `#34495e` (тёмно-серый)
- **Монстр:** `#e74c3c` (красный)
- **Фон поля:** `#2c3e50`
- **HUD:** `#4a4a4a` + белая линия сверху

### UI

- Меню, Help, About, Game Over — **canvas-кнопки** (`ctx.fillRect` + текст), обработка кликов по координатам. НЕ HTML.

### Аудио

- **AudioManager** (`src/audio/audio.ts`, синглтон `audio`). Предзагрузка всех mp3 при старте (`void audio.preload()`, без await). Пути: `/sounds/music/{01..04}.mp3`, `/sounds/sfx/{id}.mp3`. Список ID: `MUSIC_IDS = [1,2,3,4]`, `SFX_IDS = [11..23, 26..34, 35, 36, 38]` (24, 25, 37 — нет в оригинале). При ошибке загрузки — `console.warn`, промис резолвится, игра продолжается.
- **Музыка.** `HTMLAudioElement` в Map по id. Плейлист: `MUSIC_NEXT = { 1:1, 2:3, 3:4, 4:2 }`. Трек 01 зациклен через `audio.loop = true`. Остальные — через `onended` → `playMusic(next)`. `Playing.onEnter` → `audio.playMusic(2)`, `Playing.onExit` → `audio.stopMusic()`, `Menu.onEnter` и `GameOver.onEnter` → `audio.playMusic(1)`.
- **Музыка.** `HTMLAudioElement` в Map по id. Плейлист: `MUSIC_NEXT = { 1:1, 2:3, 3:4, 4:2 }`. Трек 01 зациклен через `audio.loop = true`. Остальные — через `onended` → `playMusic(next)`.
- **По режимам:**
  - `Menu.onEnter` → `audio.playMusic(1)`
  - `GameOver.onEnter` → `audio.playMusic(1)`
  - `Playing.onEnter` → `audio.playMusic(2)`, `Playing.onExit` → `audio.stopMusic()`
  - `Help` — наследует 01 от Menu, ничего не трогает
  - `Intro` — в текущей реализации беззвучное (autoplay), целевое — с треком 01 после splash screen (см. раздел 7)- **Autoplay unlock.** На первом `keydown`/`mousedown`/`touchstart` — `audio.unlock()`: проигрывает трек 01 с `volume = 0`, ставит на паузу, `currentTime = 0`, восстанавливает `volume`. После этого браузер разрешает `play()`. В `main.ts` три слушателя снимаются после первого срабатывания.
- **Mute.** Клавиша M в любом режиме → `consumeMute()` в `main.ts` (перед `machine.tick()`) → `audio.toggleMute()`. Регулирует `volume` текущей музыки. SFX — добавятся в 9.3.
- **Пауза.** `Playing` при Esc/P → `audio.setPaused(paused)`: `pause()` / `play()` текущего трека. SFX не глушатся (9.4).
- **SFX.** Пока `playSfx()` — stub. Реализация в 9.3.

### Отклонения от оригинала

- **Hero die счётчик** — в оригинале не сбрасывался (баг, тишина после 29). У нас: 26→27→28→29→26 (фикс, SPEC 13.2).
- **Пауза** — в оригинале при Pause музыку/SFX приглушали (`SetPause` в FMOD). У нас — `audio.setPaused(true)`: текущий трек ставится на паузу (`current.pause()`), при снятии — `current.play()`. SFX не глушатся (SFX-pause — в 9.4).
- **Player заблокирован `falling`-камнем (AABB, не getCell).** Попытка войти в клетку, пиксельно перекрытую падающим камнем, блокируется. Проверка идёт по AABB камня и целевой клетки, а не через `findStoneAt` — `getCell()` округляет, и камень «середине падения» может логически быть уже в следующей клетке, физически занимая часть текущей. В оригинале игрок мог войти и умереть — мы блокируем как UX-улучшение.

### Скорости

- Пересчитаны под фиксированный тик 20 Hz (оригинал был на `Sleep(10)` с переменным dt).
- `PLAYER_SPEED = 5`, `MONSTER_SPEED = 3`, `STONE_FALL_SPEED = 8`, `STONE_PUSH_SPEED = 5`.
- Могут быть уточнены после плейтеста в фазе 5–6.

### Парсер уровня

- Пустые строки и `\r` отбрасываются — защита от copy-paste артефактов.
- BOM срезается.
- Если `fetch` вернул HTML (Vite SPA fallback при 404) — `main.ts` кидает понятную ошибку, а не пытается парсить HTML.
- В случае ошибки парсер выводит все увиденные строки — упрощает диагностику «не то количество строк».

### Canvas

- Отображается 1:1 (800×600), без масштабирования.
- Адаптивность — в фазе 11, если понадобится.

### Прочее

- Снег/сундук «съедаются» на каждом Idle-тике. Логика в Player.consumeCurrentTile(), вызывается из Player.update() при state === 'idle', до проверки ввода. Это соответствует поведению оригинала: PossibleDirection вызывается каждый Idle-тик, независимо от нажатой клавиши. Игрок наступил на клетку → на следующем тике снег/сундук уже исчез.
- Debug-буквы на тайлах. DEBUG_TILE_LABELS = true в config.ts. Поверх каждого тайла рисуется буква из формата уровня (B/S/C/P), чтобы отличать тайлы при отладке. Отключить в фазе 8, когда появятся спрайты.
- HUD — временный текст. В фазе 4 HUD показывает Score: и Chests: текстом через ctx.fillText (шрифт 20px monospace). В фазе 8 заменим на спрайтовые цифры.
- ctx.textAlign — сбрасывается вручную. После drawLabel (где textAlign = 'center') HUD-текст явно ставит textAlign = 'left'. Иначе координаты HUD-текста уезжают.
- Снег/сундук держат камень (фикс из фазы 5)
- Скатывание только с камня + проверки hasStoneAt/игрок.
- Толкание с follow
- Level.reset() при смерти — восстанавливает тайлы, score сохраняется
- pushed используется и для push игроком, и для rolling
- **Толкание переопределяет гравитацию.** `tryPush` не проверяет `canFall`: пока камень `pushed` — он катится горизонтально, даже если под ним пусто. Гравитация включается, только когда игрок отпускает клавишу (камень становится `idle`, `tryStartFallingOrRolling` роняет его). Соответствует оригиналу.
- **Game владеет уровнями.** `Game` получает `levelPaths` и `fetchLevel` в конструкторе. `loadLevel` асинхронный, `loading`-флаг блокирует tick во время загрузки. `onLevelComplete` инкрементит `levelIndex`, при `nextIndex >= levelPaths.length` ставит `isGameOver = true`.
- **Reset vs Reload при смерти.** При `onPlayerHit` с `lives > 0` вызывается `resetLevel()` — та же сцена, все сущности на стартовых позициях, `Level.reset()` восстанавливает тайлы и `chestsCount`. Уровень НЕ перезагружается с диска. `score` сохраняется.
- **HUD в фазе 7 — текстовый.** `Lives: N`, `Score: N`, `Level: N` через `ctx.fillText`. В фазе 8 заменяется на спрайтовые цифры/иконки.
- **GameOver-оверлей.** При `isGameOver === true` поверх поля рисуется `rgba(0,0,0,0.75)` + `GAME OVER` + `Score: N` + `Rating: <getRating(levelIndex)>`.
- **FSM (8.1).** `ModeMachine` в `game/modeMachine.ts`. `main.ts` регистрирует все режимы (intro, menu, help, playing, gameover), `machine.setMode('intro')` при старте. `Playing` содержит всю игровую логику; остальные — `ModeHooks` с опциональными `tick`/`render`/`onEnter`/`onExit`.
- **Input — continuous + edge-triggered.** `getDirection()` и `getMousePosition()` — continuous (читают текущее состояние). `consumeConfirm/Pause/Mute/Click/AnyKey` — edge: накапливают событие и сбрасывают при вызове. Нормировка кликов через `getBoundingClientRect`.
- **HUD вынесен в `render/hud.ts` (8.2).** Визуально без изменений. В фазе 10 заменим текст на спрайты.
- **Пауза (8.3).** Esc/P в `Playing` — toggle `paused`. `tick()` при `paused` не вызывает `game.tick()`. `onEnter` сбрасывает `pendingPause`, чтобы не «съесть» нажатие из предыдущего режима. Оверлей — `drawPauseOverlay`.
- **Menu (8.4).** Кнопки-плейсхолдеры: рамка + monospace-текст. В фазе 10 — PNG, если найдётся комиксовый шрифт; иначе останется текст. Hover — жёлтая рамка и жёлтый текст. About/Exit — модальные оверлеи (не отдельные режимы), закрываются кликом/Enter/Esc. Start → новый `Game` (score=0, lives=4, level=1). Enter в Menu = Start.
- **Help (8.5).** Отдельный GameMode. Тёмный градиентный фон (плейсхолдер). Word-wrap длинного текста (10 предложений оригинала). Кнопка Main Menu → Menu. Esc/Enter → Menu.
- **Intro (8.6).** Полная анимация R/G/B/Team/Presents. Скорости ×2 от оригинала (~7.7s vs 15.4s). Скип по любой клавише/клику (`consumeAnyKey`/`consumeClick`) → сразу Menu. Авто-переход через 500мс после того, как все элементы встали. Известная мелочь: композиция слегка съехала влево (правим в фазе 10). В фазе 8 — текст, в фазе 10 — PNG.
- **GameOver (8.7).** Полноценный GameMode (не оверлей внутри Playing). При `game.isGameOver` в `Playing.tick` — `setMode('gameover')`. Оверлей: тёмный экран поля, «GAME OVER», счёт, рейтинг, кнопка Back to Menu. HUD внизу виден. Клик/Enter/Esc → Menu. `game` остаётся как есть; при следующем Start из Menu создаётся новый.
- **Полный цикл:** `Intro (скип) → Menu → Playing → (GameOver | конец уровней) → GameOver → Menu → Playing → ...`. Замыкается без F5.

### Монстры и проходимость

- Монстр ходит **только по клеткам `empty`**. Стены, **видимый снег, видимый сундук**, камни, другие монстры и край карты — все блокируют. Соответствует `Monster::PossibleDirection` в оригинале (`Snow` / `Chest` с `Visible()` → return false).
- После того как игрок съел снег/сундук (клетка стала `empty`), монстр может пройти по этой клетке.
- Монстр выбирает случайное доступное направление только при блокировке; иначе продолжает движение в текущем.

### Игрок → Монстр

- Если игрок пытается войти в клетку с живым монстром → `game.onPlayerHit` → рестарт уровня.
- Если монстр наступает на игрока (AABB) → то же самое.
- Поведение соответствует оригиналу (в оригинале игрок тоже умирал при попытке войти в клетку монстра — через AABB-проверку в следующем тике).

### Камень ↔ Снег/Сундук (fix, важно)

- Снег и сундук **держат камень** как опору: `Stone.isCellFree` использует `level.getCell() === 'empty'`, **не** `isPassable()`. Соответствует `Object::Empty() == !visible` в оригинале.
- Когда игрок съедает снег/сундук → клетка становится `empty` → камень теряет опору и падает на игрока (если он под ним).

### Монстры — цвет плейсхолдеров (debug)

- Модель 1 (Амёба): `#e74c3c` (красный), буква `M`
- Модель 2 (Спайкер): `#e67e22` (оранжевый), буква `U`

### Экраны меню (фаза 8)

- **Menu → Playing = новая игра.** `Game` пересоздаётся (score=0, lives=4, levelIndex=0).
- **Exit** — не закрывает окно (браузер), показывает модальный оверлей «Thanks for playing!». Звук — Hero Die (id уточним в фазе 9).
- **About** — модальный оверлей поверх Menu с текстом из оригинала (RGB Team / SnowDash v1.0 / 2 Dash or not 2 Dash / (c) 2006). Не отдельный GameMode.
- **Help** — отдельный GameMode с текстом (см. SPEC 12.1) и кнопкой Main Menu.
- **Intro** — полная анимация R/G/B/Team/Presents по координатам и скоростям оригинала. Скип по любой клавише/клику. Авто-переход ~3 сек (не 15, как в оригинале — сократили для UX).
- **Ассеты меню пока нет** — в фазе 8 рисуем плейсхолдеры: фон-градиент, кнопки-текст в рамках, Help-текст через `ctx.fillText`. Замена на PNG (`IDB_START`, `IDB_ABOUT`, `IDB_HELP`, `IDB_EXIT`, зимний фон) — в фазе 10.
- **DEBUG_TILE_LABELS** — оставляем `true` до фазы 10.
- **Menu (8.4).** `createMenu` возвращает `ModeHooks`. Кнопки — плейсхолдеры (рамка + текст), в фазе 10 заменятся на PNG. Координаты: Let's Go! (60,505,140,65), About (240,505), Help! (420,505), Exit (600,505). Hover — жёлтая рамка. About и Exit — модальные оверлеи (не отдельные режимы), закрываются кликом/Enter/Esc. Start → новая `Game`. Enter = Start (без модалки). Esc в Menu = Start (короткий путь).
- **Help (8.5).** Отдельный GameMode. Фон — тёмный градиент (заглушка), заголовок «Help!» синим, 10 предложений оригинала с word-wrap, кнопка Main Menu внизу слева. Esc/Enter/клик по кнопке → Menu.
- **Intro (8.6).** Полная анимация R/G/B/Team/Presents. Позиции и скорости в ELEMENTS_DEF. Скорости ×2 от оригинала (~7.7s vs 15.4s) — чтобы не ждать. Скип по любой клавише/клику через consumeAnyKey/consumeClick → сразу Menu. Авто-переход через 500мс после того, как все элементы встали. Известная мелочь: композиция слегка съехала влево (правим в фазе 10).

---

## 5. Ассеты

> Статус: что уже есть, что ждёт конвертации.

### Изображения (спрайты)

| Что                    | Где                             | Статус                     |
| ---------------------- | ------------------------------- | -------------------------- |
| Player (12 PNG)        | `public/sprites/player/`        | ⏸ ждёт скрипта конвертации |
| Monster тип 1 (12 PNG) | `public/sprites/monster1/`      | ⏸                          |
| Monster тип 2 (12 PNG) | `public/sprites/monster2/`      | ⏸                          |
| Stone                  | `public/sprites/stone.png`      | ⏸                          |
| Wall / Snow / Chest    | `public/sprites/*.png`          | ⏸                          |
| Background             | `public/sprites/background.png` | ⏸                          |
| HUD (цифры, надписи)   | `public/sprites/hud/`           | ⏸                          |

**Исходники BMP:** ⏸ путь к папке оригинала не зафиксирован.

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

| Что             | Где                            | Статус                                 |
| --------------- | ------------------------------ | -------------------------------------- |
| level01.txt     | `public/levels/level01.txt`    | ✅ (стены, снег, сундуки, камни, M, U) |
| level02.txt     | `public/levels/level02.txt`    | ✅ (2 сундука, M)                      |
| level03.txt     | `public/levels/level03.txt`    | ✅ (2 сундука, K, U)                   |
| level_list.txt  | `public/levels/level_list.txt` | ✅ (3 пути)                            |
| level04..10.txt | —                              | ⏸ фаза 10                              |

---

## 6. Как запустить

npm install
npm run dev — dev-сервер на http://localhost:5173
npm run build — прод-сборка в dist/
npm run preview — локальный просмотр прод-сборки
npm test — юнит-тесты (Vitest)

---

## 7. Известные проблемы / TODO

> Всё, что сломано, работает не так или отложено.

- **Intro беззвучное (временная мера).** Autoplay заблокирован до первого user gesture. В следующей итерации — splash screen с кнопкой Start перед Intro, после которого Intro играет с треком 01. Это вернёт поведение оригинала (SPEC 13.1).

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
