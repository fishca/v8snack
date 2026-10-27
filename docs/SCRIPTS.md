# Карта скриптов Снегопата (AngelScript + JScript)

Документ описывает **все** скрипты модуля `snegopat`: 47 файлов AngelScript движка
(`engine/*.as`), 30 файлов описаний интерфейсов платформы (`v8api/*.v`), ~85 скриптов
аддинов на JScript (`addins/**/*.js`) и модули `starter`/`main`.
Всего ≈ 70 000 строк.

Смежные документы: `ANALYSIS.md` — архитектура сборки и механизм vtable;
`docs/ISSUES.md` — известные проблемы и план их исправления.

---

## 1. Как всё устроено

```
starter.exe (x86) ──inject.dll──▶ 1cv8.exe (x64)
                                    └── core_as.dll (движок AngelScript)
                                          ├── modules/starter  (IPC со стартером)
                                          ├── modules/main     (winapi/com/sqlite API)
                                          └── modules/snegopat (сам Снегопат)
                                                ├── engine/*.as   — движок
                                                ├── v8api/*.v     — описания интерфейсов 1С
                                                └── addins/*.js   — аддины (JScript)
```

### Точка входа

| Файл | Что делает |
|---|---|
| `engine/main.as` | `run()` вызывается из `snegopat.dll` при создании окна заставки 1С. Заполняет таблицу классов символов, ставит пути, перехват `IProfileService.open` (после открытия профиля читаются настройки и инициализируются пакеты), перехват главного окна. |
| `engine/packets.as` | «Пакеты» — логические блоки функционала с зависимостями (`Packet(name, init, level, depends)`), инициализируются по уровням (`piOnMainEnter` и др.). |
| `engine/pathes.as` | Пути: `_main`, `_core`, `_addins`, `_tools`, `_data`, `_help`, `_tmp`. |
| `engine/addins.as` | Реестр аддинов, `Addin`/`AddinLoader` (загрузка `.js` через `AddinScript`). |
| `engine/scriptLoader.as` | `AddinScript` (ScriptSite) — компиляция и запуск JScript-аддинов, `SelfScript` — объект `SelfScript` в аддинах. |
| `engine/dllloader.as` | Загрузка аддинов-DLL (`GetAddinInfo`, `InitAddin`, `GetMacroses`, `InvokeMacros`). |

### Диагностика

`engine/diag.as` — единый механизм: файл `logs/diag.ini` (ключ=значение, «;» — комментарий,
перечитывается раз в 2 с без перезапуска). Ключи: `trace`, `hook.colors`, `hook.linebg`,
`hook.list`, `hook.liststale`, `hook.mainmenu`, `cat.*` (дампы), `templates.key`.
Журнал — `logs/script-log.txt` (UTF-16LE), ошибки скриптов — `logs/script-errors.txt`.

---

## 2. Движок: `engine/*.as` (47 файлов)

### Ядро и инициализация

| Файл | Строк | Назначение |
|---|---:|---|
| `main.as` | 236 | Точка входа `run()`, версия платформы, инициализация подсистем. |
| `packets.as` | 85 | Пакеты функционала и порядок инициализации. |
| `pathes.as` | 45 | Пути к папкам Снегопата. |
| `addins.as` | 311 | Реестр аддинов, `Addin`, `AddinLoader`, меню аддинов. |
| `scriptLoader.as` | 271 | Загрузка/выгрузка JScript-аддинов, `SelfScript`, обработка ошибок скриптов. |
| `dllloader.as` | 145 | Аддины-DLL. |
| `diag.as` | 542 | Диагностика: `diag.ini`, журнал, баннер, ротация, `diagAlways/diag/dbgHex`. |
| `settings_store.as` | 390 | Файловое хранилище настроек `data\Snegopat\settings\*.set` (вместо старого `snegopat.pfl`), подхват изменений других Конфигураторов. |
| `options.as` | 68 | Опции движка (`OptionsEntry`, чтение/запись значений). |
| `probe_ifaces.as` | 284 | Диагностика: какие интерфейсы поддерживает объект (QueryInterface). Сгенерировано из `v8api/*.v`. |
| `templates.as` | 97 | Автоподключение файла шаблонов текста 1С (`templates/*.st`) в профиль платформы. |
| `exitApp.as` | 50 | Обработчики завершения приложения (`ExitAppNotifier`, `BeforeExitAppNotifier`, отмена выхода). |
| `tests.as` | 48 | Внутренние тесты движка. |

