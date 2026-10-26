# Снегопат x64 (v8snack) — глубокий анализ и тесты

Дата анализа: 2026-10-26. Репозиторий: `fishca/v8snack`, локальная копия `E:\work\repo_github\v8snack`.
Коммит HEAD: `74eb48b` (сборка 1.6.40, Core.As 1.0.2.4, 2026-10-22).

## 1. Что это и из чего состоит

«Снегопат» — расширение Конфигуратора 1С:Предприятие 8.3 (скриптовые аддины,
свой автодополнение, панель окон, diff, закладки). Оригинал — проект Александра
Орефкова (orefkov). В v8snack лежит доработанная **x64-сборка**: работает только
с 64-битным Конфигуратором.

```
snegopat-client/
  x64/            — сама сборка (23 МБ, ~1800 файлов):
    starter.exe       загрузчик (x86! — WOW64-процесс-«носитель»)
    lib/x64, lib/x86  core_as.dll (движок AngelScript), inject.dll,
                       coreas_runner_c/w.exe (консольный раннер-компилятор), _sqlite3.dll
    modules/
      starter/    стартер-модуль (StarterInterProcess, ipc)
      main/       базовый API модуля (winapi.v, com.v, sqlite.v)
      snegopat/   сам Снегопат: движок (~40 .as), v8api (29 .v), аддины
                  (~90 .js/.epf), natives snegopat.dll/snegopat_colors.dll (x64),
                  help/, www/, tools/
    data/        настройки (defaults/ + создаваемые settings/)
    logs/        журналы + diag.ini (переключатели, перечитывается раз в 2 c)
    load/        snegopat.txt — [snegopat_ide] modul=Snegopat, proc=1cv8.exe
    options.ini  пути и LogLevel
  dump-tools/    vtcmp.py, vtalign.py, v8re.py — перенос vtable на новую версию
  win11-fix/     .reg для Windows 11 24H2 (JScriptReplacement = 0) и откат
  README.txt     инструкция
```

### Загрузочная цепочка

1. `starter.exe` (x86) запускается до Конфигуратора; через `lib/x64/inject.dll`
   внедряет `core_as.dll` в процесс `1cv8.exe` (x64).
2. `core_as.dll` — рантайм AngelScript; компилирует модули из `modules/`
   (`module.info` → `src`, `api`, `lib`), исполняет `.as`.
3. Модуль `snegopat` вызывает `run()` в момент создания окна заставки 1С:
   читает конфиг, ставит перехваты (`TrapVirtualStdCall`) на слоты vtable
   интерфейсов платформы (текстовые окна, профиль, раскраска).
4. Аддины — обработчики (`.js` + `.epf`) на JScript; под Win11 24H2 может
   понадобиться `win11-fix` (возврат старого JScript вместо JScript9Legacy).

### Исходники

В `E:\work\snegopat_ref\` лежат клоны upstream (infostart-hub):
`core_as_loader` (C++: starter/inject/runner), `snegopat`, `snegopat_modul`
(C++-проект + движок). **Исходника самого `core_as.dll` (движка Core.As) на
машине нет — только заголовок `core_as/core_as.h` и бинарь.** `starter.exe` x86
и `coreas_runner_c.exe` собраны из `core_as_loader/src/{starter,runner,inject}`.

## 2. Механизм vtable и формат .v

```as
:iface IWindowView {GUID}
:base IView                     — методы базы идут первыми
:virt
    +1                          — пропустить 1 слот
    save bool createWindow(HWND) — один слот
    54                          — «абсолютный» слот следующего метода (легаси)
    #if ver >= 8.3.27 & ver < 8.3.28 ... #endif   — версионные ветки
```

Слоты нумеруются с 0: базовый интерфейс (рекурсивно), затем свои; `+N` — пропуск,
голое число — абсолютный слот следующего метода, перегрузки (одно имя, разные
сигнатуры) занимают свои слоты. Движок ссылается на слоты константами
`I<Интерфейс>_<метод>` (напр. `IWindowView_createWindow`). Версии сравниваются
покомпонентно (2–4 части). `#err` в `process.v` — guard неподдерживаемых версий.

## 3. Ландшафт платформ на этой машине

| Платформа | Разрядность | Статус в Снегопате (после фикса) |
|---|---|---|
| 8.3.25.1633 (`C:\Program Files\1cv8`) | x64 | компилируется ✓ |
| 8.3.27.1989 (`Program Files`) | x64 | компилируется ✓ (основная рабочая) |
| 8.5.1.1236, 8.5.1.960 (`Program Files`) | x64 | **НЕ поддерживается** (guard) |
| 8.3.27.1989 (`Program Files (x86)`) | x86 | не поддерживается (x64-only) |

## 4. Найденные проблемы

### 4.1. ✗→✓ Модуль не компилировался вне 8.3.27 (исправлено)

