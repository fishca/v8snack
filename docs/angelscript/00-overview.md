# AngelScript-движок Снегопата: обзор архитектуры

Документ описывает скриптовую часть «Снегопата» (v8snack) — модули на языке AngelScript, исполняемые движком Core.As (`core_as.dll`) внутри процесса Конфигуратора 1С. Скрипты лежат в `snegopat-client/x64/modules/`; подробные разборы по подсистемам — в соседних файлах этого каталога (см. [README.md](README.md)).

## 1. Модули Core.As и их сборка

| Модуль | Где | module.info | Состав |
|---|---|---|---|
| `snegopat` | `x64/modules/snegopat/` | `src = engine, .\|modules\starter\src\ipc`<br>`api = v8api`<br>`lib = snegopat.dll` | 47 файлов `.as` (~20 700 строк) в `engine/`, описания интерфейсов платформы в `v8api/*.v`, нативная `snegopat.dll` |
| `main` | `x64/modules/main/` | (без module.info — базовый модуль самого Core.As) | `src/winapi.as`, `src/network.as`; API в `api/winapi.v` (414 строк), `api/com.v`, `api/sqlite.v` |
| `starter` | `x64/modules/starter/` | `lib = .\|starter.exe` | `src/main.as` (точка входа стартера), `src/ipc/ipc.as` (общий IPC-код) |

Ключевые факты о сборке:

- `module.info` — INI-подобный файл (кодировка cp1251), секция `[info]`: `descr` — описание, `src` — папки с исходниками (через запятую), `api` — папка с описаниями интерфейсов `.v`, `lib` — нативная библиотека, которую движок загружает и которой «обслуживает» модуль.
- Файлы `engine/*.as` компилируются движком Core.As **только при переводах строк LF** (при CRLF `core_as.dll` дважды регистрирует typedef-ы из `api/winapi.v` — ошибка `RegisterTypedef`; в репозитории это гарантировано `.gitattributes` `* text=auto eol=lf`).
- Строки `#pragma once` и `#include "../all.h"` в шапках файлов нужны **только для среды разработки** (подсветка синтаксиса) и вырезаются препроцессором Core.As; файла `all.h` в репозитории нет.
- Кодировка исходников — UTF-8 (с BOM или без).
- Препроцессор Core.As поддерживает условную компиляцию по версии платформы: `#if ver >= 8.3.27 & ver < 8.3.28`, `#elif`, `#else`, `#endif`, а также `#if test = 1` (отладочные включения, напр. дампы vtable в main.as) и `#if x86 / #else` (разрядность). Версии сравниваются покомпонентно (2–4 части: `8.5` покрывает все `8.5.x`).
- Описания интерфейсов `.v` (`v8api/*.v`, `main/api/*.v`) объявляют COM-интерфейсы платформы: `:iface Имя {GUID}`, `:base`, раскладку слотов `:virt` (`+N` — пропуск слота, голое число — абсолютный слот), версионные ветки `#if ver ...`. Из них движок генерирует константы слотов `I<Интерфейс>_<метод>` (например `IWindowView_createWindow`), используемые в `setTrap`. Подробно формат описан в `ANALYSIS.md` (раздел 2) и `tests/vparse.py`.

## 2. Загрузочная цепочка