### Окна, кадры, меню

| Файл | Строк | Назначение |
|---|---:|---|
| `mainframe.as` | 189 | Работа с главным окном: `EventTopLevelFrame`, `MyCommandState`, перехваты состояния команд. |
| `mainmenu.as` | 440 | Пункт «Снегопат» в главном меню: реверс менеджера панелей (`[ICommandService+0xD0]`), `addBand`, `registerCommands`, перехваты `updateState`/`hasHandler`, разделитель, выполнение команд через `transmitCommandTrap`. |
| `controls.as` | 522 | Перехват модальных окон, формы и контролы (`IV8Control`, `IV8Form`). |
| `forms.as` | 522 | Работа с формами: `designScriptForm`, `designInternalForm`, языковые настройки. |
| `grid.as` | 165 | Табличное поле (`IDataRow`, `IGridCtrl`, `ICellAppearance`). |
| `mlist.as` | 315 | Диалог списка методов модуля. |
| `synedit.as` | 567 | Внедрение редактора SynEdit (альтернатива штатному). |

### Текст и редактор

| Файл | Строк | Назначение |
|---|---:|---|
| `textwnd.as` | 1035 | Текстовые окна: перехваты клавиатуры/символов, `TextProcessor`, `EditorData`, точки останова, контекстное меню. |
| `colorer.as` | 3882 | Внедрение Scintilla: подсветка, точки останова, события редактора (`ScintillaDesignerEventsHandler`). |
| `sqlcolors.as` | 652 | Раскраска запросов и группировка `//{ //}`, многострочные строки, фон (`ITextExtBackColors`), нативная раскраска через `snegopat_colors.dll`. |
| `intellisite.as` | 684 | Список Снегопата (автодополнение): элементы, фильтрация, вставка. |
| `keywords.as` | 339 | Ключевые слова языка для списка Снегопата. |
| `typereader.as` | 467 | Элементы списка из типов/методов (`BuiltinFuncItem`, `TypeNameItem`). |
| `ModuleElements.as` | 350 | Элементы структуры модуля (методы/переменные) для списка методов. |
| `ModuleTextProcessor.as` | 726 | Обработка текста модуля: авто-замены, умный Enter, список Снегопата, классы символов. |
| `StockListInterceptor.as` | 641 | Перехват штатной контекстной подсказки 1С и подмена списком Снегопата (тайминги, устаревание списка). |
| `lexer.as` | 631 | Лексеры/парсеры (скриптовые и встроенные), чтение/запись файлов. |
| `smartboxitems.as` | 119 | Базовый элемент окна-списка (`SmartBoxItem`). |
| `com_textwindow.as` | 219 | Обёртка `ITextWindow` для аддинов (текст, выделение, вставка). |

### COM-объекты для аддинов (SnegAPI)

| Файл | Строк | Назначение |
|---|---:|---|
| `com_designer.as` | 610 | Объект `Designer` — корень SnegAPI: `Message`, `designScriptForm`, `sendCommand`, таймеры, очередь ошибок скриптов. |
| `com_snegopat.as` | 219 | Объект `snegopat`: версия, диагностика раскраски (`coloringProbe`, `coloringStress`, `coloringBackgroundProbe`), фон. |
| `com_events.as` | 247 | Объект `events`: подписка/отписка на события, обработчики команд, `transmitCommandTrap`. |
| `com_commands.as` | 103 | Команды: `ICommandState`, `CommandService`, `CommandDescription`. |
| `com_metadata.as` | 1101 | Метаданные: `IV8MetaData`, `IV8MDContainer`, `IMDObject` (открытие/сохранение, дерево). |
| `com_windows.as` | 873 | Окна 1С: заголовки, список окон, `IV8Windows`. |
| `com_files.as` | 314 | Файлы: `V8Files`, `MemoryBuffer`, кодировки, `IV8DataFile`. |
| `com_sqlite.as` | 372 | SQLite: запросы, `QueryResultProcessor`. |
| `com_profile.as` | 282 | Профиль 1С: `ProfileStore`, значения настроек. |
| `com_hotkeys.as` | 131 | Хоткеи: `IHotKey`, `IHotKeys`. |
| `com_debug.as` | 173 | Отладчик: `IDebugEvalProp`, `IDebugEvalResult`. |
| `com_v8value.as` | 75 | Значения 1С: `V8Value` (тип, представление, контекст). |
| `com_v8ti.as` | 137 | `ITypeInfo` для объектов 1С (просмотр в отладчике скриптов). |
| `add_global.as` | 878 | Встроенный аддин «global»: подключение глобальных контекстов к скриптам. |
| `develop.as` | 262 | Инструменты разработчика: дамп `sneg.d.ts`/`v8.d.ts`, трассировка команд. |

