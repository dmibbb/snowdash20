# SnowDash Web — актуальный контекст проекта

> Живой документ. Обновляется после каждой фазы.
> Источник истины по механике — `SPEC.md`. Здесь — что уже сделано, как устроено и какие решения приняты.
>
> **Последнее обновление:** 2026-11-09
> **Текущая фаза:** 7 — Game State & Progression
> **Следующая фаза:** 8 — UI — HUD, Pause, Modes

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
| 7   | Game State & Progression | 🔄 in progress |            |
| 8   | UI — HUD, Pause, Modes   | ⏸ not started  |            |
| 9   | Sound                    | ⏸ not started  |            |
| 10  | Real Assets              | ⏸ not started  |            |
| 11  | Tests, Polish, Deploy    | ⏸ not started  |            |

Легенда: ⏸ not started · 🔄 in progress · ✅ done · ⚠️ blocked

---

## 2. Структура src/

> Заполняется по мере появления файлов. Показывает «что уже существует», чтобы AI не создавал дубликаты.

```
src/
├── main.ts — точка входа: canvas, загрузка уровня, rAF-цикл, tick()/render()
├── config.ts — все игровые константы
├── types.ts — Direction, GameMode, TileType, Point, CellCoords
├── style.css — центрирование canvas 1:1, image-rendering: pixelated
├── input/
│   └── input.ts — клавиатура: стрелки/WASD, preventDefault, сброс на blur
├── entities/
│   ├── player.ts  — класс Player: движение по клеткам, еда снега/сундуков, проверка камней/монстров впереди
│   ├── stone.ts   — класс Stone: idle/falling/pushed, гравитация, скатывание, толкание
│   └── monster.ts — класс Monster: случайное блуждание, killed-флаг, модель 1|2
├── game/
│   └── game.ts    — минимальный Game: score, visibleChests, stones[], monsters[], onPlayerHit
├── level/
│   ├── parser.ts — parseLevel(text): ParsedLevel; валидация, срез BOM/пустых строк
│   ├── parser.test.ts — 7 юнит-тестов (Vitest)
│   └── level.ts — класс Level: сетка тайлов, getCell/setCell/isPassable
└── render/
    └── renderer.ts — отрисовка: фон, сетка, тайлы (плейсхолдеры), HUD-полоса, игрок
```

`—` → краткое описание, что делает файл. Заполняется по мере появления.

Папки `assets/`, `audio/`, `modes/` — **пока не существуют**, появятся в фазах 2–8.

## 2a. public/

```
public/
└── levels/
    └── level01.txt — первый уровень (13 строк × 20 символов)
```

Ассеты (спрайты, звук) — появятся в фазах 9–10. Пока используются плейсхолдеры.

---

## 3. Интерфейсы между модулями

> Самая важная секция. Здесь фиксируются сигнатуры функций/классов, чтобы модули стыковались.
> Обновляется, когда появляется новый публичный интерфейс или меняется существующий.

### Точка входа

```
// main.ts
loadLevelFile(path: string): Promise<string>
-- fetch + проверка, что вернулся не index.html (защита от 404 → SPA fallback)

main(): Promise<void>
-- загружает /levels/level01.txt, парсит, создаёт Level и Player, запускает rAF
```

### Parser

```
// level/parser.ts
interface MonsterStart {
  col: number
  row: number
  model: 1 | 2
}

interface ParsedLevel {
  grid: TileType[][]
  start: CellCoords
  stoneStarts: CellCoords[]
  monsterStarts: MonsterStart[]
  chestsCount: number
}

parseLevel(text: string): ParsedLevel
```

### Game

```
// game/game.ts
class Game {
  score: number
  visibleChests: number
  stones: Stone[]
  monsters: Monster[]

  onPlayerHit(player: Player, level: Level): void
  // Lives, levelIndex, level switching, GameOver — in phase 7.
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
  update(
    inputDir: Direction | null,
    level: Level,
    game: Game,
    stones: Stone[],
    monsters: Monster[],
  ): void
}
```

### Level

```
// level/level.ts
class Level {
  readonly cols, rows, tileSize: number
  readonly start: CellCoords
  chestsCount: number

  getCell(col, row): TileType // вне границ → 'wall'
  setCell(col, row, type): void // вне границ → no-op
  isPassable(col, row): boolean // true кроме 'wall'
}
```

### Renderer

```
// render/renderer.ts
render(
  ctx: CanvasRenderingContext2D,
  level: Level,
  player: Player,
  game: Game,
): void
```

### Input

```
// input/input.ts
initInput(): void
getDirection(): Direction | null // приоритет: up > down > left > right
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

> ⚠️ Остальные интерфейсы (`InputState`, `Audio`) — добавить, когда появятся в коде.

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

| Что        | Где                             | Статус |
| ---------- | ------------------------------- | ------ |
| 10 уровней | `public/levels/level01..10.txt` | ⏸      |
| Список     | `public/levels/level_list.txt`  | ⏸      |

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
