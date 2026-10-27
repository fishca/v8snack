# Документация скриптов AngelScript (движок Снегопата)

Подробная документация скриптовой части v8snack: модулей на AngelScript, исполняемых движком Core.As внутри Конфигуратора 1С. Составлена по исходникам `snegopat-client/x64/modules/` (состояние 1.6.43, 2026-10-27); для каждого файла — назначение, инициализация (пакеты/опции), все классы и методы, перехваты vtable, используемые API, взаимодействие с остальным движком, версионные ветки и особенности. Номера строк даны как `файл:строка` и соответствуют исходникам этого коммита.

| Документ | Файлы | Строк исходников |
|---|---|---|
| [00-overview.md](00-overview.md) — обзор архитектуры | module.info, main.as, packets.as, add_global.as; загрузочная цепочка, пакеты, опции, механизм перехватов, карта всех файлов | — |
| [01-core.md](01-core.md) — ядро: инфраструктура | pathes, options, settings_store, diag, dllloader, scriptLoader, addins, exitApp, tests, develop, probe_ifaces, templates (12 файлов) | ~2 170 |
| [02-com-designer.md](02-com-designer.md) — COM-обёртки SnegAPI, часть 1 | com_snegopat, com_designer, com_commands, com_events, com_files, com_hotkeys, com_profile, com_debug (8 файлов) | ~2 080 |
| [03-com-windows-metadata.md](03-com-windows-metadata.md) — COM-обёртки, часть 2 | com_windows, com_textwindow, com_metadata, com_v8ti, com_v8value, com_sqlite (6 файлов) | ~2 780 |
| [04-coloring.md](04-coloring.md) — раскраска и Scintilla | colorer, sqlcolors (2 файла) | ~4 530 |
| [05-editor.md](05-editor.md) — текстовый редактор | lexer, synedit, textwnd (3 файла) | ~2 230 |
| [06-ui.md](06-ui.md) — интерфейс | mainframe, mainmenu, controls, grid, forms (5 файлов) | ~1 840 |
| [07-intellisense.md](07-intellisense.md) — подсказки и разбор модулей | intellisite, mlist, smartboxitems, keywords, StockListInterceptor, ModuleTextProcessor, ModuleElements, typereader (8 файлов) | ~3 340 |
| [08-main-starter.md](08-main-starter.md) — модули `main` и `starter` | main/src (winapi.as, network.as, api/*.v), starter/src (main.as, ipc/ipc.as) | ~950 |

Итого: 48 файлов `.as` (~20 700 строк движка + модули `main`/`starter`), плюс обзор инфраструктуры `.v`.

## Как читать эти документы

- **Архитектура и жизненный цикл** — начать с [00-overview.md](00-overview.md): как Снегопат загружается, что такое пакеты (`Packet`), опции (`OptionsEntry`), перехваты (`TrapVirtualStdCall`), как перехватываются текстовые окна.
- **API аддинов (SnegAPI)** — объекты, видимые JScript-аддинам (`Designer`, `snegopat`, `windows`, `metadata`, `events`, `hotkeys`, `v8files`, `profileRoot` и т.д.), описаны в [02](02-com-designer.md) и [03](03-com-windows-metadata.md); именованные глобальные контексты 1С — в [00-overview.md](00-overview.md) §7 (аддин «global»).
- **Внутренние подсистемы** — редактор ([05](05-editor.md)), подсказки ([07](07-intellisense.md)), раскраска ([04](04-coloring.md)), UI/меню ([06](06-ui.md)), ядро/настройки/диагностика ([01](01-core.md)).
- Формат раздела каждого файла единый: **Назначение → Инициализация → Типы → Функции → Перехваты → Используемые API → Взаимодействия → Версионные ветки → Особенности**, в конце каждого документа — раздел о связях внутри группы.

Смежные материалы: `docs/scripts/` — автогенерируемый постраничный справочник по всем 169 файлам (объявления с сигнатурами; перегенерация — `python tools/gen_scripts_doc.py`), `docs/SCRIPTS.md` — карта скриптов, `docs/ISSUES.md` — известные проблемы; `ANALYSIS.md` (общий анализ проекта, формат `.v`), `tests/README.md` (тесты), `snegopat-client/README.txt` (инструкция пользователя), `dump-tools/README.md` (перенос на новые версии платформы).