---

## 3. Описания интерфейсов платформы: `v8api/*.v` (30 файлов)

Формат `.v` — объявление интерфейсов 1С с GUID и раскладкой vtable (`:iface`, `:virt`,
`+N` — пропуск слотов). Подробности — `ANALYSIS.md`, раздел 2.

| Файл | Строк | Ключевые интерфейсы |
|---|---:|---|
| `window.v` | 470 | `IView`, `IWindowView`, `IFramedView`, `IFrame`, `ITopLevelFrame`, `ICommandService` |
| `metadata.v` | 594 | `IConfigMngrUI`, `ITypesInfoProvider`, `IDataProviderInfo`, `IMDContainer`, `IMDObject` |
| `text.v` | 300 | `IControlDesign`, `ITextManager`, `ITextEditor`, `ITextDoc` |
| `value.v` | 268 | `IType`, `IValue`, `IEnumValCreator` |
| `typeinfos.v` | 250 | `ITypeContextInfo`, `ITypeNameInfo`, `ISettingsConsumer` |
| `textcolors.v` | 127 | `IV8Color`, `ITextExtBackColors`, `ITextExtColors` |
| `command.v` | 123 | `ICommandState`, `ICommandTarget`, `ICommandReceiver` |
| `datasource.v` | 211 | `IV8DataSource`, `IGridUISource`, `IGrid` |
| `vt.v` | 153 | `IIndexedCollectionRO/FS`, `IValueArray` |
| `string.v` | 238 | `v8string` (SSO/длинные строки, ctor3, get_str) |
| `file.v` | 117 | `IFileSystem`, `IFile`, `IFileEx` |
| `profile.v` | 101 | `IProfileFolder`, `IProfileSource` |
| `process.v` | 107 | `IGlobalContext`, `IGlobalContextInit` |
| `form.v` | 130 | `IDocumentFactory`, `ILangSettings`, `ICustomFormDesigner` |
| `document.v` | 72 | `IPersistableDocument`, `IDocument`, `IPersistableObject` |
| `event.v` | 83 | `IEventRecipient`, `IIdleService`, `IIdleHandler` |
| `picture.v` | 83 | `IImage`, `IV8Picture`, `IGlyph` |
| `debugger.v` | 49 | `ICalcValueCreator`, `IExternalCalculatorDebugger` |
| `bkendui.v` | 233 | `MyMessageHandler` |
| `com.v` | 5 | `ICtx2Disp` |
| `textmgr.v` | 109 | Текст-менеджер (дополнение к `text.v`) |
| `scintilla.v` | 64 | Scintilla (константы, сообщения) |
| `textcolors` | — | см. выше |
| `colors_gate.v` | 27 | Гейт нативной раскраски |
| `stlstd.v` | 77 | STL-совместимые строки/векторы |
| `rect.v` | 38 | `Rect` |
| `font.v` | 17 | `Font` |
| `properties.v` | 8 | Свойства |
| `compositeid.v` | 24 | Составной CommandID |
| `TypeDomainPattern.v` | 44 | Образцы типов |
| `url.v` | 65 | URL/URI |

---

## 4. Аддины: `addins/**/*.js` (~85 файлов + `.epf`-формы)