1. `starter.exe` (x86-процесс) запускается пользователем до Конфигуратора; его скриптовый модуль `starter` (`src/main.as`) создаёт объект `StarterInterProcess` (см. [08-main-starter.md](08-main-starter.md)) и окно класса `Core.As.Starter` для IPC.
2. Стартер через `lib/x64/inject.dll` внедряет `core_as.dll` в процесс `1cv8.exe` (x64) и загружает модуль `snegopat`.
3. `core_as.dll` компилирует модуль (папки из `module.info`), регистрирует API из `.v`, вызывает скриптовую `main(array<string>&&)`.
4. Нативная `snegopat.dll` (заявлена в `lib` модуля) WH_CBT-хуком ловит создание окна заставки 1С и вызывает экспортируемую из скриптов функцию **`run()`** — в этот момент все DLL платформы загружены, но основное окно ещё не создано, и часть вызовов ещё небезопасна (main.as:1-9).
5. `run()` (main.as:24-39) выполняет раннюю инициализацию:
   - запоминает `myFolder = env.moduleDir`, `v8ver = env.processVersion`, `ownerName = env.ownerName`, `snegoVersion = env.strCoreAsVersion`; расшифровывает версию платформы в строку `sv8ver` ("8.3.27.1989") из упакованного `uint64` (main.as:30-31);
   - `diagBanner()` — баннер диагностики (diag.as);
   - `initSymbolClassTable()` (main.as:49-58) — заполняет нативную таблицу `symbolClassTable` классами символов (`symbSpace`/`symbAlpha`) для кодов 33…0xFFFF; этой таблицей пользуются `is_name_symbol`/`my_is_alpha` из ModuleTextProcessor.as и нативный парсер;
   - `initPathes()` (pathes.as) — пути;
   - `initSnegopatProfile()` (main.as:64-66) — ставит перехват `IProfileService_open` (`trProfileOpen.setTrap(getProfileService(), IProfileService_open, IProfileService_openTrap)`), чтобы в момент открытия профиля платформой выполнить `initAllOption()` (options.as) и `initPackets(piOnMainEnter)`;
   - `initWorkWithMainFrame()` (mainframe.as) — перехваты главного окна.
6. Дальнейшая инициализация разбита на **пакеты**, запускаемые по уровням: `piOnMainEnter` (после открытия профиля), `piOnMainWindow` (создано главное окно), `piOnFirstIdle` (первый простой), `piOnDesignerInit` (инициализация дизайнера).

## 3. Система пакетов (packets.as, 85 строк)

Пакет — «логически связная часть функционала, которая требует инициализации при загрузке». Регистрация — простое создание глобальной переменной:

```as
Packet pktTxtWork("TxtWork", setTextHooks, piOnMainEnter);            // без зависимостей
Packet pkMainMenu("MainMenu", initMainMenu, piOnFirstIdle);           // mainmenu.as
Packet stdListIntercept("stdListIntercept", hookStdList, piOnMainEnter); // StockListInterceptor.as
```

- Класс `Packet` (packets.as:26-41): поля `next`, `_name`, `_depends` (`array<string>&&`), `_level` (`PacketsInitLevel`), `_init` (`InitPacket&&` — `funcdef bool InitPacket()`). Конструктор вставляет пакет в глобальный односвязный список `firstPacket` (LIFO-порядок регистрации).
- `enum PacketsInitLevel` (packets.as:17-22): `piOnMainEnter, piOnMainWindow, piOnFirstIdle, piOnDesignerInit`.
- `initPackets(level)` (packets.as:45-85): многократно проходит по списку, пытаясь загрузить пакеты данного уровня, чьи зависимости (по имени, без учёта регистра — `NoCaseSet loadedPackets`) уже загружены; init-функтор возвращает `bool` — успех. Если после прохода остались незагруженные и ни один новый не загрузился — печатает `Print("Не смогли загрузиться следующие пакеты: …")`.
- Смысл: порядок инициализации выводится из декларированных зависимостей, а не из порядка файлов.

## 4. Система опций (options.as + settings_store.as)

- Настройки движка хранятся **не** в профиле платформы, а в собственных файлах `data/Snegopat/settings/*.set` (settings_store.as); папка `data` должна быть доступна для записи (main.as:61-63).
- Декларация опции — глобальная переменная `OptionsEntry("ИмяОпции", функтор-дефолта, функтор-чтения, функтор-записи)`; третий функтор вызывается при изменении опции пользователем и обычно применяет её немедленно (пример в main.as:79-81: опция `EnableTextWork` при записи вызывает `setTextHooks()` и предупреждает, что подсказка заработает только в новых окнах).
- `initAllOption()` вызывается в `IProfileService_openTrap` (main.as:68-75) — читает все опции из хранилища.
- Каталог опций по подсистемам см. в разборах файлов (в каждой группе перечислены её `OptionsEntry`): `EnableTextWork`, `UseLangs`, `ListWidth`, `AllowFilterInSmartList`, `InsertTextOnDot`, `CamelSearchOnUpperOnly`, `HookStdList`, `EnableHidingRemark`, `Autoreplace`, `EnableSmartEnter`, `EnableSmartList`, `QuickActivateCharsCount` и др.

