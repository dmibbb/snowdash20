# SnowDash Web — актуальный контекст проекта

> Живой документ. Обновляется после каждой фазы.
> Источник истины по механике — `SPEC.md`. Здесь — что уже сделано, как устроено и какие решения приняты.
>
> **Последнее обновление:** 2026-11-06
> **Текущая фаза:** 4 — Tiles Interactions
> **Следующая фаза:** 5 — Stones

---

## 1. Статус фаз

| #   | Фаза                     | Статус         | Дата       |
| --- | ------------------------ | -------------- | ---------- |
| 1   | Setup & Skeleton         | ✅ Done        | 2026-11-06 |
| 2   | Player on Empty Grid     | ✅ Done        | 2026-11-06 |
| 3   | Level Loading & Walls    | ✅ Done        | 2026-11-06 |
| 4   | Tiles Interactions       | 🔄 in progress |            |
| 5   | Stones                   | ⏸ not started  |            |
| 6   | Monsters                 | ⏸ not started  |            |
| 7   | Game State & Progression | ⏸ not started  |            |
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
│   └── player.ts — класс Player: движение по клеткам, проверка стен через Level
├── level/
│   ├── parser.ts — parseLevel(text): ParsedLevel; валидация, срез BOM/пустых строк
│   ├── parser.test.ts — 7 юнит-тестов (Vitest)
│   └── level.ts — класс Level: сетка тайлов, getCell/setCell/isPassable
└── render/
    └── renderer.ts — отрисовка: фон, сетка, тайлы (плейсхолдеры), HUD-полоса, игрок
```

`—` → краткое описание, что делает файл. Заполняется по мере появления.

Папки `assets/`, `audio/`, `level/`, `game/`, `modes/` — **пока не существуют**, появятся в фазах 2–8.

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
interface ParsedLevel {
  grid: TileType[][]
  start: CellCoords
  chestsCount: number
}

parseLevel(text: string): ParsedLevel
-- валидирует 13×20, наличие ровно одной P, известные символы
-- срезает BOM, \r, пустые строки
```

### Game

```
// game/game.ts
class Game {
score: number
lives: number
levelIndex: number
level: Level | null
player: Player | null
monsters: Monster[]
stones: Stone[]

loadLevel(index: number): void
resetLevel(): void
tick(input: InputState): void
render(ctx: CanvasRenderingContext2D): void
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
  update(inputDir: Direction | null, level: Level): void
  // private nextCell(): CellCoords
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
render(ctx: CanvasRenderingContext2D, level: Level, player: Player): void
```

### Input

```
// input/input.ts
initInput(): void
getDirection(): Direction | null // приоритет: up > down > left > right
```

> ⚠️ Остальные интерфейсы (`Monster`, `Stone`, `InputState`, `Audio`) — добавить, когда появятся в коде.

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