Аддин = `.js` + одноимённый `.epf` (форма 1С), регистрируется в `addins/` и грузится
через `AddinScript`. Точка входа — `SelfScript`, доступ к API — через `designer`,
`snegopat`, `events`, `windows`, `textWindows`, `files`, `sqlite` и т. д.

### Корень `addins/` (41) — основные инструменты

| Аддин | Строк | Назначение |
|---|---:|---|
| `FuncProcPanel.js` | 2098 | Панель функций/процедур модуля |
| `extSearchReplace.js` | 2338 | Расширенный поиск/замена |
| `extfiles.js` | 1257 | Внешние файлы |
| `mdNavigator.js` | 1142 | Навигатор по метаданным |
| `SessionManager.js` | 1079 | Менеджер сеансов |
| `wndpanel.js` | 1065 | Панель окон |
| `BookMarkers.js` | 908 | Закладки |
| `SpellChecker.js` | 861 | Орфография |
| `DebugInstruments.js` | 782 | Инструменты отладки |
| `refactoring.js` | 758 | Рефакторинг |
| `textEditorExt.js` | 730 | Расширения редактора |
| `snippets.js` | 684 | Сниппеты |
| `silence.js` | 655 | Подавление диалогов платформы |
| `format.js` | 492 | Форматирование кода |
| `qs.js` | 459 | Быстрые команды |
| `ToDoList.js` | 439 | Список TODO |
| `RegExpEditor.js` | 361 | Редактор регулярных выражений |
| `author.js` | 335 | Подстановка автора |
| `type_finder.js` | 325 | Поиск типа |
| `VimComplete.js` | 309 | Vim-дополнение |
| `editor_colors.js` | 308 | Настройка цветов редактора |
| `CfgStore.js` | 294 | Хранилище конфигурации |
| `stg_autoconnect.js` | 277 | Автоподключение к хранилищу |
| `Autosave.js` | 274 | Автосохранение |
| `bsl_analyze.js` | 244 | Анализ BSL |
| `debugHelpers.js` | 239 | Хелперы отладки |
| `choiceSubSystem.js` | 236 | Выбор подсистемы |
| `AnalizeEventSubscript.js` | 166 | Анализ подписок на события |
| `RunEnterprise.js` | 157 | Запуск 1С:Предприятия |
| `my_macros.js` | 152 | Свои макросы (custom) |
| `queryParamsExtractor.js` | 142 | Извлечение параметров запроса |
| `git_blame.js` | 141 | Git blame |
| `auto_module_pwd.js` | 140 | Пароль модуля |
| `git_common.js` | 138 | Общее для git-аддинов |
| `jump2refs.js` | 133 | Переход к ссылкам |
| `configCaption.js` | 115 | Заголовок конфигурации |
| `selectColumn.js` | 92 | Выбор колонки |
| `vtcreator.js` | 83 | Создание vtable-описаний |
| `choiceHelpTopic.js` | 75 | Выбор темы справки |
| `query_colors.js` | 63 | Раскраска запросов (аддин) |
| `sc_clear.js` | 25 | Очистка |

### `addins/std/` (16) — стандартные аддины (всегда загружены)

| Аддин | Строк | Назначение |
|---|---:|---|
| `all.js` | 4673 | Объединённая сборка стандартных аддинов |
| `marked.js` | 1295 | Markdown-просмотр |
| `snegopatwnd.js` | 1070 | Окно настроек Снегопата |
| `std.js` | 515 | Базовые функции std |
| `commands.js` | 427 | Команды |
| `macroswnd.js` | 336 | Окно макросов |
| `scintilla.js` | 284 | Обёртка Scintilla |
| `errorlog.js` | 271 | Журнал ошибок |
| `profile_autosave.js` | 251 | Автосохранение профиля |
| `hotkeys.js` | 239 | Хоткеи |
| `repo.js` | 229 | Хранилище |
| `select_scripts.js` | 210 | Выбор скриптов |
| `snegopat.js` | 176 | Базовый аддин Снегопата |
| `help.js` | 119 | Справка |
| `editors.js` | 99 | Редакторы |
| `main.js` | 60 | Инициализация std |