## 5. Механизм перехватов (traps)

Центральный приём всего движка — подмена слотов vtable платформенных COM-интерфейсов:

- Класс `TrapVirtualStdCall` (нативный, Core.As):
  - `setTrap(объект, I<Имя>_<слот,константа>, функтор-хук)` — установить перехват слота;
  - `swap()` — переключить состояние «включён/выключен» (включённый перехват можно временно выключить, чтобы вызвать оригинал);
  - `getOriginal(&&func)` — получить функтор вызова оригинального метода;
  - свойство `state`: `trapNotActive` (ещё не установлен), `trapEnabled`, `trapDisabled`.
- Хук — функция с сигнатурой оригинального метода (первый параметр — ссылка на интерфейс). Типовой шаблон: `swap()` → вызов оригинала → `swap()` → собственная обработка (см. `TxtMgrOper_setExtender`, main.as:226-236).
- Для функций с неизвестной/неописанной раскладкой аргументов есть «сырые» хуки (`...TrapRaw`, funcdef из одних `size_t`) — так сделан перехват `IAssistList_getDataSource` для 8.3.24–8.3.27, где типизированные ссылки портили выходные параметры платформы (StockListInterceptor.as:146-205).
- Отладочный дамп vtable: `dumpVtable(&&интерфейс, "имя")` под `#if test = 1` — инструмент переноса на новые версии платформы (см. `dump-tools/`).

## 6. Перехватчики текстовых окон (main.as, setTextHooks)

Цепочка перехватов, через которую движок получает контроль над всеми текстовыми окнами Конфигуратора (вкл/выкл — опция `EnableTextWork`, пакет `TxtWork`):

1. Создаётся эталонный `TxtEdtCtrl` (`currentProcess().createByClsid(CLSID_TxtEdtCtrl, IID_IWindowView, wnd)`) и ставятся перехваты `IWindowView_createWindow` → `TxtEdtCtrl_createWindow` и `ICommandTarget_onExecute` → `TxtCtrCommand_onExecute` (main.as:92-106).
2. Создаётся эталонный `TxtEdtDoc` (`CLSID_TxtEdtDoc, IID_IDocument`): перехват `ITextManager_Operations_setExtenderCLSID` → `TxtMgrOper_setExtender` (момент назначения документу текстового расширения — тут определяется тип модуля) и `IDocument_createView` → `TxtDoc_createView` (main.as:108-124).
3. При первом создании view (`TxtDoc_createView`, main.as:138-159) ставится перехват `IWindowView_createWindow` → `TxtEdtView_createWindow` и `ICommandTarget_onExecute` → `TxtEdtCommand_onExecute` уже на реальном окне; результат возвращается платформе с корректным подсчётом ссылок.
4. Хуки `TxtEdtCtrl_createWindow`/`TxtEdtView_createWindow` (main.as:184-210) вызывают оригинал (с диагностикой `diagAlways("win", ...)` «до/после») и передают созданное окно в `onCreateTextWnd(view, isCtrl, parent)` (textwnd.as) — там окно регистрируется и к нему привязывается `TextDoc`/`TextProcessor`.
5. `checkCommandAndHideSmartBox` (intellisite.as:657-684) — тело хуков `onExecute`: прячет открытый список подсказки перед любой разрешённой командой платформы.
6. `TxtMgrOper_setExtender` (main.as:226-236) вызывает `changeTextExtender(itm, clsid)` (textwnd.as) — выбор реализации `TextProcessor` по CLSID расширения (например `gTextExtModule` → `ModuleTextProcessor`).

