# SnowDash Web — актуальный контекст проекта

> Живой документ. Обновляется после каждой фазы.
> Источник истины по механике — `SPEC.md`. Здесь — что уже сделано, как устроено и какие решения приняты.
>
> **Последнее обновление:** 2026-10-28
> **Текущая фаза:** 1 — Setup & Skeleton
> **Следующая фаза:** 2 — Player on Empty Grid

---

## 1. Статус фаз

| #   | Фаза                     | Статус         | Дата       |
| --- | ------------------------ | -------------- | ---------- |
| 1   | Setup & Skeleton         | ✅ Done        | 06/11/2026 |
| 2   | Player on Empty Grid     | ✅ Done        | 06/11/2026 |
| 3   | Level Loading & Walls    | 🔄 in progress |            |
| 4   | Tiles Interactions       | ⏸ not started  |            |
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
├── main.ts              — точка входа: canvas, загрузка уровня, rAF-цикл, вызовы tick()/render()
├── config.ts            — все игровые константы
├── types.ts             — Direction, GameMode, TileType, Point, CellCoords
├── style.css            — центрирование canvas, 1:1, pixelated
├── input/
│   └── input.ts         — клавиатура: стрелки/WASD, preventDefault, сброс на blur
├── entities/
│   └── player.ts        — класс Player: движение по клеткам, скорость 5 px/tick
└── render/
    └── renderer.ts      — фон, сетка, HUD-полоса, игрок-плейсхолдер
```

`—` → краткое описание, что делает файл. Заполняется по мере появления.

Папки `assets/`, `audio/`, `level/`, `game/`, `modes/` — **пока не существуют**, появятся в фазах 2–8.

---

## 3. Интерфейсы между модулями

> Самая важная секция. Здесь фиксируются сигнатуры функций/классов, чтобы модули стыковались.
> Обновляется, когда появляется новый публичный интерфейс или меняется существующий.

### Точка входа

```
// main.ts
loadAssets(): Promise<void>
mainLoop(): void — rAF-цикл с аккумулятором 50 мс
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
}
```

### Level

```
// level/level.ts
class Level {
cols: number
rows: number
tileSize: number

getCell(col: number, row: number): GridCell
setCell(col: number, row: number, cell: GridCell): void
isPassable(col: number, row: number): boolean
}
```

> ⚠️ Остальные интерфейсы (`Monster`, `Stone`, `InputState`, `Audio`, `Renderer`) — добавить, когда появятся в коде.

---

## 4. Принятые решения и отклонения от SPEC

> Всё, что SPEC не оговаривает или оговорено двусмысленно — фиксируется здесь. Это защищает от «AI каждый раз решает по-своему».

### Placeholder-и (пока нет реальных PNG)

- **Игрок:** синий квадрат 40×40 (`ctx.fillStyle = '#3498db'; ctx.fillRect(...)`). Временно.
- **Стена:** серый квадрат `#7f8c8d`.
- **Снег:** белый квадрат `#ecf0f1`.
- **Сундук:** жёлтый квадрат `#f1c40f`.
- **Камень:** тёмно-серый `#34495e`.
- **Монстр:** красный квадрат `#e74c3c`.
- **Фон поля:** однотонный `#2c3e50`, без сетки линий (просто пустое тёмное поле).

### UI

- **Меню, Help, About, Game Over:** canvas-кнопки (рисуются через `ctx.fillRect` + текст через `ctx.fillText`), обработка кликов по координатам. НЕ HTML-элементы. Причина: единый стиль пиксель-арта.

### Аудио

- **Музыка:** `HTMLAudioElement`, предзагрузка при старте, `loop = false`, переключение по `onended`.
- **SFX:** пул `HTMLAudioElement` — по одному экземпляру на каждый файл, при воспроизведении `currentTime = 0; play()`.
- **Разблокировка:** на первом `click`/`keydown` — проигрываем «тихий» звук, чтобы разблокировать autoplay.

### Отклонения от оригинала

- **Hero die счётчик** — в оригинале не сбрасывался (баг, тишина после 29). У нас: 26→27→28→29→26 (фикс, SPEC 13.2).
- **Пауза** — в оригинале при Pause музыку/SFX приглушали; у нас — `audio.muted` на время паузы.

### Прочее, обнаруженное при реализации

- **Canvas 1:1** — отображается ровно 800×600, без масштабирования. Адаптивность — в фазе 11, если понадобится.
- **HUD в фазе 2** — серая полоса #4a4a4a + белая линия сверху, без цифр и иконок.

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

- **Строгий TS** (`strict: true` в `tsconfig.json`).
- **Классы**, не фабрики и не функциональный стиль. Объекты мутабельны (как в оригинале на C++).
- **Никаких сторонних библиотек** для игры. Только Vite, TS, Vitest, ESLint, Prettier.
- **Именование:** `camelCase` для переменных/функций, `PascalCase` для классов/типов, `UPPER_SNAKE` для констант в `config.ts`.
- **Единицы:** пиксели — целые числа, клетки — `col`/`row` (не `x`/`y`).
- **Никаких `any`.** Если нужно — `unknown` + type guard.
- **Импорты:** относительные, без алиасов (пока проект маленький). Но в проекте включён verbatimModuleSyntax: true — все импорты, которые используются только как типы (интерфейсы, type-алиасы, enum, Direction, GameMode, Point, CellCoords и т.п.), обязаны быть import type { X } from '...'. Обычный import — только для значений (классы, функции, константы).

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
