const translations = {
  en: {
    // Headers
    gameTitle: 'SnowDash',
    gameSubtitle: '20th Anniversary Edition',
    aboutTitle: 'About this port',
    releaseDate: 'Released: November 13, 2026',
    footerText: `Made with <span class="heart">♥</span> by <a href="https://github.com/dmibbb" target="_blank" rel="noopener noreferrer">Димасик</a> in 2026`,

    // Left Panel (Controls)
    controlsTitle: 'Controls',
    navTitle: 'Navigation',
    navKeys: 'W A S D / ⬆ ⬅ ⬇ ➡',
    pauseTitle: 'Pause (in-game)',
    pauseKeys: 'Esc / P',
    restartTitle: 'Restart level (−200PTS)',
    restartKeys: 'R',
    muteTitle: 'Mute sounds and music',
    muteKeys: 'M',
    nextTrackTitle: 'Next track (in-game)',
    nextTrackKeys: 'N',

    // Right Panel (Objectives)
    objectivesTitle: 'Objectives',
    objIntro: 'Oh no! Santa lost all his presents! Help him, Mr. Snejok!',
    objWin: 'To win',
    objWinDesc: 'Collect every present in the level.',
    objHelp: 'To help you',
    objHelpDesc1: 'Eat snow to clear your path.',
    objHelpDesc2: 'Push boulders off ledges to crush monsters.',
    objWatch: 'Watch out',
    objWatchDesc1: 'Any monster kills you on touch.',
    objWatchDesc2: 'So does a falling boulder.',
    objLives: 'Lives',
    objLivesDesc1: 'You start with 4.',
    objLivesDesc2: 'Each death resets the level (presents return).',
    objLivesDesc3: "Lose them all, and it's Game Over.",

    // About
    hiThere: 'Hi there!',
    introP1: `<b>Димасик</b> (<span class="rgb-b">B</span> from <span class="rgb-r">R</span><span class="rgb-g">G</span><span class="rgb-b">B</span> <span class="rgb-team">Team</span>) here 👋<br><br>Before you is a special web edition of the super-duper mega-cool game <b>SnowDash</b>. It was made by third-year students back in 2006. Since the game became a bit of a meme in narrow circles (and among a certain club of those who passed the compiler coursework, IYKYK), and the 20th anniversary is right around the corner, I decided to make a web port. With a lot of help from DeepSeek and a bit of Qwen, the Win32 C++ application was ported to the web (TS) semi-manually in just a few evenings (I'm too poor to afford Claude 😢).`,
    histTitle: 'A bit of history',
    hist2006P1: `A university "Computer Graphics" course. The assignment: make a computer game, or something like it. So the three of us teamed up and formed <span class="rgb-r">R</span><span class="rgb-g">G</span><span class="rgb-b">B</span> <span class="rgb-team">Team</span>, named after our initials. And so we got to work!`,
    hist2006Fig0: `SnowDash 2006 ♥`,
    hist2006P2:
      'Young past-me was responsible for a few things (feel free to smack past-me on the head for any of them):',
    hist2006Li1: `<b>"Wrote" "the music".</b> All the cacophony you hear in the background is on me. Thanks to Hip-Hop eJay (great DAW, btw)! Unfortunately, I couldn't find the original files, so enjoy the 128 kbps MP3s. *Sad trombone noises...*`,
    hist2006Li2: `<b>Hooked up FMOD and handled all the sound.</b> All SFX were carefully cut and mixed in Sound Forge (another great tool, btw), if I remember correctly.`,
    hist2006Li3: `<b>All the visuals, too.</b> Every janky picture and animation was hand-drawn. I don't remember what I used — probably Paint.NET, or something equally simple. What I do remember: the "borrowed" Jokerman font and Ulead COOL 3D. BTW, I hope you "enjoyed" the Help text 😂 I left the image unchanged on purpose (*cringe*)`,
    hist2006Fig1: 'Hand-drawn, no AI! Proofs :D',
    hist2006Li4: `<b>The 15-second unskippable intro</b> with the awesomely sliding letters.`,
    hist2006Li5: `<b>Other stuff</b> like game levels, the rating system, and a bunch of other code bits, IIRC.`,
    hist2008P1: `We were allowed to reuse the project and submit it again for another course. It was a "Promising Software" course (we have a very "promising" SnowDash here). The game got a bit of polish: upgraded to a newer C++ standard, added a skippable intro, and threw in various small fixes based on the feedback from '06.`,
    hist2008Fig1: `SnowDash 2008. Feel the difference!`,
    hist2026P1: `Well, it's the AI era — why not practice writing a web application in TypeScript, especially when you are not a frontend developer? Plus, the game is turning twenty :D. Why not make a proper web edition?`,
    hist2026P2: `Luckily, I kept all my university stuff and even found the original uncompressed assets (except music and SFX, alas). Converted all BMPs to PNGs (saved you 5 MB of bandwidth, bro!) and for some assets I had to resurrect Ulead COOL 3D.`,
    diffTitle: "What's different in the web version",
    sliderCaption:
      'SnowDash: 20th Anniversary Edition. Feel the real UI difference: 2006 (left) vs 2026 (right)',
    diffLi1: `<b>Splash screen.</b> Browsers won't start audio without a user gesture, so we need one. The same screen doubles as the Exit destination: in a Win32 app you just close the window, but in a browser, where would "Exit" even take you? So, Exit → Splash.`,
    diffLi2: `<b>Panels around the canvas.</b> Controls and Objectives are new. Back in 2006 we just explained all that in person during the demo. That doesn't work here.`,
    diffLi3: `<b>Level name overlay.</b> The Win32 version used the window title for the level name. Here it appears as an overlay before each level starts.`,
    diffLi4: `<b>Custom dialogs and overlays.</b> Windows MessageBoxes and alerts don't exist inside a canvas, so all popups are custom overlays drawn on it.`,
    diffLi5: `<b>60 Hz tick rate.</b> The original ran at a variable ~64 fps; now it's a fixed 60 Hz tick and 60 FPS render — and it's actually smooth now. 🤯`,
    diffLi6: `<b>Track switch button.</b> The original had no such thing, and the "genius" music starts drilling into your skull after a few minutes (too many repetitive parts). I cut the volume in half and added an in-game track switch (N) in case you start feeling 🤢.`,
    diffLi7: `<b>All ten levels were updated</b>, and I've cleared every single one of them individually (though I haven't done a full-game run yet). The catch: in the original, the last column of the grid matrix was never drawn — the levels simply left it empty. Rebuilding them meant filling the last column, shifting and adding some things here and there.`,
    diffLi8: `<b>Random starting directions for enemies.</b> The originals always walked in one preset direction, which felt stale.`,
    diffLi9: `<b>And small bug fixes</b> along the way — but the overall visual design stays true to 2006.`,
    thanksTitle: 'Thanks for playing',
    thanksP1: `The SnowDash gestalt is finally closed.<br>Thanks for playing (if anyone in their right mind actually plays this — amen)`,
    sincerely: `Sincerely,<br><b>Димасик</b>`,
  },
  ru: {
    // Headers
    gameTitle: 'СнежныйРывок',
    gameSubtitle: '20-е Юбилейное издание',
    aboutTitle: 'Об этой версии',
    releaseDate: 'Издано: 13 ноября 2026',
    footerText: `Сделал с <span class="heart">♥</span> <a href="https://github.com/dmibbb" target="_blank" rel="noopener noreferrer">Dim♂ass♂ik</a> в 2026`,

    // Left Panel (Controls)
    controlsTitle: 'Управление',
    navTitle: 'Движение',
    navKeys: 'Ц Ф Ы В / ⬆ ⬅ ⬇ ➡',
    pauseTitle: 'Пауза (в игре)',
    pauseKeys: 'Отм / З',
    restartTitle: 'Перезагрузка уровня (−200Очк)',
    restartKeys: 'К',
    muteTitle: 'Выключить звук',
    muteKeys: 'Ь',
    nextTrackTitle: 'Следующий трек',
    nextTrackKeys: 'Т',

    // Right Panel (Objectives)
    objectivesTitle: 'Цели',
    objIntro:
      'Это. Не. Можыд. Быт. Дед Мороз потерял все сладкие подарочки! Помоги ему, господин Снежок!',
    objWin: 'Чтобы победить',
    objWinDesc: 'Собери все подарки на уровне.',
    objHelp: 'Помоги себе сам',
    objHelpDesc1: 'Поешь снег, чтобы расчистить путь.',
    objHelpDesc2: 'Сталкивай камни с уступов, чтобы давить монстров.',
    objWatch: 'Осторожно',
    objWatchDesc1: 'Любой монстр убивает при касании.',
    objWatchDesc2: 'Как и падающий камень.',
    objLives: 'Жизни',
    objLivesDesc1: 'У тебя их 4 и все жизни Снежка важны.',
    objLivesDesc2: 'Каждая смерть перезапускает уровень (включая собранные подарочки).',
    objLivesDesc3: 'Потеряешь все — всё, игра окончена.',

    // About
    hiThere: 'Здарова заебал!',
    introP1: `Это <b>Dim♂ass♂ik</b> (<span class="rgb-b">С</span> из <span class="rgb-r">К</span><span class="rgb-g">З</span><span class="rgb-b">С</span> <span class="rgb-team">Команда</span>) 👋<br><br>Это специальное web издание супер крутой и всеми любимой игры <b>СнежныйРывок</b>. Изначально игра была сделана пацыками 3 курса в далёком 2006 году. Так как игра обрела культовый статус в узких кругах (особенно в одном клубе тех, кто сдал компилятор, IYKYK), и к тому же игре стукнуло 20, я решил запилить web-порт. С помощью ДикПика и Квена Win32 C++ приложение было портировано на TypeScript за пару вечеров (фактически, за неделю; ну да, я нищеброд без Клёёёёта 😢).`,
    histTitle: 'Немного истории',
    hist2006P1: `Курс КГ от АМ. Задача: сделать игру или типа того. Собрались с пацанчиками и сделали <span class="rgb-r">К</span><span class="rgb-g">З</span><span class="rgb-b">С</span> <span class="rgb-team">Команда</span>, названную по нашим английским инициалам. И всё заверте...`,
    hist2006Fig0: `СнежныйРывок 2006 ♥`,
    hist2006P2: 'Тогдашний я отвечал за (по всем вопросам обращайтесь к нему):',
    hist2006Li1: `<b>"Написал" "музыку".</b> Вся какофония, что слышна в игре — моя вина. "Писалось" всё это в Hip-Hop eJay (крутой DAW)! К сожалению, я просрал все полимеры и оригинальные файлы. Пу-пу-пууу... Так что от 128 kbps MP3 хоть кайфуйте.`,
    hist2006Li2: `<b>Подключил FMOD и отвечал за весь звук в игре.</b> Все SFX были аккуратно нарезаны (там было штук 5+ всяких источников) и сведены в Sound Forge (еще один отличный инструмент).`,
    hist2006Li3: `<b>И за весь визуал тоже.</b> Каждая всратая картинка и "анимация" была отрисована вручную. Я не помню, в чем именно рисовал — скорее всего, в Paint.NET или чем-то столь же простом. Но точно помню, что использовался шрифт Jokerman и крутая программа Ulead COOL 3D. Надеюсь, "кайфанули" от текста на экране Help 😂 Специально картинку оставил (*кринге*)`,
    hist2006Fig1: 'Никакого ИИ! Пруфы :D',
    hist2006Li4: `<b>15-секундное нескипуемое интро</b> с медленно ползущими буквами.`,
    hist2006Li5: `<b>Прочее</b> типа уровней (делал тогда в последний момент рандомом), рейтинги, и прочую мелочь, ЕМНИП.`,
    hist2008P1: `На других курсах нам разрешили переиспользовать Снежка. Одним из них был курс "Перспективное ПО" (а у нас тут, между прочим, очень "перспективный" СнежныйРывок). Игру немного отполировали: обновили до последней версии C++, добавили скип на интро, и так по мелочам.`,
    hist2008Fig1: `СнежныйРывок 2008. Почувствуй разницу!`,
    hist2026P1: `Ну раз сейчас время ИИ, то почему бы не попрактиковаться в "написании" TypeScript-приложухи с любимой ИИшечкой, особенно, когда ты с фронтом не-алё? К тому же, игре — двадцатка :D. Совпадение? Не думаю!`,
    hist2026P2: `К счастью, у меня сохранились все наработки по СнежномуРывку, включая несжатые ассеты (кроме музыки и SFX, увы). Перевёл все BMP картинки в PNG (и сэкономил 5 метров твоего трафика, бро!), а для некоторых картинок пришлось заняться некромантией и воскрешать через одно место Ulead Cool 3D.`,
    diffTitle: 'Что изменилось в веб-версии',
    sliderCaption:
      'СнежныйРывок: 20-е Юбилейное издание. Почувствуй реальную разницу в УЕ: 2006 (слева) и 2026 (справа)',
    diffLi1: `<b>Splash-скрин.</b> Браузеры не запускают аудио без действия пользователя, так что такой экран стал очень нужен. Сюда же мы и выходим из игры: в Win32 просто закрываешь окно, а в браузере куда можно "Выйти" (кроме как в окно)? Так что Exit → Splash.`,
    diffLi2: `<b>Панельки вокруг канваса.</b> Добавил Управление и Цели. В универе мы просто объясняли игру вживую. А кому тут объяснять?`,
    diffLi3: `<b>Оверлей с названием уровня.</b> В Win32-версии название уровня было в заголовке окна. Здесь же оверлеем перед началом каждого уровня.`,
    diffLi4: `<b>Прочие кастомные диалоги и оверлеи.</b> Windows MessageBoxes и алертов нет, поэтому все всплывающие окна сделаны как кастомные оверлеи.`,
    diffLi5: `<b>Частота тиков 60 Гц.</b> Оригинал работал на переменных ~64 fps с кучей Sleep'ов; теперь для логики есть фиксированные 60 Гц и 60 FPS для рендера. Стало реально плавно! 🤯`,
    diffLi6: `<b>Кнопка переключения треков.</b> Вся моя "гениальная" музыка начинает буквально заёбывать уже через пару минут. Чтобы вы не страдали, я урезал громкость вдвое и добавил переключение треков в игре (N) для разнообразия фона.`,
    diffLi7: `<b>Все уровни обновлены</b>, и я прошёл каждый из них по отдельности (но не делал полный прогон игры). Оригиналы нельзя было использовать as is: там последний столбец сетки никогда не заполнялся. Пришлось немного перестраивать и подстраивать уровни.`,
    diffLi8: `<b>Рандомные начальные направления</b> у врагов. В оригинале монстры всегда стартовали в одном заданном направлении, что оказалось немного неудобно для левел-дизайна.`,
    diffLi9: `<b>Мелкие фиксы багов</b> тут и там — но общий визуальный дизайн и ощущения игры остались как в 2006 году.`,
    thanksTitle: 'Поигрались и хватит',
    thanksP1: `Наконец-то закрыт гештальт по Снежку.<br>Спасибо за игру (если кто-то вообще будет в ЭТО играть)`,
    sincerely: `Всем чмоки,<br><b>Dim♂ass♂ik</b>`,
  },
};

type Lang = 'en' | 'ru';
let currentLang: Lang = 'en';

function applyLanguage(lang: Lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n') as keyof (typeof translations)['en'];
    if (key && translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });

  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = lang === 'en' ? 'RU' : 'EN';
  document.documentElement.lang = lang;
}

export function initSiteUI(): void {
  applyLanguage('en');

  // Language Toggle
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', (e) => {
      e.preventDefault();
      applyLanguage(currentLang === 'en' ? 'ru' : 'en');
      (e.currentTarget as HTMLButtonElement).blur();
    });
  }

  // Image Comparison Slider
  const sliderInput = document.getElementById('slider-input') as HTMLInputElement;
  const sliderFg = document.getElementById('slider-fg');
  const sliderLine = document.getElementById('slider-line');

  if (sliderInput && sliderFg && sliderLine) {
    sliderInput.addEventListener('input', () => {
      const val = sliderInput.value;
      sliderFg.style.clipPath = `polygon(0 0, ${val}% 0, ${val}% 100%, 0 100%)`;
      sliderLine.style.left = `${val}%`;
    });
  }
}

export function updateMuteButton(isMuted: boolean): void {
  const muteBtn = document.getElementById('mute-action-btn');
  if (muteBtn) {
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
  }
}