## 7. Встроенный аддин «global» (add_global.as, 878 строк)

Мост к глобальным контекстам платформы 1С (то, что в встроенном языке доступно как `Сообщить`, `НайтиФайлы` и т.п.) для JScript-аддинов:

- Класс `AddinGlobal : BuiltinAddin` (add_global.as:39-50) — встроенный аддин с уникальным именем `"global"`, описанием «Подключение глобальных контекстов»; свойство `object()` возвращает `IDispatch`, созданный из AngelScript-объекта `GlobalAddinObject` (`createDispatchFromAS`).
- Подключение из аддина: `addins.byUniqueName("global").object.connectGlobals(SelfScript)` либо директива в шапке скрипта `//addin: global` + `global.connectGlobals(SelfScript)` (add_global.as:19-33).
- `GlobalAddinObject.connectGlobals(SelfScript&& ss)` (63-68): добавляет каждому скрипту именованные объекты `gc0`, `gc1`, … — по одному на подключённый глобальный контекст платформы (`ss.addNamedItem("gc" + i, context, true)`).
- Контексты собираются `addGC(guid)` → `oneDesigner.globalContext(guid).getDispatch()`. В файле обширная «исследовательская» документация в комментариях `/*@ … @*/`: для каждого GUID перечислены методы/свойства с пометками `+` (работает), `-` (не работает), без пометки (не проверено).
- Подключённые контексты (GUID → DLL → что примечательно):

| GUID | DLL | Проверенно работающее (+) |
|---|---|---|
| `{D041F9A0-476B-4558-8EFC-D895DC695E72}` | frame.dll | `ButtonPictureLocation`, `QuestionDialogMode` (перечисления) |
| `{22A21030-E1D6-46A0-9465-F0A5427BE011}` | ext.dll | `NumberInWords`, `FindFiles` (файловые операции) |
| `{B8542F1F-3296-45EF-9891-59DAFA57B67C}` | mngbase.dll | `PutToTempStorage`, `GetFromTempStorage`, `DeleteFromTempStorage` |
| `{38406666-F954-489E-BB5B-B0E6C0C81AFB}` | frntend.dll | `DoMessageBox` (Предупреждение), `DoQueryBox` (Вопрос), `InputString/InputNumber/InputDate/InputValue` (результат из JScript недоступен — параметры по значению; обход через snegopatwnd.js), `Beep`, `GetCaption/SetCaption`, `SaveValue/RestoreValue`, `Exit/Terminate`, `LockApplication`, `ClearMessages`, `Status`, `OpenHelpContent/OpenHelpIndex/CloseHelp`, `MainStyle`, `WorkingDate` |
| `{2482FC4E-012A-4E97-88A1-77DE6EC8DEA2}` | extui.dll | `FileDialogMode` |
| `{593796CF-D334-4E0C-963A-8F67DE0625A6}` | xml2.dll | (XML-сериализация, без пометок «+») |
| `{1373BA1B-0DCB-47DA-8A46-D9CF64F3DECA}` | mngcore.dll | (перечисления форм) |
| `{C96430EF-26D9-4B53-87C7-05036A39E73C}` | core82.dll | `ValueIsFilled` (ЗначениеЗаполнено) |
| `{4A993AB7-2F75-43CF-B34A-0AD9FFAEE7E3}` | backend.dll | `Message` (Сообщить), `GetRealTimeTimestamp`, `WriteLogEvent`, `CurrentLanguage`, `ValueToStringInternal/ValueFromStringInternal` (ЗначениеВСтрокуВнутр/ИзСтрокиВнутр), `ComputerName`, `UserName`, `UserFullName`, `BinDir`, `TempFilesDir`, `CurrentLocaleCode`, `InfoBaseLocaleCode`, `InfoBaseConnectionString`, `ApplicationPresentation`, `GetInfoBaseConnections`, `InfoBaseSessionNumber`, `ConfigurationChanged`, `DataBaseConfigurationChangedDynamically`, `CurrentSystemLanguage`; свойство `Metadata` (Метаданные) |
| `{C6B82646-54E9-4151-97A2-704D2DD57E9F}` | xdto.dll | (XDTO-фабрика) |
| `{F9DB1621-C863-11D5-A3C1-0050BAE0A776}` | basicui.dll | (FileCompareMethod) |
| `{5ABA21A1-5571-4FE5-885C-44928B6CCA88}` | mngui.dll | `System` (КомандаСистемы), `RunApp` (ЗапуститьПриложение) |

