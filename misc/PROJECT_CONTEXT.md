# SnowDash Web — актуальный контекст проекта

> Живой документ. Обновляется после каждой фазы.
> Источник истины по механике — `SPEC.md`. Здесь — что уже сделано, как устроено и какие решения приняты.
>
> **Последнее обновление:** 2026-11-10
> **Текущая фаза:** 8 — UI — HUD, Pause, Modes
> **Следующая фаза:** 9 — Sound

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
| 8   | UI — HUD, Pause, Modes   | 🔄 in progress |            |
| 9   | Sound                    | ⏸ not started  |            |
| 10  | Real Assets              | ⏸ not started  |            |
| 11  | Tests, Polish, Deploy    | ⏸ not started  |            |

Легенда: ⏸ not started · 🔄 in progress · ✅ done · ⚠️ blocked

---

## 2. Структура src/

> Заполняется по мере появления файлов. Показывает «что уже существует», чтобы AI не создавал дубликаты.

```
src/
├── main.ts        — тонкая точка входа: загрузка level_list.txt, создание Game, RAF-цикл
├── config.ts      — все игровые константы
├── types.ts       — Direction, GameMode, TileType, Point, CellCoords
├── style.css      — центрирование canvas 1:1, image-rendering: pixelated
├── input/
│   └── input.ts   — клавиатура: стрелки/WASD, preventDefault, сброс на blur
├── entities/
│   ├── player.ts  — Player: движение, еда снега/сундуков, проверка камней/монстров
│   ├── stone.ts   — Stone: idle/falling/pushed, гравитация, скатывание, толкание
│   └── monster.ts — Monster: блуждание, killed-флаг, модель 1|2
├── game/
│   ├── game.ts         — Game: score, lives, levelIndex, level, player, stones, monsters, isGameOver; загрузка уровней, tick, onPlayerHit
│   ├── modeMachine.ts  — ModeMachine: FSM с register/setMode/tick/render, хуки onEnter/onExit
│   └── rating.ts       — getRating(levelIndex): строка
├── level/
│   ├── parser.ts       — parseLevel(text): ParsedLevel
│   ├── parser.test.ts  — 9 юнит-тестов (Vitest)
│   └── level.ts        — Level: сетка, getCell/setCell/isPassable, reset
└── render/
    ├── renderer.ts — render(ctx, game): сцена + GameOver-оверлей
    └── hud.ts      — renderHud(ctx, game): HUD-полоса
```

`—` → краткое описание, что делает файл. Заполняется по мере появления.

Папки `assets/`, `audio/`, `modes/` — **пока не существуют**, появятся в фазах 2–8.

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

### Input

```
// input/input.ts
initInput(canvas: HTMLCanvasElement, w?: number, h?: number): void
getDirection(): Direction | null       // continuous (held keys)
consumeConfirm(): boolean              // edge: Enter/Space
consumePause(): boolean                // edge: Esc/P
consumeMute(): boolean                 // edge: M
consumeClick(): { x: number; y: number } | null  // edge: mousedown, в логических координатах (с учётом CSS-скейла)
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

- **Музыка:** `HTMLAudioElement`, предзагрузка при старте, `loop = false`, переключение по `onended`.
- **SFX:** пул `HTMLAudioElement` — по одному экземпляру на каждый файл, при воспроизведении `currentTime = 0; play()`.
- **Разблокировка:** на первом `click`/`keydown` — проигрываем «тихий» звук, чтобы разблокировать autoplay.

### Отклонения от оригинала

- **Hero die счётчик** — в оригинале не сбрасывался (баг, тишина после 29). У нас: 26→27→28→29→26 (фикс, SPEC 13.2).
- **Пауза** — в оригинале при Pause музыку/SFX приглушали; у нас — `audio.muted` на время паузы.
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
- **FSM (фаза 8.1).** `ModeMachine` в `game/modeMachine.ts` диспатчит `tick`/`render` по `currentMode` через зарегистрированные хуки. `main.ts` регистрирует все режимы, `machine.setMode('intro')` при старте. `Playing` содержит всю игровую логику; `Intro/Menu/Help/GameOver` — заглушки, заполнятся в 8.4–8.7.
- **Input — edge-triggered.** `getDirection()` читает held keys (для движения). `consumeConfirm/Pause/Mute/Click` — edge-triggered: накапливают событие, отдают при вызове и сбрасывают. Режим сам решает, что делать с событием. `initInput` принимает canvas, чтобы нормировать клики через `getBoundingClientRect` (учёт CSS-скейла).
- **Intro — временный shortcut (8.1).** Сейчас `Intro` — чёрный экран с «SNOWDASH — PRESS ENTER». Enter/Space → `startGame()` → `Playing`. В 8.6 заменим на полную анимацию R/G/B/Team/Presents + скип по любой клавише → `Menu`. В 8.4 между Intro и Playing появится Menu.

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

| Что          | Где                    | Статус |
| ------------ | ---------------------- | ------ |
| Музыка 01–04 | `public/sounds/music/` | ⏸      |
| SFX 11–38    | `public/sounds/sfx/`   | ⏸      |

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

- Пусто (пока не начали).

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