`engine/com_snegopat.as` вызывал `colorsLineBgCount()` безусловно, а эта функция
объявлена только для `ver >= 8.3.27 & ver < 8.3.28` (`v8api/colors_gate.v`).
Результат: на 8.3.10/8.3.17/8.3.18/8.3.24/8.3.25 модуль **не собирался** —
Снегопат не загрузился бы вообще.

Фикс: версионная ветка, на прочих версиях поле `"line":-1` (JSON-схема
`coloringBackgroundCounts()` сохранена). Проверено компилятором для всех версий.

### 4.2. ⚠️ `coreas_runner_c check` ломается с `/f`

Параметр `/f <папка_модуля>` заставляет загрузчик не находить `main` и падать
(«не удалось найти функцию int main(array<string>@)» — даже на синтетическом
модуле с точной сигнатурой). **Правильно:** запускать из корня Core.As
(папка `x64`) **без `/f`** — модуль находится по умолчанию
(`<корень>/modules/<имя>`). В `bld_tools/build.cmd` upstream так и делается.

### 4.3. ⚠️ 8.3.28+ и 8.5.x не поддерживаются

`v8api/process.v` строки 5–8: `ver >= 8.3.28` → `#err Unsupported version of 1C».
Это осознанный guard; на установленных 8.5.1.1236/960 Снегопат не поднимется.
Для полной поддержки 8.5.y нужен перенос vtable (раздел 6).

### 4.4. Прочие наблюдения

- `settings/` создаётся при первом запуске; `sn_forms.epf` — форма без кода (норма);
  `.js` с директивой `$engine JScript` — JScript-хостовые, не JS.
- Перегрузки `mdPropVal`/`setMdPropVal` в `IMDObject` — легальные (разные сигнатуры).
- `IID_IUnknown`, `IID_IDispatch`, `INVALID_HANDLE_VALUE`, `INDIC_*`, константы
  `INVOKE_*` — из stdlib Core.As / перечислений движка, в v8api их нет.
- Интерфейс `Window` в window.v — условная заглушка без методов.

## 5. Тесты (`tests/`)

```bash
python -m unittest discover -s tests -v          # базовый прогон (dump-tools скипнутся)
.venv-tests/Scripts/python -m unittest discover -s tests -v   # полный (capstone+pefile+numpy)
```

| Файл | Что проверяет |
|---|---|
| `test_compile.py` | компиляция модуля под 6 версий (8.3.10…8.3.27.1989) — exit 0, без ошибок; 8.3.28/8.5.1 обязаны отклоняться guard'ом |
| `test_v8api.py` | парсер `.v` (`tests/vparse.py`): интерфейсы/GUID/базы, слоты неотрицательны, guard process.v; все константы движка `I*_*` разрешимы в v8api/main.api (или определены в движке) |
| `test_integrity.py` | разрядность PE всех бинарей (starter=x86, lib/x64=x64…), module.info/load/options.ini, defaults, version.json, win11-fix |
| `test_addins.py` | пары .epf→.js, `node --check` по всем .js (кроме `$engine JScript`) |
| `test_dumptools.py` | `vtcmp.parse` (текст .vtable), `vtalign.records` (vt-dump.bin), `resolve_thunk`/`fingerprint` (реальный дизассемблер), `demangle` |

Итог на 2026-10-26: **37/37 зелёных** (в полном венве).

Ключевые грабли (подробно в `tests/README.md`): `/f` — нельзя; вывод
компилятора в cp866; `.v` бывают в utf-8-sig и cp1251; `+N`/абсолютные слоты/
перегрузки/`#else`-ветки — семантика учтена в парсере.

## 6. Восстановление полной работоспособности — план 8.5.1

1. **Снять дампы vtable** на рабочей (8.3.27.1989) и целевой (8.5.1.1236) платформах
   (инструкция `dump-tools/README.md`: `logs/vt.on` + запуск Конфигуратора с
   `-coreas-tracefunctions 1`, копия `x64/dump/.../*.vtable` в `dumps/<версия>/`).
   ⚠️ требует запуска Конфигуратора — делается вручную (или с пользователем).
2. **Сверить**: `python vtcmp.py --old dumps/8.3.27.1989 --new dumps/8.5.1.1236
   --old-bin <bin 8.3.27> --new-bin <bin 8.5.1>` — покажет сдвиги слотов по интерфейсам.
3. **Пропатчить** `v8api/*.v`: новые ветки `#if (ver >= 8.5.1 & ver < 8.5.2)` и т.п.
   (старые ветки не затирать). Затем ослабить guard в `process.v`.
4. **Проверить** `tests/`: добавить 8.5.1 в `SUPPORTED` в `test_v8api.py`/
   `test_compile.py`, прогнать компилятор.
5. Если интерфейсы 8.5 переехали в другие DLL — искать по GUID (`v8re.py guid`),
   править «Vtable in»/`:base` раскладки.

Что ещё не восстановлено и требует рук пользователя: реальный прогон Конфигуратора
с Снегопатом (загружается ли без ошибок в журнале `x64/logs/`), проверка
Ctrl+M/панелей на их Windows (24H2 fix), и перенос на 8.5.1 по плану выше.