Отключённые (закомментированные) контексты: схема (`scheme.dll`), диаграммы (`chart.dll`), перечисления (`enums.dll`), `backbas.dll`, `map.dll`, `calc.dll`, `accnt.dll`, `fmtd.dll`, `dcs.dll`, `dcscore.dll`, `bp.dll`, `addin.dll`, второй контекст `backend.dll`, `basic.dll` (с пометкой `-Catalogs` — справочники из Конфигуратора недоступны), `ws.dll`, `bpui.dll`, `richui.dll`, `htmlui.dll`, `moxel.dll`, `dcsui.dll`.

## 8. Карта файлов движка `engine/`

| Файл | Строк | Подсистема | Подробно |
|---|---|---|---|
| `main.as` | 236 | Точка входа `run()`, перехватчики текстовых окон | этот документ, §2, §6 |
| `packets.as` | 85 | Система пакетов инициализации | этот документ, §3 |
| `add_global.as` | 878 | Аддин «global» — глобальные контексты 1С | этот документ, §7 |
| `pathes.as` | — | Пути модуля | [01-core.md](01-core.md) |
| `options.as` | — | Реестр опций | [01-core.md](01-core.md) |
| `settings_store.as` | — | Хранилище настроек *.set | [01-core.md](01-core.md) |
| `diag.as` | 542 | Диагностика: diag.ini, журналы, трассировка | [01-core.md](01-core.md) |
| `dllloader.as` | — | Загрузка DLL из скриптов | [01-core.md](01-core.md) |
| `scriptLoader.as` | — | Загрузка внешних скриптов (myscript) | [01-core.md](01-core.md) |
| `addins.as` | — | Реестр аддинов (BuiltinAddin, загрузка .js/.epf) | [01-core.md](01-core.md) |
| `exitApp.as` | — | Обработчики выхода (`exitAppHandlers`) | [01-core.md](01-core.md) |
| `tests.as` | — | Внутренние тесты движка | [01-core.md](01-core.md) |
| `develop.as` | — | Инструменты разработки | [01-core.md](01-core.md) |
| `probe_ifaces.as` | — | Зондирование интерфейсов | [01-core.md](01-core.md) |
| `templates.as` | — | Шаблоны текста | [01-core.md](01-core.md) |
| `com_snegopat.as` | — | Главный COM-объект `snegopat` для аддинов | [02-com-designer.md](02-com-designer.md) |
| `com_designer.as` | — | Обёртка дизайнера (`oneDesigner`) | [02-com-designer.md](02-com-designer.md) |
| `com_commands.as`, `com_events.as`, `com_files.as`, `com_hotkeys.as`, `com_profile.as` | — | Команды, события, файлы, горячие клавиши, профиль | [02-com-designer.md](02-com-designer.md) |
| `com_debug.as` | 173 | Отладчик 1С — исследовательский черновик | [02-com-designer.md](02-com-designer.md) |
| `com_windows.as` | 873 | Окна Конфигуратора (`wnds`) | [03-com-windows-metadata.md](03-com-windows-metadata.md) |
| `com_textwindow.as` | — | Текстовое окно для аддинов | [03-com-windows-metadata.md](03-com-windows-metadata.md) |
| `com_metadata.as` | 1101 | Метаданные конфигурации | [03-com-windows-metadata.md](03-com-windows-metadata.md) |
| `com_v8ti.as`, `com_v8value.as`, `com_sqlite.as` | — | Type info, значения 1С, SQLite | [03-com-windows-metadata.md](03-com-windows-metadata.md) |
| `colorer.as` | 3882 | Раскраска кода (SciLexer) | [04-coloring.md](04-coloring.md) |
| `sqlcolors.as` | 652 | Раскраска запросов | [04-coloring.md](04-coloring.md) |
| `lexer.as` | 631 | Лексер языка 1С | [05-editor.md](05-editor.md) |
| `synedit.as` | 567 | Синтаксическое редактирование | [05-editor.md](05-editor.md) |
| `textwnd.as` | 1035 | Владение текстовыми окнами, TextDoc/TextProcessor | [05-editor.md](05-editor.md) |
| `mainframe.as` | — | Главный фрейм, idle-очередь | [06-ui.md](06-ui.md) |
| `mainmenu.as` | 440 | Пункт меню «Снегопат» | [06-ui.md](06-ui.md) |
| `controls.as`, `grid.as`, `forms.as` | — | Контролы, таблицы, формы Снегопата | [06-ui.md](06-ui.md) |
| `intellisite.as` | 684 | Список подсказок | [07-intellisense.md](07-intellisense.md) |
| `mlist.as` | 315 | Диалог «Методы модуля» (Ctrl+1) | [07-intellisense.md](07-intellisense.md) |
| `smartboxitems.as` | 119 | Базовые типы списка | [07-intellisense.md](07-intellisense.md) |
| `keywords.as` | 339 | Ключевые слова и директивы | [07-intellisense.md](07-intellisense.md) |
| `StockListInterceptor.as` | 641 | Перехват штатной подсказки | [07-intellisense.md](07-intellisense.md) |
| `ModuleTextProcessor.as` | 726 | Процессор модулей, сборка подсказки | [07-intellisense.md](07-intellisense.md) |
| `ModuleElements.as` | 350 | Разбор структуры модуля | [07-intellisense.md](07-intellisense.md) |
| `typereader.as` | 467 | Словари платформы | [07-intellisense.md](07-intellisense.md) |
| `modules/main/src/*.as` | 340 | Константы WinAPI и сети (модуль `main`) | [08-main-starter.md](08-main-starter.md) |
| `modules/starter/src/*.as` | 111 | Стартер и IPC | [08-main-starter.md](08-main-starter.md) |