### `addins/Libs/` (12) — библиотеки

`jshint.js` (4624, линтер), `log4js.js` (2716, логирование), `jsUnitCore.js` (1063, тесты),
`TextWindow.js` (543, обёртка окна), `SyntaxAnalysis.js` (509), `ScriptForm.js` (380),
`StreamLib.js` (339), `SelectValueDialog.js` (325), `NotifySend.js` (234), `winapi.js` (180),
`SettingsManagement.js` (84), `TextChangesWatcher.js` (74).

### `addins/dvcs/` (8) — интеграция с VCS

`dvcs_fossil.js` (852), `dvcs_bzr.js` (434), `dvcs_git.js` (434), `diff_doc.js` (231),
`logview.js` (185), `preCommitHookRedmine.js` (155), `diff-v8Reader.js` (119), `diff_1C.js` (32).

### `addins/code_gen/` (4) — генерация кода

`gen_mgr.js` (317), `create_refs.js` (196), `create_doc.js` (133), `create_type.js` (93).

### Прочее

`addins/DevTools/` — `immediate.js` (142, немедленное выполнение), `pflview.js` (121, просмотр профиля);
`addins/FavCommands/FavoriteCommands.js` (282, избранные команды); `addins/custom/my_macros.js` (152).

---

## 5. Модули `starter` и `main`

| Файл | Строк | Назначение |
|---|---:|---|
| `modules/starter/src/*.as` | 111 | IPC со стартером (`StarterInterProcess`), запуск Конфигуратора. |
| `modules/main/api/winapi.v` | — | WinAPI для скриптов (`GetTickCount`, `CreateDirectory`, диалоги…). |
| `modules/main/api/com.v` | — | COM-базовые объявления. |
| `modules/main/api/sqlite.v` | — | SQLite API. |
| `modules/main/src/network.as` | 7076 байт | Сеть (загрузка/проверка обновлений). |
| `modules/main/src/winapi.as` | 3929 байт | Реализация WinAPI-обёрток. |

---

## 6. Точки расширения

**Новый аддин.** Положить `addins/<имя>.js` + `addins/<имя>.epf`; в `SelfScript` объявить
`macros*`-функции; аддин появится в меню аддинов. Форма загружается
`loadFormForScript(SelfScript)`.

**Новый перехват.** `TrapVirtualStdCall` на слот интерфейса из `v8api/*.v`
(`tr.setTrap(getService(IID_...), слот, мояФункция)`), в перехвате — `tr.swap()` до/после.
Слоты берутся из объявлений `.v`; при переносе на новую платформу — `dump-tools/`.

**Пункт меню.** `engine/mainmenu.as`: пункт добавляется в панель
(`{B78F2E80-…}/52` — «Сервис», `/1` — главное меню) через `addBand`; разделитель —
item-образец команды `{9D0A2E40-…}/0`; обработка — `mainMenuOnCommand` в `com_events.as`.

**Раскраска.** `engine/sqlcolors.as`: `hook.colors` (перехват цветов), `hook.linebg`
(фон многострочных строк), `snegopat_colors.dll` (нативная часть). Диагностика —
`snegopat.coloringProbe/coloringStress/coloringBackgroundProbe`.

**Настройки.** Файлы `data\Snegopat\settings\<раздел>.set` (см. `settings_store.as`);
опции движка — `OptionsEntry` в `options.as`/`main.as`.

---

## 7. Переключатели `logs/diag.ini`

| Ключ | По умолчанию | Что делает |
|---|---|---|
| `trace` | on | подробный журнал |
| `hook.colors` | on (8.3.17/8.3.27), off (прочие) | перехват цветов редактора (раскраска запросов) |
| `hook.linebg` | — | заливка фона многострочных строк |
| `hook.list` | on | свой список подсказки вместо штатного |
| `hook.liststale` | on | проверка устаревания списка |
| `hook.mainmenu` | on | пункт «Снегопат» в меню |
| `cat.vt`, `cat.mdi` | off | тяжёлые дампы vtable (только для диагностики) |
| `templates.key` | — | ключ профиля для файла шаблонов |