## 9. Полезные глобальные сущности движка (сквозной указатель)

Сущности, на которые ссылаются многие файлы (объявлены в соответствующих файлах, см. разборы):

- `env.*` — среда Core.As: `moduleDir`, `processVersion`, `ownerName`, `strCoreAsVersion`.
- `currentProcess()` — COM-процесс платформы (`createByName`/`createByClsid`/`getCategoryClasses`/`getService`).
- `getProfileService()` / `getProfileRoot()` — профиль платформы и корень настроек Снегопата.
- `mainFrame` — главный фрейм Конфигуратора (mainframe.as), `sendCommandToMainFrame(CommandID(...))`, `commandState(id)`.
- `activeTextWnd` — активное текстовое окно (textwnd.as).
- `oneDesigner` — обёртка дизайнера (com_designer.as); `oneSnegopat`/объект `snegopat` — главный объект аддинов (com_snegopat.as).
- `TrapVirtualStdCall`, `I<Интерфейс>_<метод>` — константы слотов из `.v`.
- `mem::byte/word/dword/int_ptr/memcpy` — прямой доступ к памяти; `toIUnknown`, `stringFromAddress`, `ThunkToFunc` — мосты между мирами.
- `diag(...)`, `diagAlways(категория, ...)`, `dbgLog(...)` — диагностика (diag.as); категория включается через `logs/diag.ini`.
- `NoCaseSet`/`NoCaseMap`/`grid`/`Vector`/`GuidRef` — контейнеры Core.As; `PVV(...)` — обёртка метода в функтор.
- `symbolClassTable`, `symbSpace`/`symbAlpha` — таблица классов символов (наполняется в main.as).
